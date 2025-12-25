import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './trainingRequirements.css';
import { getUsers } from '../../api/user.api';
import {
  getMyTrainingRequirements,
  getUserTrainingRequirements,
  updateTrainingRequirementStatus,
} from '../../api/trainingRequirement.api';
import { getAuthUser } from '../../utils/auth';

export default function TrainingRequirements() {
  const navigate = useNavigate();
  const authUser = getAuthUser();

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  async function loadUsers() {
    try {
      const u = await getUsers();
      setUsers(Array.isArray(u) ? u : []);
    } catch {
      setUsers([]);
    }
  }

  async function loadData(userId, status) {
    setLoading(true);
    setError('');
    try {
      const data = userId ? await getUserTrainingRequirements(userId, status) : await getMyTrainingRequirements(status);
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setList([]);
      setError(e?.response?.data?.message || e?.message || 'Failed to load training requirements');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    if (authUser?.id) {
      loadData('', statusFilter);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authUser?.id && users.length && !selectedUserId) {
      setSelectedUserId(String(users[0].id));
      loadData(String(users[0].id), statusFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  useEffect(() => {
    loadData(selectedUserId, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, statusFilter]);

  const rows = useMemo(() => (Array.isArray(list) ? list : []), [list]);

  const handleStatusChange = async (id, status) => {
    try {
      setSavingId(id);
      await updateTrainingRequirementStatus(id, status);
      await loadData(selectedUserId, statusFilter);
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Update failed');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="training-req-page">
      <div className="req-header">
        <h2>Training Requirements</h2>
        <button className="secondary-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div className="req-filters">
        <div className="filter-item">
          <label>Employee</label>
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
            {authUser?.id ? <option value="">(Me)</option> : null}
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.employeeId || u.email})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="CLOSED">CLOSED</option>
          </select>
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
        <table className="req-table">
          <thead>
            <tr>
              <th>Skill</th>
              <th>Required</th>
              <th>Current</th>
              <th>Gap</th>
              <th>Priority</th>
              <th>Suggested Training</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.skillName}</td>
                  <td>{r.requiredLevel}</td>
                  <td>{r.currentLevel}</td>
                  <td>{r.gap}</td>
                  <td><span className={`pill ${String(r.priority).toLowerCase()}`}>{r.priority}</span></td>
                  <td>
                    {r.suggestedTraining ? (
                      <div>
                        <div style={{ fontWeight: 700 }}>{r.suggestedTraining.topic}</div>
                        <div style={{ opacity: 0.8, fontSize: 12 }}>
                          {r.suggestedTraining.date} • {r.suggestedTraining.time}
                        </div>
                      </div>
                    ) : (
                      r.suggestedTopic || '-'
                    )}
                  </td>
                  <td>
                    <select
                      disabled={savingId === r.id}
                      value={r.status}
                      onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', opacity: 0.75 }}>
                  No requirements.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
