import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'daphos_schedule_shifts';

// Shift types (labels shown in the UI)
export const SHIFT_TYPES = {
  DAY_SHIFT: 'Day',
  ON_CALL: 'On-call',
  POST_CALL_REST: 'Post-call rest',
};

// Default hours used to prefill the form
export const DEFAULT_HOURS = {
  DAY_SHIFT: { start: '09:00', end: '17:00' },
  ON_CALL: { start: '20:00', end: '08:00' }, // example default on-call hours
  POST_CALL_REST: { start: '', end: '' }, // rest shifts have no times
};

// --- Fonctions utilitaires ---
const getShiftsFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) { return []; }
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

// --- Hook principal ---
export function useScheduleStore() {
  const [allShifts, setAllShifts] = useState(() => getShiftsFromStorage());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allShifts));
  }, [allShifts]);

  /**
   * Add a shift (applies post-call rest logic when necessary)
   */
  const addShift = (shiftData) => {
    const newShift = { id: uuidv4(), ...shiftData };
    let newShiftsList = [...allShifts, newShift];

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
   */
  const getWeekScheduleForEmployee = (employeeId) => {
    const weekSchedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    const employeeShifts = allShifts.filter(s => s.employeeId === employeeId);
    
    for (const shift of employeeShifts) {
      if (weekSchedule[shift.dayIndex] !== undefined) {
        weekSchedule[shift.dayIndex].push(shift);
      }
    }
    
    for (const day in weekSchedule) {
      weekSchedule[day].sort((a, b) => a.start.localeCompare(b.start));
    }
    return weekSchedule;
  };

  return { addShift, updateShift, deleteShift, getWeekScheduleForEmployee };
}