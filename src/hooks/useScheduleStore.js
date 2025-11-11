import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'daphos_schedule_shifts';

// Shift types (labels shown in the UI)
export const SHIFT_TYPES = {
  DAY_SHIFT: 'Day',
  ON_CALL: 'On-call',
  MEETING: 'Meeting',
  POST_CALL_REST: 'Post-call rest',
};

// Default hours used to prefill the form
export const DEFAULT_HOURS = {
  DAY_SHIFT: { start: '09:00', end: '17:00' },
  ON_CALL: { start: '20:00', end: '08:00' }, // example default on-call hours
  MEETING: { start: '10:00', end: '11:00' }, // default meeting 1 hour
  POST_CALL_REST: { start: '', end: '' }, // rest shifts have no times
};

// --- Fonctions utilitaires ---
const getShiftsFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

// Find the next day's DAY_SHIFT for the same employee (used by business logic)
const findNextDayShift = (allShifts, employeeId, dayIndex) => {
  const nextDayIndex = (dayIndex + 1) % 7; // handle Sunday -> Monday wrap
  return allShifts.find(s => 
    s.employeeId === employeeId && 
    s.dayIndex === nextDayIndex && 
    s.type === 'DAY_SHIFT'
  );
};

// Convert time string (HH:MM) to minutes since midnight for comparison
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Check if two time ranges overlap
const timesOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

// Split a day shift if a meeting overlaps it
const splitDayShiftsByMeeting = (shifts) => {
  let result = [...shifts];
  
  // Find all meetings and split day shifts that overlap with them
  const meetings = result.filter(s => s.type === 'MEETING');
  const daysToSplit = result.filter(s => s.type === 'DAY_SHIFT');
  
  for (const meeting of meetings) {
    for (const dayShift of daysToSplit) {
      if (
        dayShift.employeeId === meeting.employeeId &&
        dayShift.dayIndex === meeting.dayIndex &&
        timesOverlap(dayShift.start, dayShift.end, meeting.start, meeting.end)
      ) {
        // Remove the original day shift
        result = result.filter(s => s.id !== dayShift.id);
        
        const meetingStart = timeToMinutes(meeting.start);
        const meetingEnd = timeToMinutes(meeting.end);
        const dayStart = timeToMinutes(dayShift.start);
        const dayEnd = timeToMinutes(dayShift.end);
        
        // Create before-meeting segment if there's time
        if (dayStart < meetingStart) {
          result.push({
            id: uuidv4(),
            employeeId: dayShift.employeeId,
            dayIndex: dayShift.dayIndex,
            type: 'DAY_SHIFT',
            start: dayShift.start,
            end: meeting.start
          });
        }
        
        // Create after-meeting segment if there's time
        if (meetingEnd < dayEnd) {
          const afterMinutes = dayEnd;
          const afterHours = Math.floor(afterMinutes / 60);
          const afterMins = afterMinutes % 60;
          result.push({
            id: uuidv4(),
            employeeId: dayShift.employeeId,
            dayIndex: dayShift.dayIndex,
            type: 'DAY_SHIFT',
            start: meeting.end,
            end: `${String(afterHours).padStart(2, '0')}:${String(afterMins).padStart(2, '0')}`
          });
        }
      }
    }
  }
  return result;
};

// Merge overlapping shifts of the same type on the same day
const mergeOverlappingShifts = (shifts) => {
  const merged = [...shifts];
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < merged.length; i++) {
      for (let j = i + 1; j < merged.length; j++) {
        const s1 = merged[i];
        const s2 = merged[j];
        // Merge if same employee, same day, same type (but not POST_CALL_REST) and times overlap
        if (
          s1.employeeId === s2.employeeId &&
          s1.dayIndex === s2.dayIndex &&
          s1.type === s2.type &&
          s1.type !== 'POST_CALL_REST' &&
          timesOverlap(s1.start, s1.end, s2.start, s2.end)
        ) {
          // Merge: take earliest start and latest end
          const newStart = [s1.start, s2.start].sort()[0];
          const newEnd = [s1.end, s2.end].sort()[s1.end === s2.end ? 0 : 1];
          merged[i] = { ...s1, start: newStart, end: newEnd };
          merged.splice(j, 1);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }
  return merged;
};

// --- Hook principal ---
export function useScheduleStore() {
  const [allShifts, setAllShifts] = useState(() => getShiftsFromStorage());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allShifts));
    // Notify other parts of the app that shifts changed (for components that don't share hook instance)
    try {
      window.dispatchEvent(new CustomEvent('shiftsUpdated'));
    } catch {
      // ignore if not available (SSR)
    }
  }, [allShifts]);

  /**
   * Add a shift (applies post-call rest logic, prevents overlaps, enforces meeting constraints, splits day shifts)
   */
  const addShift = (shiftData) => {
    // If the day already has a POST_CALL_REST, only MEETING is allowed on that day.
    // (Previously we blocked meetings on post-call rest days which was incorrect.)
    const dayHasRest = allShifts.some(s =>
      s.employeeId === shiftData.employeeId &&
      s.dayIndex === shiftData.dayIndex &&
      s.type === 'POST_CALL_REST'
    );
    if (dayHasRest && shiftData.type !== 'MEETING') {
      console.warn('Only meetings are allowed on days with post-call rest');
      return;
    }

    const newShift = { id: uuidv4(), ...shiftData };
    let newShiftsList = [...allShifts, newShift];

    // Split day shifts if a meeting overlaps them
    newShiftsList = splitDayShiftsByMeeting(newShiftsList);

    // Merge overlapping shifts of same type
    newShiftsList = mergeOverlappingShifts(newShiftsList);

    // BUSINESS LOGIC: If an ON_CALL is added...
    if (newShift.type === 'ON_CALL') {
      const nextDayShift = findNextDayShift(newShiftsList, newShift.employeeId, newShift.dayIndex);
      
      if (nextDayShift) {
        // ...convert the next day's DAY_SHIFT into a POST_CALL_REST
        newShiftsList = newShiftsList.map(s => 
          s.id === nextDayShift.id ? { ...s, type: 'POST_CALL_REST', start: '', end: '' } : s
        );
      } else {
        // If there was no DAY_SHIFT the next day, create a POST_CALL_REST placeholder
        const nextDayIndex = (newShift.dayIndex + 1) % 7;
        newShiftsList.push({
          id: uuidv4(),
          employeeId: newShift.employeeId,
          dayIndex: nextDayIndex,
          type: 'POST_CALL_REST',
          start: '', end: ''
        });
      }
    }
    setAllShifts(newShiftsList);
  };

  /**
   * Calculate total minutes scheduled for the given employee during the week
   * Excludes POST_CALL_REST which has no times.
   */
  const getWeeklyMinutes = (employeeId) => {
    return allShifts
      .filter(s => s.employeeId === employeeId && s.type !== 'POST_CALL_REST' && s.start && s.end)
      .reduce((sum, s) => {
        const start = timeToMinutes(s.start);
        let end = timeToMinutes(s.end);
        // handle overnight shifts (end next day)
        if (end <= start) end += 24 * 60;
        return sum + Math.max(0, end - start);
      }, 0);
  };

  // Pure helper which reads shifts directly from storage and computes weekly minutes.
  // Useful for components that don't share the same hook instance.
  const computeWeeklyMinutesFromStorage = (employeeId) => {
    const shifts = getShiftsFromStorage();
    return shifts
      .filter(s => s.employeeId === employeeId && s.type !== 'POST_CALL_REST' && s.start && s.end)
      .reduce((sum, s) => {
        const start = timeToMinutes(s.start);
        let end = timeToMinutes(s.end);
        if (end <= start) end += 24 * 60;
        return sum + Math.max(0, end - start);
      }, 0);
  };
  
  /**
   * Update a shift
   */
  const updateShift = (shiftId, updatedData) => {
    // (For this version, update does not handle post-call rest adjustments)
    setAllShifts(currentShifts =>
      currentShifts.map(shift =>
        shift.id === shiftId ? { ...shift, ...updatedData } : shift
      )
    );
  };
  
  /**
   * Delete a shift (adjusts post-call rest if needed)
   */
  const deleteShift = (shiftId) => {
    const shiftToDelete = allShifts.find(s => s.id === shiftId);
    if (!shiftToDelete) return;

    let newShiftsList = allShifts.filter(s => s.id !== shiftId);

    // BUSINESS LOGIC: If an ON_CALL is deleted...
    if (shiftToDelete.type === 'ON_CALL') {
      const nextDayIndex = (shiftToDelete.dayIndex + 1) % 7;
      
      // Find the next day's POST_CALL_REST (if any)
      const restShift = newShiftsList.find(s =>
        s.employeeId === shiftToDelete.employeeId &&
        s.dayIndex === nextDayIndex &&
        s.type === 'POST_CALL_REST'
      );
      
      if (restShift) {
        // ...convert the POST_CALL_REST back into a default DAY_SHIFT
        newShiftsList = newShiftsList.map(s =>
          s.id === restShift.id 
            ? { ...s, type: 'DAY_SHIFT', ...DEFAULT_HOURS.DAY_SHIFT } 
            : s
        );
      }
    }
    setAllShifts(newShiftsList);
  };

  /**
   * Return the week schedule grouped by day index for an employee
   * Sort by start time (naturally from first event to last in the day)
   */
  const getWeekScheduleForEmployee = (employeeId) => {
    const weekSchedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    const employeeShifts = allShifts.filter(s => s.employeeId === employeeId);
    
    for (const shift of employeeShifts) {
      if (weekSchedule[shift.dayIndex] !== undefined) {
        weekSchedule[shift.dayIndex].push(shift);
      }
    }
    
    // Sort by start time (first event at top, last at bottom)
    // POST_CALL_REST has no time, so put it at the end
    for (const day in weekSchedule) {
      weekSchedule[day].sort((a, b) => {
        if (a.type === 'POST_CALL_REST') return 1;
        if (b.type === 'POST_CALL_REST') return -1;
        return (a.start || '').localeCompare(b.start || '');
      });
    }
    return weekSchedule;
  };

  return { addShift, updateShift, deleteShift, getWeekScheduleForEmployee, getWeeklyMinutes, computeWeeklyMinutesFromStorage };
}

// Export a standalone helper (module-level) for consumers that prefer not to call the hook.
export const computeWeeklyMinutes = (employeeId) => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const shifts = data ? JSON.parse(data) : [];
    return shifts
      .filter(s => s.employeeId === employeeId && s.type !== 'POST_CALL_REST' && s.start && s.end)
      .reduce((sum, s) => {
        const [sh, sm] = s.start.split(':').map(Number);
        const [eh, em] = s.end.split(':').map(Number);
        const start = sh * 60 + sm;
        let end = eh * 60 + em;
        if (end <= start) end += 24 * 60; // handle overnight
        return sum + Math.max(0, end - start);
      }, 0);
  } catch {
    return 0;
  }
};