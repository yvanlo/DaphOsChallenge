import React, { useState } from 'react';
import { useEmployeeStore } from './hooks/useEmployeeStore';
import { EmployeeList } from './components/EmployeeList';
import { EmployeeForm } from './components/EmployeeForm';
import { ScheduleCalendar } from './components/ScheduleCalendar';
import './styles/App.css';

function App() {
  // Employee management
  const { employees, addEmployee, updateEmployee, deactivateEmployee } = useEmployeeStore();
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleEmployeeFormSubmit = (formData) => {
    if (selectedEmployee) {
      updateEmployee(selectedEmployee.id, formData);
    } else {
      addEmployee(formData);
    }
    setSelectedEmployee(null);
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
  };

  const handleDeactivateEmployee = (id) => {
    deactivateEmployee(id);
    if (selectedEmployee && selectedEmployee.id === id) {
      setSelectedEmployee(null);
    }
  };
  
  const handleCancelEditEmployee = () => {
    setSelectedEmployee(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>DaphOS - Staff Management</h1>
      </header>

      <main className="main-content">
        
  {/* Left column */}
        <div className="left-panel">
          {!selectedEmployee && (
            <div className="form-container">
              <EmployeeForm
                initialData={null}
                onSubmit={handleEmployeeFormSubmit}
                onCancel={() => {}}
              />
            </div>
          )}

          <EmployeeList
            employees={employees}
            onSelect={handleSelectEmployee}
            onDeactivate={handleDeactivateEmployee}
            selectedId={selectedEmployee ? selectedEmployee.id : null}
          />
        </div>

        {/* Right column */}
        <div className="right-panel">
          {selectedEmployee ? (
            <>
              {/* Section: Edit employee */}
              <div className="form-container">
                <EmployeeForm
                  initialData={selectedEmployee}
                  onSubmit={handleEmployeeFormSubmit}
                  onCancel={handleCancelEditEmployee}
                />
              </div>

              <hr className="section-divider" />

              {/* Section: Schedule */}
              <ScheduleCalendar 
                key={selectedEmployee.id} // force component reset when selected employee changes
                employeeId={selectedEmployee.id} 
              />
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