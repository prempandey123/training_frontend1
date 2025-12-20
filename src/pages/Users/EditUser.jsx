import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/api';
import './createUser.css';

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);

  useEffect(() => {
    api.get(`/users/${id}`).then((res) => {
      setForm(res.data);
    });
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const payload = {
    name: form.name,
    employeeId: form.employeeId,
    mobile: form.mobile,
    department: form.department,
    role: form.role,
    biometricLinked: Boolean(form.biometricLinked),
    isActive: Boolean(form.isActive),
  };

  await api.put(`/users/${id}`, payload);
  alert('Employee updated successfully');
  navigate('/users');
};


  if (!form) return <p>Loading...</p>;

  return (
    <div className="create-user-page">
      <div className="create-user-header">
        <h2>Edit Employee</h2>
        <button className="back-btn" onClick={() => navigate('/users')}>
          ← Back
        </button>
      </div>

      <form className="create-user-card" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-grid">
            <div>
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} />
            </div>

            <div>
              <label>Email</label>
              <input
                name="email"
                value={form.email}
                disabled
              />
            </div>

            <div>
              <label>Employee ID</label>
              <input
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Mobile</label>
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Organization Details</h3>

          <div className="form-grid">
            <div>
              <label>Department</label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                <option>IT</option>
                <option>Production</option>
                <option>HRS & Pickling</option>
                <option>Quality</option>
              </select>
            </div>

            <div>
              <label>Role</label>
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

        <div className="form-actions">
          <button type="submit" className="primary-btn">
            Update Employee
          </button>
        </div>
      </form>
    </div>
  );
}
