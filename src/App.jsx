import React, { useState, useEffect } from 'react';
import { useEmployeeStore } from './hooks/useEmployeeStore';
import { EmployeeList } from './components/EmployeeList';
import { EmployeeForm } from './components/EmployeeForm';
import { ScheduleCalendar } from './components/ScheduleCalendar';
import HoursGauge from './components/HoursGauge';
import { useScheduleStore, computeWeeklyMinutes } from './hooks/useScheduleStore';
import './styles/App.css';

function App() {
  // Employee management
  const { employees, addEmployee, updateEmployee, deactivateEmployee, reactivateEmployee, removeEmployee } = useEmployeeStore();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showAddForm, setShowAddForm] = useState(true);

  const handleEmployeeFormSubmit = (formData) => {
    if (editingEmployee) {
      // update existing employee
      updateEmployee(editingEmployee.id, formData);
      // reflect changes in the selected employee view
      setSelectedEmployee(prev => prev && prev.id === editingEmployee.id ? { ...prev, ...formData } : prev);
      setEditingEmployee(null);
    } else {
      // create new employee and immediately show their calendar
      const newEmployee = addEmployee(formData);
      setSelectedEmployee(newEmployee);
      setShowAddForm(false);
    }
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditingEmployee(null);
  };

  // weekly minutes state for the gauge (so it re-renders when shifts change)
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);

  // update gauge when selected employee changes
  useEffect(() => {
    if (selectedEmployee) {
      setWeeklyMinutes(computeWeeklyMinutes(selectedEmployee.id));
    } else {
      setWeeklyMinutes(0);
    }
  }, [selectedEmployee]);

  // Listen to shifts updates (dispatched from the store hook) and refresh the gauge
  useEffect(() => {
    const handler = () => {
      if (selectedEmployee) setWeeklyMinutes(computeWeeklyMinutes(selectedEmployee.id));
    };
    window.addEventListener('shiftsUpdated', handler);
    return () => window.removeEventListener('shiftsUpdated', handler);
  }, [selectedEmployee]);

  // Collapse the add form when an employee is selected to save space
  useEffect(() => {
    if (selectedEmployee) setShowAddForm(false);
    else setShowAddForm(true);
  }, [selectedEmployee]);

  // schedule store helper to compute weekly minutes (we use storage-based helper so the gauge updates
  // even if other components use separate hook instances)
  const store = useScheduleStore();

  const handleEditEmployeeRequest = (employee) => {
    setSelectedEmployee(employee);
    setEditingEmployee(employee);
  };

  const handleDeactivateEmployee = (id) => {
    deactivateEmployee(id);
    if (selectedEmployee && selectedEmployee.id === id) {
      setSelectedEmployee(null);
    }
  };

  const handleReactivateEmployee = (id) => {
    reactivateEmployee(id);
  };

  const handleDeleteEmployee = (id) => {
    // permanent delete
    // confirm before deleting
    if (!window.confirm('Permanently delete this employee? This cannot be undone.')) return;
    removeEmployee(id);
    if (selectedEmployee && selectedEmployee.id === id) setSelectedEmployee(null);
  };
  
  const handleCancelEditEmployee = () => {
    setEditingEmployee(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>DaphOS - Staff Management</h1>
      </header>

      <main className="main-content">
        
  {/* Left column */}
        <div className="left-panel">
          <div className="add-employee-panel">
            {showAddForm ? (
              <div className="form-container">
                <EmployeeForm
                  initialData={null}
                  onSubmit={handleEmployeeFormSubmit}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            ) : (
              <div className="add-employee-collapsed">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>New employee</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Quick add</div>
                  </div>
                  <div>
                    <button className="toggle-add-btn" onClick={() => { setShowAddForm(true); setSelectedEmployee(null); }}>Add</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <EmployeeList
            employees={employees}
            onSelect={handleSelectEmployee}
            onEdit={handleEditEmployeeRequest}
            onDeactivate={handleDeactivateEmployee}
            onReactivate={handleReactivateEmployee}
            onDelete={handleDeleteEmployee}
            selectedId={selectedEmployee ? selectedEmployee.id : null}
          />
        </div>

        {/* Right column */}
        <div className="right-panel">
          {selectedEmployee ? (
            <>
              {/* Employee header + optional edit form */}
              <div className="form-container">
                {editingEmployee ? (
                  <EmployeeForm
                    initialData={editingEmployee}
                    onSubmit={handleEmployeeFormSubmit}
                    onCancel={handleCancelEditEmployee}
                  />
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{selectedEmployee.name}</h3>
                      <div style={{ color: 'var(--muted)' }}>{selectedEmployee.role} • {selectedEmployee.status}</div>
                    </div>
                    <div>
                      <button className="btn-secondary" onClick={() => setEditingEmployee(selectedEmployee)}>Edit</button>
                      <button className="btn-danger" style={{ marginLeft: '8px' }} onClick={() => handleDeactivateEmployee(selectedEmployee.id)}>Deactivate</button>
                    </div>
                  </div>
                )}
              </div>

              <hr className="section-divider" />

              {/* Section: Schedule */}
              <ScheduleCalendar 
                key={selectedEmployee.id} // force component reset when selected employee changes
                employeeId={selectedEmployee.id} 
              />

              {/* Weekly hours gauge */}
              <div style={{ marginTop: '1.5rem' }}>
                <HoursGauge minutes={weeklyMinutes} />
              </div>
            </>
          ) : (
            <div className="placeholder-text">
              <p>Select an employee to view details and manage their schedule.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default App;