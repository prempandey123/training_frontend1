import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../../api/user.api';
import { getDepartments } from '../../api/departmentApi';
import { getDesignations } from '../../api/designationApi';
import { getSkillsByDesignation } from '../../api/designationSkill.api';
import { bulkSetRequiredLevels } from '../../api/userSkillLevel.api';
import './createUser.css';

export default function CreateUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // ✅ Required levels per user (based on selected designation)
  const [requiredLevels, setRequiredLevels] = useState([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    mobile: '',
    departmentId: '',
    designationId: '',
    employeeType: '',
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

  // ✅ Load skills (from designation) whenever designation changes
  useEffect(() => {
    async function loadDesignationSkills() {
      if (!form.designationId) {
        setRequiredLevels([]);
        return;
      }
      try {
        const res = await getSkillsByDesignation(form.designationId);
        const rows = (res?.data ?? res ?? []).map((ds) => {
          const skill = ds.skill ?? ds;
          return {
            skillId: skill.id,
            skillName: skill.name,
            // 🔥 HR must set per-user required level (no designation defaults)
            requiredLevel: '',
          };
        });
        setRequiredLevels(rows);
      } catch (e) {
        // keep silent but reset
        setRequiredLevels([]);
      }
    }
    loadDesignationSkills();
  }, [form.designationId]);

  // 🔥 IMPORTANT FIX: convert IDs to number
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'departmentId' || name === 'designationId') {
      const nextVal = value ? Number(value) : '';
      setForm({ ...form, [name]: nextVal });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const updateRequiredLevel = (skillId, level) => {
    const lv = level === '' ? '' : Number(level);
    setRequiredLevels((prev) =>
      prev.map((r) => (r.skillId === skillId ? { ...r, requiredLevel: lv } : r)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.employeeType) {
      alert('Please select Worker / Staff for this user');
      return;
    }

    if (!form.departmentId || !form.designationId) {
      alert('Please select department and designation');
      return;
    }

    // ✅ Force HR to set required level for every skill
    if (requiredLevels.length > 0) {
      const missing = requiredLevels.filter((r) => r.requiredLevel === '' || r.requiredLevel === null || r.requiredLevel === undefined);
      if (missing.length > 0) {
        alert('Please set required level for all skills before saving.');
        return;
      }
    }

    setLoading(true);
    try {
      const created = await createUser(form); // 👈 backend now gets number IDs

      // ✅ save user-wise required levels (different users can have different required levels)
      if (created?.id && requiredLevels.length > 0) {
        await bulkSetRequiredLevels(
          created.id,
          requiredLevels.map((r) => ({
            skillId: r.skillId,
            requiredLevel: Number(r.requiredLevel),
          })),
        );
      }
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
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="EMPLOYEE">Employee</option>
                <option value="HOD">HOD</option>
                <option value="HRD">HR</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label>Worker / Staff *</label>
              <select
                name="employeeType"
                value={form.employeeType}
                onChange={handleChange}
                required
              >
                <option value="">-- Select --</option>
                <option value="WORKER">Worker</option>
                <option value="STAFF">Staff</option>
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

        {/* REQUIRED LEVELS (PER USER) */}
        {requiredLevels.length > 0 && (
          <div className="form-section">
            <h3>Required Skill Levels (Per User)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>Skill</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Required Level (0-4)</th>
                  </tr>
                </thead>
                <tbody>
                  {requiredLevels.map((r) => (
                    <tr key={r.skillId}>
                      <td style={{ padding: 8 }}>{r.skillName}</td>
                      <td style={{ padding: 8 }}>
                        <select
                          value={r.requiredLevel}
                          onChange={(e) => updateRequiredLevel(r.skillId, e.target.value)}
                        >
                          <option value="">Select</option>
                          {[0, 1, 2, 3, 4].map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              Tip: You can change these later from Edit User.
            </p>
          </div>
        )}

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
