import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import './skillMatrix.css';
import { getUsers } from '../../api/user.api';
import { getSkillMatrixForUser, getMySkillMatrix } from '../../api/skillMatrix.api';
import { getAuthUser } from '../../utils/auth';
import { upsertMySkillLevel, upsertUserSkillLevel } from '../../api/userSkillLevel.api';
import { openPrintWindow } from '../../utils/printPdf';
import { buildUserMatrixPrintHtml } from '../../utils/userMatrixPrint';
import { clampLevel, clampPercent, getLevelColor, getPercentColor } from '../../utils/skillColor';

export default function SkillMatrix() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSkillId, setSavingSkillId] = useState(null);
  const [error, setError] = useState('');
  const [printFriendly, setPrintFriendly] = useState(true);

  // Employee dropdown search (explicit apply)
  const [userSearch, setUserSearch] = useState('');
  const [appliedUserSearch, setAppliedUserSearch] = useState('');

  const authUser = getAuthUser();

  const canEditMine = Boolean(authUser?.id);
  const roleStr = String(authUser?.role || '').toUpperCase();
  const isAdmin = roleStr.includes('ADMIN');
  const isHR = roleStr.includes('HR');
  const isHOD = roleStr === 'HOD';
  const canEditAll = isAdmin || isHR || isHOD;

  async function loadUsers() {
    try {
      const list = await getUsers();
      const all = Array.isArray(list) ? list : [];
      // Worker Skill Matrix should list WORKER employees only
      const workers = all.filter((u) => String(u?.employeeType || u?.employee_type || '').toUpperCase() === 'WORKER');

      // ✅ HOD should see ONLY own department employees
      const deptId = authUser?.departmentId;
      const scoped = isHOD && deptId
        ? workers.filter((u) => String(u?.departmentId || u?.department_id) === String(deptId))
        : workers;

      setUsers(scoped);
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

  const filteredUsers = useMemo(() => {
    const term = appliedUserSearch.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => {
      const name = String(u?.name || '').toLowerCase();
      const empId = String(u?.employeeId || '').toLowerCase();
      const email = String(u?.email || '').toLowerCase();
      return name.includes(term) || empId.includes(term) || email.includes(term);
    });
  }, [users, appliedUserSearch]);

  const skillRows = useMemo(() => {
    const rows = matrix?.skills;
    return Array.isArray(rows) ? rows : [];
  }, [matrix]);

  const headerTitle = matrix?.user?.name || matrix?.user?.email || 'Skill Matrix';

  const exportPdf = () => {
    const userTitle = headerTitle;
    const metaParts = [];
    if (matrix?.user?.designation) metaParts.push(matrix.user.designation);
    if (matrix?.user?.department) metaParts.push(matrix.user.department);

    const html = buildUserMatrixPrintHtml({
      title: 'Skill Matrix',
      userTitle,
      userMeta: metaParts.join(' • '),
      summary: matrix?.summary || null,
      rows: skillRows,
      printFriendly,
    });

    openPrintWindow({
      title: 'Skill Matrix',
      html,
      landscape: true,
    });
  };

  const handleLevelChange = async (skillId, nextLevel) => {
    if (!canEditMine && !canEditAll) return;
    setSavingSkillId(skillId);
    try {
      const targetUserId = selectedUserId ? Number(selectedUserId) : Number(authUser?.id);
      const isMyView = !selectedUserId || String(targetUserId) === String(authUser?.id);

      if (canEditAll && !isMyView) {
        await upsertUserSkillLevel(targetUserId, skillId, Number(nextLevel));
        await loadMatrix(String(targetUserId));
      } else {
        await upsertMySkillLevel(skillId, Number(nextLevel));
        await loadMatrix(''); // reload my matrix
      }
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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className={`add-btn ${printFriendly ? 'active' : ''}`}
            onClick={() => setPrintFriendly((v) => !v)}
            title="Softer colors + grey borders (best for printing)"
          >
            Print-friendly
          </button>

          <button
            type="button"
            className="add-btn"
            onClick={exportPdf}
            title="Opens print dialog — choose Save as PDF"
          >
            Export PDF
          </button>

          <button className="add-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </div>

      <div className="matrix-filters">
        <div className="filter-item">
          <label>Employee</label>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search employee (name / emp id / email)"
              style={{ minWidth: 260, flex: 1 }}
            />
            <button type="button" className="add-btn" onClick={() => setAppliedUserSearch(userSearch)}>
              Search
            </button>
            <button
              type="button"
              className="add-btn"
              onClick={() => {
                setUserSearch('');
                setAppliedUserSearch('');
              }}
            >
              Clear
            </button>
          </div>

          <select
            value={selectedUserId}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedUserId(v);
              loadMatrix(v);
            }}
          >
            {authUser?.id ? <option value="">(Me)</option> : null}
            {filteredUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.employeeId || u.email})
              </option>
            ))}
          </select>
          <small style={{ opacity: 0.7 }}>
            {canEditAll
              ? (isHOD
                  ? 'HOD: you can update current levels for employees in your department.'
                  : 'Admin/HR: you can update any selected employee\'s current level.')
              : 'Note: Only your own levels are editable.'}
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
                <CompletionPill percent={matrix.summary.completionPercentage} printFriendly={printFriendly} />
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
                  const required = 4; // 🔒 fixed required level
                  const current = s.currentLevel ?? s.current_level ?? s.current ?? 0;
                  const gap = s.gap ?? (Number(required) - Number(current));

                  const reqLevel = clampLevel(required);
                  const curLevel = clampLevel(current);
                  const reqC = getLevelColor(reqLevel, { printFriendly: false });
                  const curC = getLevelColor(curLevel, { printFriendly: false });

                  const isMineRow = selectedUserId === '' || String(authUser?.id) === String(selectedUserId);
                  const editable = canEditAll || (canEditMine && isMineRow);

                  return (
                    <tr key={skillId || skillName}>
                      <td style={{ fontWeight: 700 }}>{skillName}</td>

                      <td style={{ background: reqC.bg, color: reqC.text, textAlign: 'center', fontWeight: 700 }}>
                        {reqLevel}
                      </td>

                      <td
                        style={{ background: curC.bg, color: curC.text, textAlign: 'center', fontWeight: 700 }}
                        title={editable ? 'Click to edit current level' : ''}
                      >
                        {editable ? (
                          <select
                            value={curLevel}
                            disabled={savingSkillId === skillId}
                            onChange={(e) => handleLevelChange(skillId, e.target.value)}
                            style={{
                              width: '100%',
                              border: 'none',
                              background: 'transparent',
                              color: curC.text,
                              fontWeight: 800,
                            }}
                          >
                            {[0, 1, 2, 3, 4].map((lvl) => (
                              <option key={lvl} value={lvl} style={{ color: '#000' }}>
                                {lvl}
                              </option>
                            ))}
                          </select>
                        ) : (
                          curLevel
                        )}
                      </td>

                      <td style={{ textAlign: 'center', fontWeight: 800 }}>{gap}</td>
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

function CompletionPill({ percent, printFriendly }) {
  const p = clampPercent(percent);
  const c = getPercentColor(p, { printFriendly });
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 10px',
        borderRadius: 999,
        fontWeight: 800,
        marginLeft: 6,
        background: c.bg,
        color: c.text,
        border: '1px solid rgba(0,0,0,0.18)',
      }}
      title={`${p}% completion`}
    >
      {p}%
    </span>
  );
}
