import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getTrainings, updateTraining, downloadTrainingExcel } from '../../api/trainingApi';
import './training.css';

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString();
};

const normalizeTimeRange = (from, to) => {
  const f = (from || '').trim();
  const t = (to || '').trim();
  if (!f || !t) return '';
  return `${f} - ${t}`;
};

const statusMeta = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'COMPLETED') return { label: 'Completed', cls: 'completed' };
  if (s === 'ACTIVE') return { label: 'Active', cls: 'active' };
  if (s === 'POSTPONED') return { label: 'Postponed', cls: 'postponed' };
  return { label: 'Pending', cls: 'pending' };
};

export default function Training() {
  const navigate = useNavigate();

  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);

  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Postpone form state
  const [postponeReason, setPostponeReason] = useState('');
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeFrom, setPostponeFrom] = useState('');
  const [postponeTo, setPostponeTo] = useState('');
  const [postponeSaving, setPostponeSaving] = useState(false);

  const loadTrainings = async () => {
    try {
      const data = await getTrainings();
      setTrainings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert('Failed to load trainings');
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

const exportExcel = async () => {
  try {
    const blobData = await downloadTrainingExcel();
    const blob = new Blob([blobData], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-list-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    alert('Failed to export Excel');
  }
};


  useEffect(() => {
    loadTrainings();
  }, []);

  // ✅ When any modal opens -> scroll to top + lock body scroll
  useEffect(() => {
    const anyModalOpen = showAttendeeModal || showPostponeModal;

    if (anyModalOpen) {
      // scroll modal view to top so it never opens "down"
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // lock background scroll
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = prevOverflow || '';
      };
    }
  }, [showAttendeeModal, showPostponeModal]);

  const today = useMemo(() => new Date(), []);

  const upcomingTrainings = useMemo(
    () => trainings.filter((t) => new Date(t.date) >= today),
    [trainings, today],
  );

  const previousTrainings = useMemo(
    () => trainings.filter((t) => new Date(t.date) < today),
    [trainings, today],
  );

  const openAttendees = (training) => {
    setSelectedTraining(training);
    setShowAttendeeModal(true);
  };

  const closeAttendees = () => {
    setShowAttendeeModal(false);
    // optional: keep selectedTraining for a moment or clear it
    setSelectedTraining(null);
  };

  const openPostpone = (training) => {
    setSelectedTraining(training);

    // Prefill with current values so edit is smooth
    setPostponeReason(training?.postponeReason || '');
    setPostponeDate(training?.date || '');

    const parts = String(training?.time || '')
      .split('-')
      .map((p) => p.trim())
      .filter(Boolean);
    setPostponeFrom(parts[0] || '');
    setPostponeTo(parts[1] || '');

    setShowPostponeModal(true);
  };

  const closePostpone = () => {
    setShowPostponeModal(false);
    setSelectedTraining(null);
    setPostponeReason('');
    setPostponeDate('');
    setPostponeFrom('');
    setPostponeTo('');
    setPostponeSaving(false);
  };

  const submitPostpone = async () => {
    const reason = (postponeReason || '').trim();
    const date = (postponeDate || '').trim();
    const time = normalizeTimeRange(postponeFrom, postponeTo);

    if (!selectedTraining?.id) return;
    if (!reason) return alert('Please enter reason');
    if (!date) return alert('Please select new date');
    if (!time) return alert('Please select From & To time');

    try {
      setPostponeSaving(true);
      await updateTraining(selectedTraining.id, {
        status: 'POSTPONED',
        trainingDate: date,
        trainingTime: time,
        postponeReason: reason,
      });
      await loadTrainings();
      closePostpone();
    } catch (e) {
      console.error(e);
      alert('Failed to postpone training');
    } finally {
      setPostponeSaving(false);
    }
  };

  const renderStatus = (t) => {
    const meta = statusMeta(t?.status);
    const reason = (t?.postponeReason || '').trim();
    const tooltip = meta.cls === 'postponed' && reason ? `Reason: ${reason}` : '';

    return (
      <span
        className={`status-pill ${meta.cls}`}
        title={tooltip}
        data-tooltip={tooltip}
      >
        {meta.label}
      </span>
    );
  };

  // ✅ Inline styles to FORCE overlay to open on top (even if CSS is wrong)
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px',
  };

  const modalStyle = {
    width: 'min(980px, 100%)',
    maxHeight: '85vh',
    overflow: 'auto',
    borderRadius: '14px',
  };

  return (
    <div className="training-page">
      {/* HEADER */}
      <div className="training-header">
        <div>
          <h2>Training Management</h2>
          <div className="muted small">Plan, postpone and track attendance.</div>
        </div>
        <div className="training-header-actions">
  <button className="secondary-btn" onClick={exportExcel}>
    Export Excel
  </button>
  <button className="primary-btn" onClick={() => navigate('/training/add')}>
    + Add Training
  </button>
</div>
      </div>

      {/* UPCOMING TRAININGS */}
      <div className="training-section">
        <div className="section-head">
          <h3>Upcoming Trainings</h3>
          <div className="muted small">Includes postponed sessions with the new date &amp; time.</div>
        </div>

        <table className="training-table pretty">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Training Type</th>
              <th>Date</th>
              <th>Time</th>
              <th>Department</th>
              <th>Trainer</th>
              <th>Participants</th>
              <th>Status</th>
              <th className="th-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="no-data">Loading trainings...</td></tr>
            ) : upcomingTrainings.length === 0 ? (
              <tr><td colSpan="9" className="no-data">No upcoming trainings</td></tr>
            ) : upcomingTrainings.map((t) => (
              <tr key={t.id} className="row-hover">
                <td className="training-name">{t.topic}</td>
                <td>{t.trainingType || "—"}</td>
                <td>{formatDate(t.date)}</td>
                <td>{t.time || '—'}</td>
                <td>{t.department || '—'}</td>
                <td>{t.trainer || '—'}</td>
                <td>
                  <span
                    className="people-count"
                    onClick={() => openAttendees(t)}
                    title="View attendance"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openAttendees(t);
                    }}
                  >
                    {Array.isArray(t.attendees) ? t.attendees.length : 0}
                  </span>
                </td>
                <td>{renderStatus(t)}</td>
                <td className="td-right">
                  <button className="secondary-btn" onClick={() => openPostpone(t)}>
                    Postpone
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PREVIOUS TRAININGS */}
      <div className="training-section">
        <div className="section-head">
          <h3>Previous Trainings</h3>
          <div className="muted small">Old sessions (completed/active/pending/postponed).</div>
        </div>

        <table className="training-table pretty">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Training Type</th>
              <th>Date</th>
              <th>Time</th>
              <th>Department</th>
              <th>Trainer</th>
              <th>Participants</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="no-data">Loading trainings...</td></tr>
            ) : previousTrainings.length === 0 ? (
              <tr><td colSpan="7" className="no-data">No previous trainings</td></tr>
            ) : previousTrainings.map((t) => (
              <tr key={t.id} className="row-hover">
                <td className="training-name">{t.topic}</td>
                <td>{t.trainingType || "—"}</td>
                <td>{formatDate(t.date)}</td>
                <td>{t.time || '—'}</td>
                <td>{t.department || '—'}</td>
                <td>{t.trainer || '—'}</td>
                <td>
                  <span
                    className="people-count"
                    onClick={() => openAttendees(t)}
                    title="View attendance"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openAttendees(t);
                    }}
                  >
                    {Array.isArray(t.attendees) ? t.attendees.length : 0}
                  </span>
                </td>
                <td>{renderStatus(t)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ATTENDANCE MODAL */}
      {showAttendeeModal && selectedTraining && (
        <div className="modal-overlay" style={overlayStyle} onClick={closeAttendees}>
          <div
            className="modal large"
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{selectedTraining.topic} – Attendance</h3>
              <button onClick={closeAttendees}>✕</button>
            </div>

            <div className="attendance-summary">
              <div className="badge attended">
                Attended
                <b>
                  {(selectedTraining.attendees || []).filter(e => e.status === 'ATTENDED').length}
                </b>
              </div>

              <div className="badge absent">
                Absent
                <b>
                  {(selectedTraining.attendees || []).filter(e => e.status === 'ABSENT').length}
                </b>
              </div>
            </div>

            <table className="modal-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {(selectedTraining.attendees || []).map(emp => (
                  <tr key={emp.empId}>
                    <td>{emp.empId}</td>
                    <td>{emp.name}</td>
                    <td>{emp.dept}</td>
                    <td>
                      <span className={`attendance-status ${emp.status === 'ATTENDED' ? 'green' : 'red'}`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </div>
      )}

      {/* POSTPONE MODAL */}
      {showPostponeModal && selectedTraining && (
        <div className="modal-overlay" style={overlayStyle} onClick={closePostpone}>
          <div
            className="modal"
            style={{ ...modalStyle, width: 'min(720px, 100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Postpone Training</h3>
              <button onClick={closePostpone}>✕</button>
            </div>

            <div className="postpone-meta">
              <div className="muted small"><b>Topic:</b> {selectedTraining.topic}</div>
              <div className="muted small"><b>Current:</b> {formatDate(selectedTraining.date)} • {selectedTraining.time || '—'}</div>
            </div>

            <div className="form-group">
              <label>Reason *</label>
              <textarea
                rows="3"
                placeholder="Reason for postponement"
                value={postponeReason}
                onChange={(e) => setPostponeReason(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>New Date *</label>
                <input type="date" value={postponeDate} onChange={(e) => setPostponeDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>From *</label>
                <input type="time" value={postponeFrom} onChange={(e) => setPostponeFrom(e.target.value)} />
              </div>
              <div className="form-group">
                <label>To *</label>
                <input type="time" value={postponeTo} onChange={(e) => setPostponeTo(e.target.value)} />
              </div>
            </div>

            <button
              className="primary-btn full"
              onClick={submitPostpone}
              disabled={postponeSaving}
            >
              {postponeSaving ? 'Rescheduling…' : 'Reschedule Training'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
