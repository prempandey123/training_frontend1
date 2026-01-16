import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getTrainings, updateTraining, downloadTrainingExcel } from '../../api/trainingApi';
import { searchUsers } from '../../api/user.api';
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

  // Edit Training modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editTopic, setEditTopic] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editFrom, setEditFrom] = useState('');
  const [editTo, setEditTo] = useState('');
  const [editTrainer, setEditTrainer] = useState('');
  // trainingType values come from backend enum: 'Internal' | 'External' | 'Online' | 'Internal In house'
  const [editTrainingType, setEditTrainingType] = useState('Internal');
  const [editAttendees, setEditAttendees] = useState([]);

  // Smart employee search (typeahead) for edit participants
  // State is keyed by row index so multiple rows can search independently
  const [editSearchByRow, setEditSearchByRow] = useState({});

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
    const anyModalOpen = showAttendeeModal || showPostponeModal || showEditModal;

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
  }, [showAttendeeModal, showPostponeModal, showEditModal]);

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


  const openEdit = (training) => {
    setSelectedTraining(training);

    setEditTopic(training?.topic || '');
    setEditDate(training?.date || '');
    setEditTrainer(training?.trainer || '');
    // Backend stores enum values like 'Internal', 'External', ...
    const ttype = training?.trainingType;
    const normalizedType =
      ttype === 'INTERNAL' ? 'Internal' :
      ttype === 'EXTERNAL' ? 'External' :
      ttype === 'ONLINE' ? 'Online' :
      ttype === 'INTERNAL_IN_HOUSE' ? 'Internal In house' :
      (ttype || 'Internal');
    setEditTrainingType(normalizedType);

    const parts = String(training?.time || '')
      .split('-')
      .map((p) => p.trim())
      .filter(Boolean);
    setEditFrom(parts[0] || '');
    setEditTo(parts[1] || '');

    const current = Array.isArray(training?.attendees) ? training.attendees : [];
    setEditAttendees(
      current.map((a) => ({
        empId: a.empId || '',
        name: a.name || '',
        dept: a.dept || '',
        status: a.status,
      })),
    );

    setShowEditModal(true);
  };

  const closeEdit = () => {
    setShowEditModal(false);
    setEditSaving(false);
    setEditTopic('');
    setEditDate('');
    setEditFrom('');
    setEditTo('');
    setEditTrainer('');
    setEditTrainingType('Internal');
    setEditAttendees([]);
    setSelectedTraining(null);
  };

  const addEmptyParticipant = () => {
    setEditAttendees((prev) => [...prev, { empId: '', name: '', dept: '' }]);
  };

  const updateParticipant = (idx, key, value) => {
    setEditAttendees((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [key]: value } : p)),
    );
  };

  const removeParticipant = (idx) => {
    setEditAttendees((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveEdit = async () => {
    if (!selectedTraining?.id) return;

    const topic = (editTopic || '').trim();
    const date = (editDate || '').trim();
    const time = normalizeTimeRange(editFrom, editTo);

    if (!topic) return alert('Please enter topic');
    if (!date) return alert('Please select date');
    if (!time) return alert('Please select From & To time');

    const attendees = (editAttendees || [])
      .map((a) => ({
        empId: String(a.empId || '').trim(),
        name: String(a.name || '').trim(),
        dept: String(a.dept || '').trim(),
        ...(a.status ? { status: a.status } : {}),
      }))
      .filter((a) => a.empId && a.name);

    try {
      setEditSaving(true);
      await updateTraining(selectedTraining.id, {
        topic,
        trainingDate: date,
        trainingTime: time,
        trainer: (editTrainer || '').trim(),
        trainingType: editTrainingType,
        attendees,
      });
      await loadTrainings();
      closeEdit();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || 'Failed to update training');
    } finally {
      setEditSaving(false);
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

  // 🔎 Smart employee search for Edit Participants
  function ParticipantNameTypeahead({ idx, value, onPick, onChange, disabled }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);

    useEffect(() => {
      const q = (value || '').trim();
      if (!q || q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      const t = setTimeout(async () => {
        try {
          setLoading(true);
          const list = await searchUsers(q);
          setResults(Array.isArray(list) ? list : []);
        } catch (e) {
          console.error(e);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 250);

      return () => clearTimeout(t);
    }, [value]);

    const pick = (u) => {
      onPick?.(u);
      setOpen(false);
      setResults([]);
    };

    return (
      <div className="typeahead" style={{ position: 'relative' }}>
        <input
          value={value}
          onChange={(e) => {
            onChange?.(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 140)}
          placeholder="Start typing name / EmpId"
          disabled={disabled}
        />
        {loading && <div className="typeahead-hint">Searching…</div>}
        {open && !!results.length && (
          <div className="typeahead-list" style={{ maxHeight: 220, overflow: 'auto' }}>
            {results.map((u) => {
              const dept = u?.department?.name || u?.department || '—';
              const desig = u?.designation?.designationName || u?.designation || '—';
              return (
                <button
                  key={u.id}
                  type="button"
                  className="typeahead-item"
                  onMouseDown={(e) => e.preventDefault()} // keep focus
                  onClick={() => pick(u)}
                  title={`${u.name} (${u.employeeId})`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span><b>{u.name}</b> <span className="muted">({u.employeeId})</span></span>
                    <span className="muted">{dept}</span>
                  </div>
                  <div className="muted small" style={{ marginTop: 2 }}>{desig}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

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
                  <div className="row-actions">
                    <button className="secondary-btn" onClick={() => openEdit(t)}>
                      Edit
                    </button>
                    <button className="secondary-btn" onClick={() => openPostpone(t)}>
                      Postpone
                    </button>
                  </div>
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
              <th className="th-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="no-data">Loading trainings...</td></tr>
            ) : previousTrainings.length === 0 ? (
              <tr><td colSpan="9" className="no-data">No previous trainings</td></tr>
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
                <td className="td-right">
                  <button className="secondary-btn" onClick={() => openEdit(t)}>
                    Edit
                  </button>
                </td>
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
      

      {/* EDIT MODAL */}
      {showEditModal && selectedTraining && (
        <div className="modal-overlay" style={overlayStyle} onClick={closeEdit}>
          <div
            className="modal large"
            style={{ ...modalStyle, width: 'min(980px, 100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Edit Training</h3>
              <button onClick={closeEdit}>✕</button>
            </div>

            <div className="postpone-meta">
              <div className="muted small"><b>ID:</b> {selectedTraining.id}</div>
              <div className="muted small"><b>Current:</b> {formatDate(selectedTraining.date)} • {selectedTraining.time || '—'}</div>
            </div>

            <div className="form-row two">
              <div className="form-group">
                <label>Topic *</label>
                <input value={editTopic} onChange={(e) => setEditTopic(e.target.value)} placeholder="Training topic" />
              </div>

              <div className="form-group">
                <label>Trainer</label>
                <input value={editTrainer} onChange={(e) => setEditTrainer(e.target.value)} placeholder="Trainer name" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>From *</label>
                <input type="time" value={editFrom} onChange={(e) => setEditFrom(e.target.value)} />
              </div>
              <div className="form-group">
                <label>To *</label>
                <input type="time" value={editTo} onChange={(e) => setEditTo(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Training Type</label>
              <select value={editTrainingType} onChange={(e) => setEditTrainingType(e.target.value)}>
                <option value="Internal">Internal</option>
                <option value="External">External</option>
                <option value="Online">Online</option>
                <option value="Internal In house">Internal In house</option>
              </select>
            </div>

            <div className="block">
              <div className="block-head">
                <div>
                  <b>Participants</b>
                  <div className="muted small">Add/remove participants (EmpId &amp; Name required).</div>
                </div>
                <button className="secondary-btn" onClick={addEmptyParticipant}>+ Add</button>
              </div>

              <table className="modal-table">
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>Employee ID</th>
                    <th>Name</th>
                    <th style={{ width: 180 }}>Department</th>
                    <th style={{ width: 120 }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {editAttendees.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="no-data">No participants. Click “+ Add”.</td>
                    </tr>
                  ) : editAttendees.map((p, i) => (
                    <tr key={`${p.empId}-${i}`}>
                      <td>
                        <input value={p.empId} onChange={(e) => updateParticipant(i, 'empId', e.target.value)} placeholder="EMP001" />
                      </td>
                      <td>
                        <ParticipantNameTypeahead
                          idx={i}
                          value={p.name}
                          disabled={editSaving}
                          onChange={(val) => updateParticipant(i, 'name', val)}
                          onPick={(u) => {
                            updateParticipant(i, 'empId', u?.employeeId || '');
                            updateParticipant(i, 'name', u?.name || '');
                            updateParticipant(i, 'dept', u?.department?.name || u?.department || '');
                          }}
                        />
                      </td>
                      <td>
                        <input value={p.dept || ''} onChange={(e) => updateParticipant(i, 'dept', e.target.value)} placeholder="Dept" />
                      </td>
                      <td>
                        <button className="danger-btn" onClick={() => removeParticipant(i)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="primary-btn full" onClick={saveEdit} disabled={editSaving}>
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

    </div>
    );
}
