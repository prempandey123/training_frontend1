import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDepartments } from '../../api/departmentApi';
import { getDesignations } from '../../api/designationApi';
import { getUserById, updateUser } from '../../api/user.api';
import { getSkills } from '../../api/skill.api';
import { bulkSetRequiredLevels, getUserSkillLevels } from '../../api/userSkillLevel.api';
import { getAuthUser } from '../../utils/auth';
import './createUser.css';

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const role = String(authUser?.role || '').toUpperCase();
  const isHOD = role === 'HOD';
  const myDeptId = Number(authUser?.departmentId);

  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // ✅ Required skills are now independent of designation
  const [allSkills, setAllSkills] = useState([]);
  const [requiredLevels, setRequiredLevels] = useState([]); // [{skillId, skillName, requiredLevel}]
  const [skillToAdd, setSkillToAdd] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    mobile: '',
    experience: '',
    qualification: '',
    departmentId: '',
    designationId: '',
    employeeType: '',
    role: 'EMPLOYEE',
    isActive: true,
    dateOfJoining: '',
    password: '',
  });

  // 🔹 Load user + dropdowns
  useEffect(() => {
    async function loadData() {
      try {
        const [user, deptData, desigData, skillsData] = await Promise.all([
          getUserById(id),
          getDepartments(),
          getDesignations(),
          getSkills(),
        ]);

        // 🔒 Frontend safety: HOD can edit only users within own department
        const userDeptId = Number(user?.department?.id);
        if (isHOD && myDeptId && userDeptId && userDeptId !== myDeptId) {
          alert('You can edit only employees within your department');
          navigate('/users');
          return;
        }

        setDepartments(deptData);
        setDesignations(desigData);
        setAllSkills(skillsData || []);

        setForm((prev) => ({
          ...prev,
          name: user?.name ?? '',
          email: user?.email ?? '',
          employeeId: user?.employeeId ?? '',
          mobile: user?.mobile ?? '',
          experience: user?.experience ?? '',
          qualification: user?.qualification ?? '',
          departmentId: user?.department?.id || '',
          designationId: user?.designation?.id || '',
          role: user?.role ?? 'EMPLOYEE',
          employeeType: user?.employeeType || '',
          isActive: !!user?.isActive,
          dateOfJoining: user?.dateOfJoining?.slice(0, 10) || '',
          password: '',
        }));

        // ✅ Load user-specific required skills (requiredLevel != null)
        const userLevels = await getUserSkillLevels(id);
        const rows = (userLevels || [])
          .filter((u) => u?.requiredLevel !== null && u?.requiredLevel !== undefined)
          .map((u) => {
            const sid = u.skill?.id ?? u.skillId;
            const sname = u.skill?.name ?? u.skillName;
            return {
              skillId: sid,
              skillName:
                sname ||
                (skillsData || []).find((s) => s.id === sid)?.name ||
                'Skill',
              requiredLevel: Number(u.requiredLevel),
            };
          })
          .filter((r) => r.skillId);

        setRequiredLevels(rows);
      } catch (err) {
        alert('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addRequiredSkill = () => {
    const sid = Number(skillToAdd);
    if (!Number.isInteger(sid)) return;
    if (requiredLevels.some((r) => r.skillId === sid)) return;

    const skill = allSkills.find((s) => s.id === sid);
    setRequiredLevels((prev) => [
      ...prev,
      {
        skillId: sid,
        skillName: skill?.name || 'Skill',
        requiredLevel: 4, // default
      },
    ]);
    setSkillToAdd('');
  };

  const removeRequiredSkill = (skillId) => {
    setRequiredLevels((prev) => prev.filter((r) => r.skillId !== skillId));
  };

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

    if (!form.employeeType) {
      alert('Please select Worker / Staff for this user');
      return;
    }

    // ✅ IMPORTANT: Do NOT send empty string IDs to backend
    const payload = {
      name: form.name,
      mobile: form.mobile,
      employeeType: form.employeeType,
      isActive: form.isActive,
    };

    if (form.experience?.toString().trim()) {
      payload.experience = form.experience.toString().trim();
    }
    if (form.qualification?.toString().trim()) {
      payload.qualification = form.qualification.toString().trim();
    }



    // only send if selected
    if (form.designationId) payload.designationId = Number(form.designationId);

    // send date only if provided
    if (form.dateOfJoining) payload.dateOfJoining = form.dateOfJoining;

    // HOD: department/role are fixed; backend also enforces this
    if (!isHOD) {
      if (form.departmentId) payload.departmentId = Number(form.departmentId);
      if (form.role) payload.role = form.role;
    }

    if (form.password?.trim()) {
      payload.password = form.password.trim();
    }

    try {
      await updateUser(id, payload);

      // ✅ Save user-wise required skills (ADMIN/HR only)
      const isAdminHr = role.includes('ADMIN') || role.includes('HR');
      if (isAdminHr) {
        await bulkSetRequiredLevels(
          id,
          (requiredLevels || [])
            .filter((r) => Number.isInteger(Number(r.skillId)))
            .map((r) => ({
              skillId: Number(r.skillId),
              requiredLevel: Number.isInteger(Number(r.requiredLevel))
                ? Number(r.requiredLevel)
                : 4,
            })),
        );
      }

      alert('Employee updated successfully');
      navigate('/users');
    } catch (err) {
      // helpful debug (keep or remove later)
      console.log('UPDATE ERROR:', err?.response?.data || err);

      alert(err?.response?.data?.message || 'Error while updating employee');
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
              <input name="name" value={form.name} onChange={handleChange} />
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
              <input name="mobile" value={form.mobile} onChange={handleChange} />
            </div>

            <div>
              <label>Experience</label>
              <input
                name="experience"
                value={form.experience}
                onChange={handleChange}
                placeholder="e.g., 3 Years"
              />
            </div>

            <div>
              <label>Qualification</label>
              <input
                name="qualification"
                value={form.qualification}
                onChange={handleChange}
                placeholder="e.g., B.Tech"
              />
            </div>

          </div>
        </div>

        {/* ORG INFO */}
        <div className="form-section">
          <h3>Organization Details</h3>

          <div className="form-grid">
            {!isHOD ? (
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
            ) : (
              <div>
                <label>Department</label>
                <input
                  value={departments.find((d) => d.id === form.departmentId)?.name || ''}
                  disabled
                />
              </div>
            )}

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

            {!isHOD ? (
              <div>
                <label>Role</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HOD">HOD</option>
                  <option value="HRD">HR</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            ) : (
              <div>
                <label>Role</label>
                <input value={form.role || ''} disabled />
              </div>
            )}

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

        {/* ✅ USER-WISE REQUIRED SKILLS (independent of designation) */}
        {(role.includes('ADMIN') || role.includes('HR')) && (
          <div className="form-section">
            <h3>Required Skills (User-wise)</h3>
            <p style={{ marginTop: '-6px', color: '#666', fontSize: 13 }}>
              Add the skills required for this employee. Default required level is 4, and you can change it.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'end',
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ minWidth: 260 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Add Skill</label>
                <select value={skillToAdd} onChange={(e) => setSkillToAdd(e.target.value)}>
                  <option value="">Select Skill</option>
                  {allSkills
                    .filter((s) => !requiredLevels.some((r) => r.skillId === s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="button"
                className="primary-btn"
                onClick={addRequiredSkill}
                disabled={!skillToAdd}
              >
                + Add
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>
                      Skill
                    </th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}>
                      Required Level
                    </th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {requiredLevels.length === 0 ? (
                    <tr>
                      <td style={{ padding: 8 }} colSpan={3}>
                        No required skills added.
                      </td>
                    </tr>
                  ) : (
                    requiredLevels.map((r) => (
                      <tr key={r.skillId}>
                        <td style={{ padding: 8 }}>{r.skillName}</td>
                        <td style={{ padding: 8 }}>
                          <select
                            value={String(r.requiredLevel ?? 4)}
                            onChange={(e) => updateRequiredLevel(r.skillId, e.target.value)}
                          >
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                          </select>
                        </td>
                        <td style={{ padding: 8 }}>
                          <button
                            type="button"
                            className="back-btn"
                            onClick={() => removeRequiredSkill(r.skillId)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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
