import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SHIFT_TYPES, DEFAULT_HOURS } from '../hooks/useScheduleStore';

export function ScheduleForm({ initialData, onSubmit, onCancel, dayHasPostCallRest }) {
  
  // Initialize with MEETING if day has post-call rest, otherwise DAY_SHIFT
  const initialType = dayHasPostCallRest ? 'MEETING' : 'DAY_SHIFT';
  
  const [formData, setFormData] = useState({
    type: initialType,
    start: DEFAULT_HOURS[initialType].start,
    end: DEFAULT_HOURS[initialType].end,
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
    } else if (dayHasPostCallRest) {
      // Create mode with post-call rest: force MEETING type
      setFormData({
        type: 'MEETING',
        start: DEFAULT_HOURS.MEETING.start,
        end: DEFAULT_HOURS.MEETING.end,
      });
    }
  }, [initialData, isEditing, dayHasPostCallRest]);

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
    // If the day has a post-call rest, only meetings are allowed
    if (dayHasPostCallRest && formData.type !== 'MEETING') {
      alert('Only meetings are allowed on days with post-call rest');
      return;
    }
    onSubmit(formData); // sends { type, start, end }
  };

  // Filter shift types: if day has POST_CALL_REST, only allow MEETING
  const availableTypes = dayHasPostCallRest
    ? { MEETING: SHIFT_TYPES.MEETING }
    : SHIFT_TYPES;

  // Render modal via portal to avoid being clipped by transformed ancestors
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h3>{isEditing ? 'Edit shift' : 'Add shift'}</h3>

          {dayHasPostCallRest && (
            <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', color: '#92400e' }}>
              ⚠️ Post-call rest on this day — only meetings allowed
            </div>
          )}

          <div className="form-group">
            <label htmlFor="type">Shift type</label>
            <select name="type" id="type" value={formData.type} onChange={handleTypeChange}>
              {Object.entries(availableTypes).map(([key, label]) => (
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
    </div>,
    document.body
  );
}