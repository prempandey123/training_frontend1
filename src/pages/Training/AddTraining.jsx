import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './training.css';

import { createTraining, sendTrainingMailPreview } from '../../api/trainingApi';
import { searchSkills } from '../../api/skill.api';
import { getUsersUnderSkillLevel } from '../../api/userSkillLevel.api';
import { searchUsers } from '../../api/user.api';
import { to24Time } from '../../utils/datetime';

export default function AddTraining() {
  const navigate = useNavigate();
  const location = useLocation();

  /* BASIC INFO */
  const [topic, setTopic] = useState('');
  const [trainingDate, setTrainingDate] = useState('');
  const [fromTime, setFromTime] = useState(''); // stored as 24h "HH:mm"
  const [toTime, setToTime] = useState('');     // stored as 24h "HH:mm"

  // 12-hour UI controls (HH : MM AM/PM)
  const [fromHH, setFromHH] = useState('09');
  const [fromMM, setFromMM] = useState('00');
  const [fromMeridiem, setFromMeridiem] = useState('AM');
  const [toHH, setToHH] = useState('10');
  const [toMM, setToMM] = useState('00');
  const [toMeridiem, setToMeridiem] = useState('AM');

  const hourOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')),
    [],
  );
  const minuteOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')),
    [],
  );

  // Keep 24h values synced for API payload
  useEffect(() => {
    const v = to24Time(fromHH, fromMM, fromMeridiem);
    if (v) setFromTime(v);
  }, [fromHH, fromMM, fromMeridiem]);

  useEffect(() => {
    const v = to24Time(toHH, toMM, toMeridiem);
    if (v) setToTime(v);
  }, [toHH, toMM, toMeridiem]);
  const [status, setStatus] = useState('PENDING');
  const [cancelRemark, setCancelRemark] = useState('');
  // UI label: Mode (kept as trainingType key for backward compatibility)
  const [trainingType, setTrainingType] = useState('Internal');
  const [category, setCategory] = useState('Both');
  const [type, setType] = useState('Mandatory');
  const [trainer, setTrainer] = useState('');
  const [venue, setVenue] = useState('');

  // If user came from Calendar date click, pre-fill the training date
  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const date = (params.get('date') || '').trim();
    const topicParam = (params.get('topic') || '').trim();
    const monthParam = (params.get('month') || '').trim(); // YYYY-MM
    const trainerParam = (params.get('trainer') || '').trim();

    // topic (from annual calendar click)
    if (topicParam) {
      // URLSearchParams already returns decoded values
      setTopic(topicParam);
    }

    // trainer (from annual calendar click) - editable before save
    if (trainerParam) {
      setTrainer((prev) => (prev ? prev : trainerParam));
    }

    // date (from day-calendar click)
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setTrainingDate(date);
      return;
    }

    // month (from annual calendar month click) -> default to 1st of that month
    if (/^\d{4}-\d{2}$/.test(monthParam)) {
      setTrainingDate(`${monthParam}-01`);
    }
  }, [location.search]);

  /* SKILL SEARCH */
  const [skillQuery, setSkillQuery] = useState('');
  const [skillResults, setSkillResults] = useState([]);
  const [skillLoading, setSkillLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null); // {id, name}

  /* USERS UNDER SKILL LEVEL */
  const [gapLoading, setGapLoading] = useState(false);
  const [gapUsers, setGapUsers] = useState([]); // [{userId, employeeId, name, department, designation, currentLevel}]
  const [gapFilter, setGapFilter] = useState('');

  /* MANUAL EMPLOYEE SEARCH */
  const [manualQuery, setManualQuery] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualResults, setManualResults] = useState([]);
  const [manualError, setManualError] = useState('');

  /* ASSIGNED EMPLOYEES */
  const [assignedUserIds, setAssignedUserIds] = useState([]); // store ids for checkbox safety

  /* TOAST (tiny, local) */
  const [toast, setToast] = useState(null); // {type:'info'|'success'|'error', msg:string}

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const assignedUsers = useMemo(() => {
    const byId = new Map();
    [...gapUsers, ...manualResults].forEach((u) => {
      const id = u?.userId ?? u?.id;
      if (!id) return;
      if (!byId.has(id)) byId.set(id, u);
    });
    return assignedUserIds.map((id) => byId.get(id)).filter(Boolean);
  }, [assignedUserIds, gapUsers, manualResults]);

  const addAssigned = (userId) => {
    setAssignedUserIds((prev) => {
      if (prev.includes(userId)) {
        showToast('Already added.', 'info');
        return prev;
      }
      return [...prev, userId];
    });
  };

  const handlePickFromList = (userId, nextChecked) => {
    // Make lists "add only" to avoid accidental un-assign. Remove via chips.
    if (nextChecked) {
      addAssigned(userId);
      return;
    }
    showToast('Remove from the selected chips to unassign.', 'info');
  };

  const removeAssigned = (userId) => {
    setAssignedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const clearSelection = () => {
    setAssignedUserIds([]);
  };

  /* SKILL TYPEAHEAD (debounced) */
  useEffect(() => {
    const q = (skillQuery || '').trim();

    // if user already picked a skill, typing edits should "unselect" it
    if (selectedSkill && q && q !== selectedSkill.name) {
      setSelectedSkill(null);
      setGapUsers([]);
      setAssignedUserIds([]);
    }

    if (!q || q.length < 2) {
      setSkillResults([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setSkillLoading(true);
        const list = await searchSkills(q);
        setSkillResults(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        setSkillResults([]);
      } finally {
        setSkillLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [skillQuery]);

  /* WHEN SKILL SELECTED -> fetch users with level < 4 */
  const pickSkill = async (skill) => {
    setSelectedSkill(skill);
    setSkillQuery(skill?.name || '');
    setSkillResults([]);
    setGapFilter('');
    setAssignedUserIds([]);

    if (!skill?.id) return;
    try {
      setGapLoading(true);
      // below 4 => maxLevel = 3
      const users = await getUsersUnderSkillLevel(skill.id, 3);
      setGapUsers(Array.isArray(users) ? users : []);
    } catch (e) {
      console.error(e);
      setGapUsers([]);
    } finally {
      setGapLoading(false);
    }
  };

  const filteredGapUsers = useMemo(() => {
    const q = (gapFilter || '').trim().toLowerCase();
    if (!q) return gapUsers;
    return gapUsers.filter((u) => {
      const name = (u?.name || '').toLowerCase();
      const emp = (u?.employeeId || '').toLowerCase();
      const dept = (u?.department || '').toLowerCase();
      const desig = (u?.designation || '').toLowerCase();
      return name.includes(q) || emp.includes(q) || dept.includes(q) || desig.includes(q);
    });
  }, [gapUsers, gapFilter]);

  const doManualSearch = async () => {
    const q = (manualQuery || '').trim();
    setManualError('');
    setManualResults([]);
    if (!q) {
      setManualError('Enter employee code or name.');
      return;
    }
    try {
      setManualLoading(true);
      const res = await searchUsers(q);
      const list = Array.isArray(res) ? res : [];
      // normalize to a common shape
      const normalized = list.map((u) => ({
        userId: u.id,
        employeeId: u.employeeId,
        name: u.name,
        department: u.department?.name ?? u.department ?? null,
        designation: u.designation?.designationName ?? u.designation ?? null,
        currentLevel: null,
      }));
      setManualResults(normalized);
      if (!normalized.length) setManualError('No employees found.');
    } catch (e) {
      console.error(e);
      setManualError('Search failed.');
    } finally {
      setManualLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (status === 'CANCELLED' && !(cancelRemark || '').trim()) {
      return alert('Please enter cancel remarks');
    }

    const assignedEmployees = assignedUsers.map((u) => ({
      empId: u.employeeId,
      name: u.name,
      dept: u.department || undefined,
    }));

    const departments = Array.from(
      new Set(assignedUsers.map((u) => u.department).filter(Boolean)),
    );

    const payload = {
      topic,
      venue: (venue || '').trim() || undefined,
      trainingDate,
      trainingTime: `${fromTime} - ${toTime}`,
      departments,
      skills: selectedSkill?.name ? [selectedSkill.name] : [],
      assignedEmployees,
      status,
      cancelRemark: (cancelRemark || '').trim() || undefined,
      // Backend stores this as trainingType but UI calls it Mode
      trainingType,
      category,
      type,
      trainer: (trainer || "").trim() || undefined,
    };

    try {
      await createTraining(payload);
      alert('Training assigned');
      navigate('/training');
    } catch (err) {
      console.error(err);
      alert('Failed to assign training');
    }
  };

  const handleSendMail = async () => {
    try {
      if (status === 'CANCELLED' && !(cancelRemark || '').trim()) {
        return alert('Please enter cancel remarks');
      }
      const assignedEmployees = assignedUsers.map((u) => ({
        empId: u.employeeId,
        name: u.name,
        dept: u.department || undefined,
      }));

      const departments = Array.from(new Set(assignedUsers.map((u) => u.department).filter(Boolean)));

      const payload = {
        topic,
        venue: (venue || '').trim() || undefined,
        trainingDate,
        trainingTime: `${fromTime} - ${toTime}`,
        departments,
        skills: selectedSkill?.name ? [selectedSkill.name] : [],
        assignedEmployees,
        status,
        cancelRemark: (cancelRemark || '').trim() || undefined,
        trainingType,
        category,
        type,
        trainer: (trainer || "").trim() || undefined,
      };

      await sendTrainingMailPreview(payload);
      showToast(`Mail sent to ${assignedEmployees.length} participant(s).`, "success");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to send mail. Please check backend logs / Brevo config.";
      showToast(Array.isArray(msg) ? msg.join(", ") : msg, "error");
    }
  };


  return (
    <div className="training-page">
      <div className="training-header">
        <h2>Assign Training</h2>
        <button className="back-btn" onClick={() => navigate('/training')} type="button">
          ← Back
        </button>
      </div>

      <form className="training-form new" onSubmit={handleSubmit}>
        <div className="add-training-layout">
          {/* LEFT: BASIC */}
          <div className="card">
            <div className="card-head">
              <h3>Training details</h3>
              <span className="muted">Create session</span>
            </div>

            <div className="form-group">
              <label>Training Topic *</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Trainer name (optional)</label>
              <input
                value={trainer}
                onChange={(e) => setTrainer(e.target.value)}
                placeholder="e.g. Mr. Sharma"
              />
              <div className="helper">You can keep this blank.</div>
            </div>

            <div className="form-group">
              <label>Venue (optional)</label>
              <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Training Room 2 / Auditorium / Online (Teams)"
              />
              <div className="helper">Location of the session (will be shown in listing & emails).</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={trainingDate}
                  onChange={(e) => setTrainingDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mode *</label>
                <select value={trainingType} onChange={(e) => setTrainingType(e.target.value)} required>
                  <option value="Internal">Internal</option>
                  <option value="External">External</option>
                  <option value="Online">Online</option>
                  <option value="Internal In house">Internal In house</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                  <option value="Worker">Worker</option>
                  <option value="Staff">Staff</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select value={type} onChange={(e) => setType(e.target.value)} required>
                  <option value="Mandatory">Mandatory</option>
                  <option value="Optional">Optional</option>
                </select>
              </div>
            </div>

            <div className="form-row two">
              <div className="form-group">
                <label>From *</label>
                <div className="time12">
                  <select value={fromHH} onChange={(e) => setFromHH(e.target.value)} required>
                    {hourOptions.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="time-sep">:</span>
                  <select value={fromMM} onChange={(e) => setFromMM(e.target.value)} required>
                    {minuteOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select value={fromMeridiem} onChange={(e) => setFromMeridiem(e.target.value)} required>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>To *</label>
                <div className="time12">
                  <select value={toHH} onChange={(e) => setToHH(e.target.value)} required>
                    {hourOptions.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="time-sep">:</span>
                  <select value={toMM} onChange={(e) => setToMM(e.target.value)} required>
                    {minuteOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select value={toMeridiem} onChange={(e) => setToMeridiem(e.target.value)} required>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row two">
              <div className="form-group">
                <label>Status *</label>
                <select
                  value={status}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStatus(v);
                    if (v !== 'CANCELLED') setCancelRemark('');
                  }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="POSTPONED">Postponed</option>
                  <option value="CANCELLED">Cancelled (with remarks)</option>
                </select>
              </div>
              {status === 'CANCELLED' && (
                <div className="form-group">
                  <label>Cancel remarks *</label>
                  <input
                    type="text"
                    value={cancelRemark}
                    onChange={(e) => setCancelRemark(e.target.value)}
                    placeholder="Reason / remark for cancelling"
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Selected skill</label>
                <div className="pill">
                  {selectedSkill?.name ? selectedSkill.name : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: SKILL + EMPLOYEES */}
          <div className="card">
            <div className="card-head">
              <h3>Pick skill & employees</h3>
              <button
                type="button"
                className="link-btn"
                onClick={clearSelection}
                disabled={!assignedUserIds.length || !topic || !trainingDate || !fromTime || !toTime}
                title="Remove all selected employees"
              >
                Clear selection
              </button>
            </div>

            {/* SELECTED CHIPS */}
            {!!assignedUsers.length && (
              <div className="selected-chips" aria-label="Selected employees">
                {assignedUsers.map((u) => {
                  const id = u?.userId ?? u?.id;
                  const label = `${u.name}${u.employeeId ? ` (${u.employeeId})` : ''}`;
                  return (
                    <span key={id} className="chip" title={label}>
                      <span className="chip-text">{u.name}</span>
                      {u.employeeId && <span className="chip-code">{u.employeeId}</span>}
                      <button
                        type="button"
                        className="chip-x"
                        onClick={() => removeAssigned(id)}
                        aria-label={`Remove ${label}`}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* SKILL SEARCH */}
            <div className="form-group">
              <label>Skill (search from backend) *</label>
              <div className="typeahead">
                <input
                  value={skillQuery}
                  onChange={(e) => setSkillQuery(e.target.value)}
                  placeholder="Type skill name (min 2 letters)"
                  required
                />
                {skillLoading && <div className="typeahead-hint">Searching…</div>}
                {!!skillResults.length && (
                  <div className="typeahead-list">
                    {skillResults.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="typeahead-item"
                        onClick={() => pickSkill({ id: s.id, name: s.name })}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="helper">Selecting a skill will auto-load employees with level &lt; 4.</div>
            </div>

            {/* AUTO LIST */}
            <div className={`block ${!selectedSkill ? 'disabled' : ''}`}>
              <div className="block-head">
                <div>
                  <b>Skill gap employees</b>
                  <div className="muted small">({selectedSkill?.name || 'No skill selected'})</div>
                </div>
                <input
                  className="mini"
                  placeholder="Filter list…"
                  value={gapFilter}
                  onChange={(e) => setGapFilter(e.target.value)}
                  disabled={!selectedSkill}
                />
              </div>

              {gapLoading ? (
                <div className="empty">Loading employees…</div>
              ) : !selectedSkill ? (
                <div className="empty">Search and select a skill first.</div>
              ) : filteredGapUsers.length ? (
                <div className="employee-list pretty">
                  {filteredGapUsers.map((u) => (
                    <label key={u.userId} className="employee-row" title="Select to assign">
                      <input
                        type="checkbox"
                        checked={assignedUserIds.includes(u.userId)}
                        onChange={(e) => handlePickFromList(u.userId, e.target.checked)}
                      />
                      <div className="emp-main">
                        <div className="emp-title">
                          <span className="emp-name">{u.name}</span>
                          <span className="emp-code">{u.employeeId}</span>
                        </div>
                        <div className="emp-sub">
                          <span>{u.department || '—'}</span>
                          <span className="dot">•</span>
                          <span>{u.designation || '—'}</span>
                        </div>
                      </div>
                      <div className="level-badge">Level {u.currentLevel}</div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="empty">No employees found below level 4 for this skill.</div>
              )}
            </div>

            {/* MANUAL SEARCH */}
            <div className="block">
              <div className="block-head">
                <div>
                  <b>Add specific employee</b>
                  <div className="muted small">Search by code or name (Department & Designation shown).</div>
                </div>
              </div>

              <div className="search-row">
                <input
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="e.g. HSL101 or Amit"
                />
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={doManualSearch}
                  disabled={manualLoading}
                >
                  {manualLoading ? 'Searching…' : 'Search'}
                </button>
              </div>
              {manualError && <div className="helper error">{manualError}</div>}

              {!!manualResults.length && (
                <div className="employee-list pretty">
                  {manualResults.map((u) => (
                    <label key={u.userId} className="employee-row" title="Select to add">
                      <input
                        type="checkbox"
                        checked={assignedUserIds.includes(u.userId)}
                        onChange={(e) => handlePickFromList(u.userId, e.target.checked)}
                      />
                      <div className="emp-main">
                        <div className="emp-title">
                          <span className="emp-name">{u.name}</span>
                          <span className="emp-code">{u.employeeId}</span>
                        </div>
                        <div className="emp-sub">
                          <span>{u.department || '—'}</span>
                          <span className="dot">•</span>
                          <span>{u.designation || '—'}</span>
                        </div>
                      </div>
                      <div className="level-badge ghost">Manual</div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* SUMMARY */}
            <div className="assign-summary">
              <div>
                <div className="muted small">Selected employees</div>
                <div className="big">{assignedUserIds.length}</div>
                {!!assignedUsers.length && (
                  <div className="mini-preview" aria-label="Selected employees preview">
                    {assignedUsers.slice(0, 4).map((u) => {
                      const id = u?.userId ?? u?.id;
                      const label = `${u.name}${u.employeeId ? ` (${u.employeeId})` : ''}`;
                      return (
                        <span key={id} className="preview-pill" title={label}>
                          {u.name}
                        </span>
                      );
                    })}
                    {assignedUsers.length > 4 && (
                      <span className="preview-more">+{assignedUsers.length - 4} more</span>
                    )}
                  </div>
                )}
              </div>
              <div className="assign-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleSendMail}
                  disabled={!assignedUserIds.length || !topic || !trainingDate || !fromTime || !toTime}
                >
                  Send mail to participants
                </button>
                <button type="submit" className="primary-btn" disabled={!selectedSkill || !assignedUserIds.length}>
                  Assign Training
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* TOAST */}
      {toast && (
        <div className="toast-wrap" role="status" aria-live="polite">
          <div className={`toast ${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
