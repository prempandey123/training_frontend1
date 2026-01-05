import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './skillGap.css';
import { getUsers } from '../../api/user.api';
import { getMySkillGap, getUserSkillGap } from '../../api/skillGap.api';
import { autoCreateRequirementsForUser, autoCreateMyRequirements } from '../../api/trainingRequirement.api';
import { getAuthUser } from '../../utils/auth';
import { getPriorityFromCurrentLevel } from '../../utils/priority';

export default function SkillGap() {
  const navigate = useNavigate();
  const authUser = getAuthUser();

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoCreating, setAutoCreating] = useState(false);

  const isMe = selectedUserId === '';

  async function loadUsers() {
    try {
      const list = await getUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch {
      setUsers([]);
    }
  }

  async function loadReport(userId) {
    setLoading(true);
    setError('');
    try {
      const data = userId ? await getUserSkillGap(userId) : await getMySkillGap();
      setReport(data);
    } catch (e) {
      setReport(null);
      setError(e?.response?.data?.message || e?.message || 'Failed to load skill gap report');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    if (authUser?.id) {
      loadReport('');
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authUser?.id && users.length && !selectedUserId) {
      setSelectedUserId(String(users[0].id));
      loadReport(String(users[0].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const gaps = useMemo(() => {
    const g = report?.skillGaps;
    return Array.isArray(g) ? g : [];
  }, [report]);

  const handleAutoCreate = async () => {
    try {
      setAutoCreating(true);
      if (isMe) {
        await autoCreateMyRequirements();
      } else {
        await autoCreateRequirementsForUser(selectedUserId);
      }
      alert('Training requirements generated/updated from gaps ✅');
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Auto-create failed');
    } finally {
      setAutoCreating(false);
    }
  };

  return (
    <div className="skill-gap-page">
      <div className="gap-header">
        <h2>Skill Gap (Per User)</h2>
        <div className="gap-header-actions">
          <button className="secondary-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <button className="primary-btn" disabled={autoCreating || loading} onClick={handleAutoCreate}>
            {autoCreating ? 'Generating...' : 'Auto-create Training Requirements'}
          </button>
        </div>
      </div>

      <div className="gap-filters">
        <div className="filter-item">
          <label>Employee</label>
          <select
            value={selectedUserId}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedUserId(v);
              loadReport(v);
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
            Priority: HIGH (current level 0-1), MEDIUM (level 2), LOW (level 3).
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
        <>
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {report?.user?.name || report?.user?.email || 'User'}
            </div>
            {report?.user ? (
              <div style={{ opacity: 0.8, marginTop: 6 }}>
                {report.user.designation ? <span>{report.user.designation}</span> : null}
                {report.user.department ? <span> • {report.user.department}</span> : null}
              </div>
            ) : null}
            {report?.summary ? (
              <div style={{ marginTop: 8, opacity: 0.9 }}>
                Total skills: <b>{report.summary.totalSkills}</b> • Gap skills: <b>{report.summary.gapSkills}</b> •
                High: <b>{report.summary.highPriority}</b> • Medium: <b>{report.summary.mediumPriority}</b> • Low: <b>{report.summary.lowPriority}</b>
              </div>
            ) : null}
          </div>

          <table className="gap-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Required</th>
                <th>Current</th>
                <th>Gap</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {gaps.length ? (
                gaps.map((g) => (
                  <tr key={g.skillId}>
                    <td>{g.skillName}</td>
                    <td>{g.requiredLevel}</td>
                    <td>{g.currentLevel}</td>
                    <td>{g.gap}</td>
                    <td>
                      {(() => {
                        const p = getPriorityFromCurrentLevel(g.currentLevel);
                        return (
                          <span className={`pill ${p.key}`}>{p.label}</span>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', opacity: 0.75 }}>
                    No skill gaps 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
