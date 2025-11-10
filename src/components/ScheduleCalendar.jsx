import React, { useState } from 'react';
import { useScheduleStore, SHIFT_TYPES } from '../hooks/useScheduleStore';
import { ScheduleForm } from './ScheduleForm'; // schedule form component

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ScheduleCalendar({ employeeId }) {
  const { addShift, updateShift, deleteShift, getWeekScheduleForEmployee } = useScheduleStore();

  const [editingShift, setEditingShift] = useState(null);

  // weekSchedule grouped by day index: { 0: [shifts], 1: [shifts], ... }
  const weekSchedule = getWeekScheduleForEmployee(employeeId);

  // Handle schedule form submission (create or update)
  const handleFormSubmit = (formData) => {
    if (editingShift && editingShift.id) {
      updateShift(editingShift.id, formData);
    } else {
      addShift({
        ...formData,
        employeeId: employeeId,
        dayIndex: editingShift ? editingShift.dayIndex : 0,
      });
    }
    setEditingShift(null); // close modal
  };

  // Handle delete (click on the '×' button)
  const handleDelete = (e, shiftId) => {
    e.stopPropagation(); 
    if (window.confirm("Delete this shift?")) {
      deleteShift(shiftId);
    }
  };
  
  // Return an 'Off' badge for empty days
  const renderEmptyDay = (dayIndex) => {
    return <span className="status-badge status-off">Off</span>;
  };

  return (
    <div className="schedule-calendar">
  <h3>Default schedule</h3>
      
      <div className="week-grid">
        {dayNames.map((dayName, index) => {
          const shiftsForDay = weekSchedule[index]; 
          
          return (
            <div key={dayName} className="day-card">
              <div className="day-header">
                <strong>{dayName}</strong>
              </div>
              
              <div className="day-shifts-list">
                {shiftsForDay.length === 0 && renderEmptyDay(index)}
                
                {shiftsForDay.map(shift => (
                  <div 
                    key={shift.id}
                    className={`shift-badge status-${shift.type.toLowerCase()}`}
                    onClick={() => setEditingShift(shift)} // open in edit mode
                  >
                    <span className="shift-type">{SHIFT_TYPES[shift.type]}</span>
                    
                    {/* don't show times for rest shifts */}
                    {shift.type !== 'POST_CALL_REST' && (
                      <span className="shift-time">{shift.start} - {shift.end}</span>
                    )}
                    
                    <button 
                      className="delete-shift-btn"
                      onClick={(e) => handleDelete(e, shift.id)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              
              <button 
                className="add-shift-btn"
                onClick={() => setEditingShift({ dayIndex: index })} // open create modal
              >
                + Add shift
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal with schedule form */}
      {editingShift && (
        <ScheduleForm
          initialData={editingShift}
          onSubmit={handleFormSubmit}
          onCancel={() => setEditingShift(null)}
        />
      )}
    </div>
  );
}