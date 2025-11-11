import React from 'react';

export function EmployeeList({ employees, onSelect, onEdit, onDeactivate, onReactivate, onDelete, selectedId }) {
  return (
    <div className="employee-list">
      <h2>Employees</h2>
      <ul>
        {employees.length === 0 && <p>No employees found.</p>}
        {employees.map(emp => (
          <li
            key={emp.id}
            // Apply CSS classes based on state
            className={`
              employee-list-item 
              ${emp.id === selectedId ? 'selected' : ''}
              ${emp.status === 'inactive' ? 'inactive' : ''}
            `}
            onClick={() => onSelect(emp)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(emp); }}
          >
            <div className="employee-info">
              {emp.name} <span>({emp.role})</span>
            </div>
            <div>Status: {emp.status}</div>

            <div className="employee-actions">
              <button
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation(); // prevent item click
                  onEdit && onEdit(emp);
                }}
              >
                Edit
              </button>

              {emp.status === 'active' ? (
                <button
                  className="btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeactivate(emp.id);
                  }}
                >
                  Deactivate
                </button>
              ) : (
                // show Reactivate + Delete options when inactive
                <>
                  <button
                    className="btn-primary"
                    onClick={(e) => { e.stopPropagation(); onReactivate && onReactivate(emp.id); }}
                    style={{ marginRight: '6px' }}
                  >
                    Reactivate
                  </button>
                  <button
                    className="btn-danger"
                    onClick={(e) => { e.stopPropagation(); onDelete && onDelete(emp.id); }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}