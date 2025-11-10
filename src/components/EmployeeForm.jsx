import React, { useState, useEffect } from 'react';

// initialData is null for create mode, or an employee object for edit mode
export function EmployeeForm({ initialData, onSubmit, onCancel }) {
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
  });

  const isEditing = Boolean(initialData);

  // UseEffect to populate form when editing. Runs when initialData changes.
  useEffect(() => {
    if (isEditing) {
      setFormData({ name: initialData.name, role: initialData.role });
    } else {
      // If switched from edit mode back to create mode, reset the form
      setFormData({ name: '', role: '' });
    }
  }, [initialData, isEditing]); // Dépend de l'objet initialData

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.role) {
      alert('Please provide both name and role.');
      return;
    }
    onSubmit(formData); // Envoie les données au composant parent (App.jsx)
    
    // Si ce n'était pas une édition, on vide le formulaire
    if (!isEditing) {
        setFormData({ name: '', role: '' });
    }
  };

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
  <h3>{isEditing ? 'Edit employee' : 'Add employee'}</h3>
      
      <div className="form-group">
  <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
      </div>
      
      <div className="form-group">
  <label htmlFor="role">Role / Position</label>
        <input
          id="role"
          type="text"
          name="role"
          value={formData.role}
          onChange={handleChange}
        />
      </div>
      
      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {isEditing ? 'Update' : 'Save'}
        </button>

        {/* Cancel button only shown in edit mode */}
        {isEditing && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel (switch to create)
          </button>
        )}
      </div>
    </form>
  );
}