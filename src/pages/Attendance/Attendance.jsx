import { useEffect, useMemo, useState } from 'react';
import './attendance.css';
import { formatDateIST, formatTimeRangeIST } from '../../utils/datetime';
import { getTrainings, getTrainingBiometric, updateTraining } from '../../api/trainingApi';

function getLocalISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Attendance() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [q, setQ] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Selection
  const [selectedId, setSelectedId] = useState('');
  const selectedTraining = useMemo(
    () => trainings.find((t) => String(t.id) === String(selectedId)) || null,
    [trainings, selectedId],
  );

  // Attendance edit state
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState('');

  const today = useMemo(() => getLocalISODate(), []);
  const isLocked = !!(selectedTraining?.date && selectedTraining.date > today);

  const filteredTrainings = useMemo(() => {
    const query = (q || '').trim().toLowerCase();
    return trainings.filter((t) => {
      const topic = String(t.topic || '').toLowerCase();
      const matchesTopic = !query || topic.includes(query);
      const matchesDate = !dateFilter || String(t.date) === String(dateFilter);
      return matchesTopic && matchesDate;
    });
  }, [trainings, q, dateFilter]);

  const loadTrainings = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await getTrainings();
      setTrainings(Array.isArray(list) ? list : []);

      // Keep selection stable
      const firstId = (Array.isArray(list) && list.length ? list[0].id : '') ?? '';
      setSelectedId((prev) => (prev ? prev : String(firstId)));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load trainings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When selection changes, load attendees into editable rows
  useEffect(() => {
    if (!selectedTraining) {
      setRows([]);
      return;
    }

    const base = Array.isArray(selectedTraining.attendees) ? selectedTraining.attendees : [];
    // Normalize status
    const normalized = base.map((a) => ({
      empId: a.empId,
      name: a.name,
      dept: a.dept || '',
      status: a.status === 'ATTENDED' ? 'ATTENDED' : 'ABSENT',
      biometric: a.biometric, // placeholder (backend later)
      inTime: a.inTime,
      outTime: a.outTime,
    }));
    setRows(normalized);
  }, [selectedTraining]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleStatus = (empId) => {
    setRows((prev) =>
      prev.map((r) =>
        r.empId === empId
          ? { ...r, status: r.status === 'ATTENDED' ? 'ABSENT' : 'ATTENDED' }
          : r,
      ),
    );
  };

  const saveAttendance = async () => {
    if (!selectedTraining) return;
    try {
      setSaving(true);
      setError('');
      await updateTraining(selectedTraining.id, { attendees: rows });
      setToast('Attendance saved');
      await loadTrainings();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const syncBiometric = async () => {
    if (!selectedTraining) return;
    try {
      setSyncing(true);
      setError('');

      const res = await getTrainingBiometric(selectedTraining.id);
      // Backend will later return records with empId + in/out times.
      // For now, we just show the backend message and keep UI stable.
      if (res?.message) setToast(res.message);
    } catch (e) {
      setError(e?.response?.data?.message || 'Biometric sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="attendance-page">
      {/* TOP BAR (training selection always on top) */}
      <div className="attendance-topbar">
        <div className="left">
          <div className="title">
            <h2>Attendance</h2>
            <div className="sub">Biometric + Manual (training-wise)</div>
          </div>

          <div className="filters">
            <div className="field">
              <label>Search (Topic)</label>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by topic…"
              />
            </div>

            <div className="field">
              <label>Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Training</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loading}
              >
                {filteredTrainings.length === 0 ? (
                  <option value="">No trainings</option>
                ) : (
                  filteredTrainings.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.topic} • {formatDateIST(t.date)} • {formatTimeRangeIST(t.time)}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="right">
          {selectedTraining && (
            <div className={`lock-badge ${isLocked ? 'locked' : 'open'}`}>
              {isLocked ? 'Upcoming: Locked' : 'Editable'}
              <span className="mini">Today: {today}</span>
            </div>
          )}

          <div className="actions">
            <button
              className="secondary"
              onClick={syncBiometric}
              disabled={!selectedTraining || syncing || isLocked}
              title={isLocked ? 'Attendance is locked for upcoming trainings' : 'Sync from biometric (placeholder)'}
            >
              {syncing ? 'Syncing…' : 'Sync from Biometric'}
            </button>

            <button
              className="primary"
              onClick={saveAttendance}
              disabled={!selectedTraining || saving || isLocked}
              title={isLocked ? 'Attendance is locked for upcoming trainings' : 'Save attendance'}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {toast && <div className="attendance-toast">{toast}</div>}

      {error && <div className="attendance-error">{error}</div>}

      {/* TABLE */}
      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Biometric</th>
              <th>Status</th>
              <th>Manual</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="no-data">Loading…</td></tr>
            ) : !selectedTraining ? (
              <tr><td colSpan="6" className="no-data">Select a training</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="6" className="no-data">No attendees found for this training</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.empId} className="row-hover">
                  <td>{r.empId}</td>
                  <td className="emp-name">{r.name}</td>
                  <td>{r.dept || '—'}</td>

                  <td>
                    <span className={`bio-pill ${r.biometric ? 'yes' : 'no'}`}>
                      {r.biometric ? 'Synced' : '—'}
                    </span>
                  </td>

                  <td>
                    <span className={`status-pill ${r.status === 'ATTENDED' ? 'att' : 'abs'}`}>
                      {r.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="toggle-btn"
                      onClick={() => toggleStatus(r.empId)}
                      disabled={isLocked}
                      title={isLocked ? 'Upcoming training: attendance locked' : 'Toggle status'}
                    >
                      Mark {r.status === 'ATTENDED' ? 'ABSENT' : 'ATTENDED'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="attendance-note">
        <b>Rule:</b> Attendance will not be edited for upcoming trainings.
         Attendance will only be marked for <b>Today's</b> or <b>Past Training</b>..
      </div>
    </div>
  );
}
