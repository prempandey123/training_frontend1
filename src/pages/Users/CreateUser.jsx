import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../../api/user.api';
import DepartmentSelect from '../../components/Departments/DepartmentSelect';
import './createUser.css';

export default function CreateUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    mobile: '',
    department: '',
    role: 'EMPLOYEE',
    biometricLinked: false,
    isActive: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.department) {
      alert('Please select a department');
      return;
    }

    setLoading(true);

    try {
      await createUser(form); // 🔥 BACKEND CALL (UNCHANGED)
      alert('Employee added successfully');
      navigate('/users');
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Error while creating employee'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-user-page">
      {/* HEADER */}
      <div className="create-user-header">
        <h2>Add Employee</h2>
        <button
          className="back-btn"
          onClick={() => navigate('/users')}
        >
          ← Back
        </button>
      </div>

      {/* FORM CARD */}
      <form className="create-user-card" onSubmit={handleSubmit}>
        {/* BASIC INFO */}
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-grid">
            <div>
              <label>Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>Employee ID *</label>
              <input
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>Mobile *</label>
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* ORGANIZATION INFO */}
        <div className="form-section">
          <h3>Organization Details</h3>

          <div className="form-grid">
            <div>
              <label>Department *</label>

              {/* 🔥 SMART SEARCH DEPARTMENT */}
              <DepartmentSelect
                value={form.department}
                onChange={(value) =>
                  setForm({ ...form, department: value })
                }
              />
            </div>

            <div>
              <label>Role *</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* SYSTEM SETTINGS */}
        <div className="form-section">
          <h3>System Settings</h3>

          <div className="toggle-grid">
            <label>
              <input
                type="checkbox"
                name="biometricLinked"
                checked={form.biometricLinked}
                onChange={handleChange}
              />
              Biometric Linked
            </label>

            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              Active Employee
            </label>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="form-actions">
          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Employee'}
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={() => navigate('/users')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
