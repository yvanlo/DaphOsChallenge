import React from 'react';

export function EmployeeList({ employees, onSelect, onDeactivate, selectedId }) {
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
          >
            <div className="employee-info">
              {emp.name} <span>({emp.role})</span>
            </div>
            <div>Status: {emp.status}</div>

            <div className="employee-actions">
              <button
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation(); // Empêche le clic de sélectionner le li
                  onSelect(emp);
                }}
              >
                Edit
              </button>
              
              {/* Only show the Deactivate button when the employee is active */}
              {emp.status === 'active' && (
                <button
                  className="btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeactivate(emp.id);
                  }}
                >
                  Deactivate
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}