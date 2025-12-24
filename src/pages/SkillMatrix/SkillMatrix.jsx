import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import './skillMatrix.css';
import { getUsers } from '../../api/user.api';
import { getSkillMatrixForUser, getMySkillMatrix } from '../../api/skillMatrix.api';
import { getAuthUser } from '../../utils/auth';
import { upsertMySkillLevel } from '../../api/userSkillLevel.api';

export default function SkillMatrix() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSkillId, setSavingSkillId] = useState(null);
  const [error, setError] = useState('');

  const authUser = getAuthUser();

  const canEditMine = Boolean(authUser?.id);

  async function loadUsers() {
    try {
      const list = await getUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      // ignore (some setups may protect this endpoint)
      setUsers([]);
    }
  }

  async function loadMatrix(userId) {
    setLoading(true);
    setError('');
    try {
      const data = userId ? await getSkillMatrixForUser(userId) : await getMySkillMatrix();
      setMatrix(data);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load skill matrix';
      setError(msg);
      setMatrix(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // Default: if token has sub, show my matrix; else show first user once loaded
    if (authUser?.id) {
      loadMatrix('');
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authUser?.id && users.length && !selectedUserId) {
      setSelectedUserId(String(users[0].id));
      loadMatrix(String(users[0].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const skillRows = useMemo(() => {
    const rows = matrix?.skills;
    return Array.isArray(rows) ? rows : [];
  }, [matrix]);

  const headerTitle = matrix?.user?.name || matrix?.user?.email || 'Skill Matrix';

  const handleLevelChange = async (skillId, nextLevel) => {
    if (!canEditMine) return;
    setSavingSkillId(skillId);
    try {
      await upsertMySkillLevel(skillId, Number(nextLevel));
      await loadMatrix(''); // reload my matrix
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Update failed');
    } finally {
      setSavingSkillId(null);
    }
  };

  return (
    <div className="skill-matrix-page">
      <div className="matrix-header">
        <h2>Skill Matrix</h2>
        <button className="add-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div className="matrix-filters">
        <div className="filter-item">
          <label>Employee</label>
          <select
            value={selectedUserId}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedUserId(v);
              loadMatrix(v);
            }}
          >
            {authUser?.id ? <option value="">(Me)</option> : null}
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.employeeId || u.email})
              </option>
            ))}
          </select>
          <small style={{ opacity: 0.7 }}>
            Note: Only your own levels are editable (as per rules).
          </small>
        </div>
      </div>

      {error ? (
        <div className="card" style={{ padding: 16 }}>
          <b>Error:</b> {error}
        </div>
      ) : null}

      {loading ? (
        <div className="card" style={{ padding: 16 }}>Loading...</div>
      ) : (
        <div className="matrix-container">
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{headerTitle}</div>
            {matrix?.user ? (
              <div style={{ opacity: 0.8, marginTop: 6 }}>
                {matrix.user.designation ? <span>{matrix.user.designation}</span> : null}
                {matrix.user.department ? <span> • {matrix.user.department}</span> : null}
              </div>
            ) : null}
            {matrix?.summary ? (
              <div style={{ marginTop: 8, opacity: 0.9 }}>
                Skills: <b>{matrix.summary.totalSkills}</b> • Required Score:{' '}
                <b>{matrix.summary.totalRequiredScore}</b> • Current Score:{' '}
                <b>{matrix.summary.totalCurrentScore}</b> • Completion:{' '}
                <b>{matrix.summary.completionPercentage}%</b>
              </div>
            ) : null}
          </div>

          <table className="matrix-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Required</th>
                <th>Current</th>
                <th>Gap</th>
              </tr>
            </thead>
            <tbody>
              {skillRows.length ? (
                skillRows.map((s) => {
                  const skillId = s.skillId ?? s.skill?.id ?? s.id;
                  const skillName = s.skillName ?? s.skill?.name ?? s.name ?? 'Skill';
                  const required = s.requiredLevel ?? s.required_level ?? s.required ?? 0;
                  const current = s.currentLevel ?? s.current_level ?? s.current ?? 0;
                  const gap = s.gap ?? (Number(required) - Number(current));

                  const isMineRow = selectedUserId === '' || String(authUser?.id) === String(selectedUserId);
                  const editable = canEditMine && isMineRow;

                  return (
                    <tr key={skillId || skillName}>
                      <td>{skillName}</td>
                      <td>{required}</td>
                      <td>
                        {editable ? (
                          <select
                            disabled={savingSkillId === skillId}
                            value={current}
                            onChange={(e) => handleLevelChange(skillId, e.target.value)}
                          >
                            {[0, 1, 2, 3, 4].map((lvl) => (
                              <option key={lvl} value={lvl}>
                                {lvl}
                              </option>
                            ))}
                          </select>
                        ) : (
                          current
                        )}
                      </td>
                      <td>{gap}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', opacity: 0.75 }}>
                    No skills mapped for this designation yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
