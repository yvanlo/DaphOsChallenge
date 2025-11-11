import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'daphos_employees';

// Read employees from localStorage
const getEmployeesFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading from localStorage", error);
    return [];
  }
};

// Main hook for employee management
export function useEmployeeStore() {
  // Initialize state with data from storage
  const [employees, setEmployees] = useState(() => getEmployeesFromStorage());

  // Persist to localStorage whenever employees change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  }, [employees]);

  // Create an employee
  const addEmployee = (employeeData) => {
    const newEmployee = {
      id: uuidv4(),
      status: 'active', // Le statut est requis 
      ...employeeData, // { name, role }
    };
    setEmployees(currentEmployees => [...currentEmployees, newEmployee]);
    return newEmployee;
  };

  // Update an employee
  const updateEmployee = (id, updatedData) => {
    setEmployees(currentEmployees =>
      currentEmployees.map(emp =>
        emp.id === id ? { ...emp, ...updatedData } : emp
      )
    );
  };

  // Deactivate an employee
  const deactivateEmployee = (id) => {
    setEmployees(currentEmployees =>
      currentEmployees.map(emp =>
        emp.id === id ? { ...emp, status: 'inactive' } : emp
      )
    );
  };

  // Reactivate an employee
  const reactivateEmployee = (id) => {
    setEmployees(currentEmployees =>
      currentEmployees.map(emp =>
        emp.id === id ? { ...emp, status: 'active' } : emp
      )
    );
  };

  // Permanently remove an employee
  const removeEmployee = (id) => {
    setEmployees(currentEmployees => currentEmployees.filter(emp => emp.id !== id));
  };

  return { employees, addEmployee, updateEmployee, deactivateEmployee, reactivateEmployee, removeEmployee };
}