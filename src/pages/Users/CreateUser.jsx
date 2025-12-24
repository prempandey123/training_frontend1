import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../../api/user.api';
import { getDepartments } from '../../api/departmentApi';
import { getDesignations } from '../../api/designationApi';
import './createUser.css';

export default function CreateUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    mobile: '',
    departmentId: '',
    designationId: '',
    role: 'EMPLOYEE',
    dateOfJoining: '',
    password: '',
  });

  // 🔹 Load dropdown data
  useEffect(() => {
    async function loadMasterData() {
      const deptData = await getDepartments();
      const desigData = await getDesignations();
      setDepartments(deptData);
      setDesignations(desigData);
    }
    loadMasterData();
  }, []);

  // 🔥 IMPORTANT FIX: convert IDs to number
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'departmentId' || name === 'designationId') {
      setForm({ ...form, [name]: value ? Number(value) : '' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.departmentId || !form.designationId) {
      alert('Please select department and designation');
      return;
    }

    setLoading(true);
    try {
      await createUser(form); // 👈 backend now gets number IDs
      alert('Employee created successfully');
      navigate('/users');
    } catch (error) {
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
        <button className="back-btn" onClick={() => navigate('/users')}>
          ← Back
        </button>
      </div>

      {/* FORM */}
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

            <div>
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
              />
            </div>

          </div>
        </div>

        {/* ORG INFO */}
        <div className="form-section">
          <h3>Organization Details</h3>
          <div className="form-grid">
            <div>
              <label>Department *</label>
              <select
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Designation *</label>
              <select
                name="designationId"
                value={form.designationId}
                onChange={handleChange}
                required
              >
                <option value="">Select Designation</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.designationName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Role *</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="HOD">HOD</option>
                <option value="HRD">HR</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label>Date of Joining *</label>
              <input
                type="date"
                name="dateOfJoining"
                value={form.dateOfJoining}
                onChange={handleChange}
                required
              />
            </div>
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
