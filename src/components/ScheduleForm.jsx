import React, { useState, useEffect } from 'react';
import { SHIFT_TYPES, DEFAULT_HOURS } from '../hooks/useScheduleStore';

export function ScheduleForm({ initialData, onSubmit, onCancel }) {
  
  const [formData, setFormData] = useState({
    type: 'DAY_SHIFT',
    start: DEFAULT_HOURS.DAY_SHIFT.start,
    end: DEFAULT_HOURS.DAY_SHIFT.end,
  });

  const isEditing = Boolean(initialData && initialData.id);

  // Prefill when editing
  useEffect(() => {
    if (isEditing) {
      setFormData({
        type: initialData.type,
        start: initialData.start,
        end: initialData.end,
      });
    }
    // (create mode is handled by the initial state)
  }, [initialData, isEditing]);

  // Update form when shift type changes
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    
    // Update form with the new type and default hours
    setFormData({
      type: newType,
      start: DEFAULT_HOURS[newType].start,
      end: DEFAULT_HOURS[newType].end,
    });
  };
  
  // Handle manual time edits
  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData); // sends { type, start, end }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h3>{isEditing ? 'Edit shift' : 'Add shift'}</h3>
          
          <div className="form-group">
            <label htmlFor="type">Shift type</label>
            <select name="type" id="type" value={formData.type} onChange={handleTypeChange}>
              {Object.entries(SHIFT_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          {/* Do not show times for post-call rest */}
          {formData.type !== 'POST_CALL_REST' && (
            <>
              <div className="form-group">
                <label htmlFor="start">Start (manual)</label>
                <input
                  type="time"
                  id="start"
                  name="start"
                  value={formData.start}
                  onChange={handleTimeChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="end">End (manual)</label>
                <input
                  type="time"
                  id="end"
                  name="end"
                  value={formData.end}
                  onChange={handleTimeChange}
                />
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}