import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDepartments } from '../../api/departmentApi';
import { getDesignations } from '../../api/designationApi';
import { getUserById, updateUser } from '../../api/user.api';
import './createUser.css';

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
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
    isActive: true,
    dateOfJoining: '',
  });

  // 🔹 Load user + dropdowns
  useEffect(() => {
    async function loadData() {
      try {
        const [user, deptData, desigData] = await Promise.all([
          getUserById(id),
          getDepartments(),
          getDesignations(),
        ]);

        setDepartments(deptData);
        setDesignations(desigData);

        setForm({
          name: user.name,
          email: user.email,
          employeeId: user.employeeId,
          mobile: user.mobile,
          departmentId: user.department?.id || '',
          designationId: user.designation?.id || '',
          role: user.role,
          isActive: user.isActive,
          dateOfJoining: user.dateOfJoining?.slice(0, 10) || '',
        });
      } catch (err) {
        alert('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  // 🔥 convert IDs to number
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'departmentId' || name === 'designationId') {
      setForm({ ...form, [name]: value ? Number(value) : '' });
    } else if (type === 'checkbox') {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      mobile: form.mobile,
      departmentId: form.departmentId,
      designationId: form.designationId,
      role: form.role,
      isActive: form.isActive,
      dateOfJoining: form.dateOfJoining,
    };

    try {
      await updateUser(id, payload);
      alert('Employee updated successfully');
      navigate('/users');
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          'Error while updating employee'
      );
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="create-user-page">
      <div className="create-user-header">
        <h2>Edit Employee</h2>
        <button className="back-btn" onClick={() => navigate('/users')}>
          ← Back
        </button>
      </div>

      <form className="create-user-card" onSubmit={handleSubmit}>
        {/* BASIC INFO */}
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-grid">
            <div>
              <label>Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Email</label>
              <input value={form.email} disabled />
            </div>

            <div>
              <label>Employee ID</label>
              <input value={form.employeeId} disabled />
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

        {/* ORG INFO */}
        <div className="form-section">
          <h3>Organization Details</h3>

          <div className="form-grid">
            <div>
              <label>Department</label>
              <select
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
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
              <label>Designation</label>
              <select
                name="designationId"
                value={form.designationId}
                onChange={handleChange}
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
              <label>Role</label>
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
              <label>Date of Joining</label>
              <input
                type="date"
                name="dateOfJoining"
                value={form.dateOfJoining}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* STATUS */}
        <div className="form-section">
          <h3>Status</h3>
          <label>
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />{' '}
            Active Employee
          </label>
        </div>

        {/* ACTION */}
        <div className="form-actions">
          <button type="submit" className="primary-btn">
            Update Employee
          </button>
        </div>
      </form>
    </div>
  );
}
