import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDepartment } from '../../api/departmentApi';
import './department.css';

export default function AddDepartment() {
  const navigate = useNavigate();
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!departmentName.trim()) {
      alert('Department name is required');
      return;
    }

    try {
      setLoading(true);

      await createDepartment({
        name: departmentName.trim(),
      });

      alert('Department created successfully');
      navigate('/departments');
    } catch (error) {
      if (error.response?.status === 409) {
        alert('Department already exists');
      } else {
        alert('Failed to create department');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="department-page">
      {/* HEADER */}
      <div className="department-header">
        <h2>Add Department</h2>

        <button
          className="back-btn"
          onClick={() => navigate('/departments')}
          disabled={loading}
        >
          ← Back
        </button>
      </div>

      {/* FORM */}
      <form className="department-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Department Name *</label>
          <input
            type="text"
            placeholder="e.g. Production"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="save-btn"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Department'}
          </button>
        </div>
      </form>
    </div>
  );
}
