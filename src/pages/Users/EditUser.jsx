import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDepartments } from '../../api/departmentApi';
import { getDesignations } from '../../api/designationApi';
import { getUserById, updateUser } from '../../api/user.api';
import { getSkillsByDesignation } from '../../api/designationSkill.api';
import { bulkSetRequiredLevels, getUserSkillLevels } from '../../api/userSkillLevel.api';
import './createUser.css';

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // ✅ Required levels per user (based on designation skills + user overrides)
  const [requiredLevels, setRequiredLevels] = useState([]);

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
    password: '',
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

        // ✅ Load designation skills + user-specific required levels
        const [dsRes, userLevels] = await Promise.all([
          user.designation?.id ? getSkillsByDesignation(user.designation.id) : Promise.resolve({ data: [] }),
          getUserSkillLevels(id),
        ]);
        const bySkill = new Map((userLevels || []).map((u) => [u.skill?.id ?? u.skillId, u]));
        const rows = (dsRes?.data ?? []).map((ds) => {
          const skill = ds.skill ?? {};
          const existing = bySkill.get(skill.id);
          const userReq = existing?.requiredLevel;
          return {
            skillId: skill.id,
            skillName: skill.name,
            // 🔥 HR must set per-user required level (no designation defaults)
            requiredLevel: userReq === null || userReq === undefined ? '' : Number(userReq),
          };
        }).filter((r) => r.skillId);
        setRequiredLevels(rows);
      } catch (err) {
        alert('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  // ✅ if designation changes while editing -> reload its skills and merge existing user required levels
  useEffect(() => {
    async function reload() {
      if (!form.designationId) {
        setRequiredLevels([]);
        return;
      }
      try {
        const [dsRes, userLevels] = await Promise.all([
          getSkillsByDesignation(form.designationId),
          getUserSkillLevels(id),
        ]);
        const bySkill = new Map((userLevels || []).map((u) => [u.skill?.id ?? u.skillId, u]));
        const rows = (dsRes?.data ?? []).map((ds) => {
          const skill = ds.skill ?? {};
          const existing = bySkill.get(skill.id);
          const userReq = existing?.requiredLevel;
          return {
            skillId: skill.id,
            skillName: skill.name,
            requiredLevel: userReq === null || userReq === undefined ? '' : Number(userReq),
          };
        }).filter((r) => r.skillId);
        setRequiredLevels(rows);
      } catch (e) {
        setRequiredLevels([]);
      }
    }
    // avoid running before initial load finishes
    if (!loading) reload();
  }, [form.designationId]);

  const updateRequiredLevel = (skillId, level) => {
    const lv = level === '' ? '' : Number(level);
    setRequiredLevels((prev) =>
      prev.map((r) => (r.skillId === skillId ? { ...r, requiredLevel: lv } : r)),
    );
  };

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

    if (form.password?.trim()) {
      payload.password = form.password;
    }

    // ✅ Force HR to set required level for every skill for this user
    if (requiredLevels.length > 0) {
      const missing = requiredLevels.filter((r) => r.requiredLevel === '' || r.requiredLevel === null || r.requiredLevel === undefined);
      if (missing.length > 0) {
        alert('Please set required level for all skills before saving.');
        return;
      }
    }


    try {
      await updateUser(id, payload);

      // ✅ Save user-wise required levels
      if (requiredLevels.length > 0) {
        await bulkSetRequiredLevels(
          id,
          requiredLevels.map((r) => ({
            skillId: r.skillId,
            requiredLevel: Number(r.requiredLevel),
          })),
        );
      }

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

        {/* ✅ USER-WISE REQUIRED LEVELS */}
        {form.designationId && requiredLevels.length > 0 && (
          <div className="form-section">
            <h3>Required Levels (User-wise)</h3>
            <p style={{ marginTop: '-6px', color: '#666', fontSize: 13 }}>
              Skills are taken from designation. Required levels can be different per user.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Skill</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>Required Level</th>
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
          </div>
        )}

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
