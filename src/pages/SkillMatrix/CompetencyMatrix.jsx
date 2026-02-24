import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import './skillMatrix.css';
import { getUsers } from '../../api/user.api';
import { getSkillMatrixForUser, getMySkillMatrix } from '../../api/skillMatrix.api';
import { getAuthUser } from '../../utils/auth';
import { upsertMySkillLevel, upsertUserSkillLevel, upsertUserSkillLevelByEmployeeId } from '../../api/userSkillLevel.api';
import { openPrintWindow } from '../../utils/printPdf';
import { buildUserMatrixPrintHtml } from '../../utils/userMatrixPrint';
import { clampLevel, getLevelColor } from '../../utils/skillColor';
import { calcCompletionFromRows } from '../../utils/matrixMath';
import SkillLevelRating from '../../components/SkillLevelRating/SkillLevelRating';

/**
 * Competency Matrix
 * Same logic as Skill Matrix, but meant for STAFF employees.
 */
export default function CompetencyMatrix() {
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
  const [quickEmpId, setQuickEmpId] = useState('');

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
      // Competency Matrix should list STAFF employees only
      const staff = all.filter((u) => String(u?.employeeType || u?.employee_type || '').toUpperCase() === 'STAFF');

      // ✅ HOD should see ONLY own department employees
      const deptId = authUser?.departmentId;
      const scoped = isHOD && deptId ? staff.filter((u) => String(u?.departmentId || u?.department_id) === String(deptId)) : staff;

      setUsers(scoped);
    } catch (e) {
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
      const msg = e?.response?.data?.message || e?.message || 'Failed to load competency matrix';
      setError(msg);
      setMatrix(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
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

  // Decide whether a row is actually ASSIGNED/MAPPED to this employee.
  // Backend implementations vary, so we use a set of safe heuristics.
  const isAssignedRow = (r) => {
    if (!r) return false;

    const flagFalse =
      r?.isMapped === false
      || r?.mapped === false
      || r?.isAssigned === false
      || r?.assigned === false
      || r?.is_mapped === false
      || r?.is_assigned === false
      || r?.isMappedToUser === false
      || r?.mappedToUser === false;
    if (flagFalse) return false;

    const flagTrue =
      r?.isMapped === true
      || r?.mapped === true
      || r?.isAssigned === true
      || r?.assigned === true
      || r?.is_mapped === true
      || r?.is_assigned === true
      || r?.isMappedToUser === true
      || r?.mappedToUser === true;
    if (flagTrue) return true;

    const mappingId =
      r?.mappingId
      ?? r?.mapId
      ?? r?.userSkillId
      ?? r?.user_skill_id
      ?? r?.userSkillLevelId
      ?? r?.user_skill_level_id
      ?? r?.userSkillMappingId
      ?? r?.user_skill_mapping_id
      ?? r?.employeeSkillId
      ?? r?.employee_skill_id
      ?? r?.cellId
      ?? r?.cell_id;
    if (mappingId !== null && mappingId !== undefined) return true;

    const reqRaw =
      r?.requiredLevel
      ?? r?.required_level
      ?? r?.required
      ?? r?.targetLevel
      ?? r?.target_level
      ?? r?.target;
    if (reqRaw !== null && reqRaw !== undefined) {
      return Number(reqRaw) > 0;
    }

    return false;
  };


  // ✅ Only show & calculate on skills/competencies that are actually ASSIGNED/MAPPED to the user.
  // Backend may send full catalog with flags like mapped/assigned/isMapped. We hide unassigned rows.
  const mappedSkillRows = useMemo(() => {
    const rows = Array.isArray(skillRows) ? skillRows : [];

    return rows.filter((r) => {
      const sid = r?.skillId ?? r?.skill?.id ?? r?.skill_id ?? r?.id;
      if (sid === null || sid === undefined) return false;
      return isAssignedRow(r);
    });
  }, [skillRows]);

  const headerTitle = matrix?.user?.name || matrix?.user?.email || 'Competency Matrix';

  // ✅ Derived summary: count only mapped competencies (rows)
  const derivedSummary = useMemo(() => {
    const s = calcCompletionFromRows(mappedSkillRows, 4);
    return {
      totalSkills: s.totalSkills,
      totalRequiredScore: s.totalRequiredScore,
      totalCurrentScore: s.totalCurrentScore,
      completionPercentage: s.completionPercentage,
    };
  }, [skillRows]);

  const exportPdf = () => {
    const userTitle = headerTitle;
    const metaParts = [];
    if (matrix?.user?.designation) metaParts.push(matrix.user.designation);
    if (matrix?.user?.department) metaParts.push(matrix.user.department);

    const html = buildUserMatrixPrintHtml({
      title: 'Competency Matrix',
      userTitle,
      userMeta: metaParts.join(' • '),
      summary: derivedSummary,
      rows: mappedSkillRows,
      printFriendly,
    });

    openPrintWindow({
      title: 'Competency Matrix',
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
        const selectedUser = users.find((u) => String(u.id) === String(targetUserId));
        const empId = String(selectedUser?.employeeId || '').trim();
        if (empId) {
          await upsertUserSkillLevelByEmployeeId(empId, skillId, Number(nextLevel));
        } else {
          await upsertUserSkillLevel(targetUserId, skillId, Number(nextLevel));
        }
        await loadMatrix(String(targetUserId));
      } else {
        await upsertMySkillLevel(skillId, Number(nextLevel));
        await loadMatrix('');
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
        <h2>Competency Matrix</h2>
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

      <SkillLevelRating />

      <div className="matrix-filters">
        <div className="filter-item">
          <label>Employee</label>

          {canEditAll ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <input
                value={quickEmpId}
                onChange={(e) => setQuickEmpId(e.target.value)}
                placeholder="Enter Employee ID (quick select)"
                style={{ minWidth: 220 }}
              />
              <button
                type="button"
                className="add-btn"
                onClick={() => {
                  const term = String(quickEmpId || '').trim().toLowerCase();
                  if (!term) return;
                  const u = users.find((x) => String(x?.employeeId || '').trim().toLowerCase() === term);
                  if (!u) {
                    alert('Employee ID not found');
                    return;
                  }
                  setSelectedUserId(String(u.id));
                  loadMatrix(String(u.id));
                }}
              >
                Go
              </button>
            </div>
          ) : null}

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
              : 'Note: Only your own levels are editable (as per rules).'}
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
            {matrix ? (
              <div style={{ marginTop: 8, opacity: 0.9 }}>
                Skills: <b>{derivedSummary.totalSkills}</b> • Required Score: <b>{derivedSummary.totalRequiredScore}</b> •
                Current Score: <b>{derivedSummary.totalCurrentScore}</b> • Completion:{' '}
                <CompletionPill percent={derivedSummary.completionPercentage} printFriendly={printFriendly} />
              </div>
            ) : null}
          </div>

          <table className="matrix-table">
            <thead>
              <tr>
                <th>Competency</th>
                <th>Required</th>
                <th>Current</th>
                <th>Gap</th>
              </tr>
            </thead>
            <tbody>
              {mappedSkillRows.length ? (
                mappedSkillRows.map((s) => {
                  const skillId = s.skillId ?? s.skill?.id ?? s.id;
                  const skillName = s.skillName ?? s.skill?.name ?? s.name ?? 'Competency';
                  const required = 4; // 🔒 fixed required level
                  const curRaw = s.currentLevel ?? s.current_level ?? s.current;
                  const current = curRaw === null || curRaw === undefined ? null : curRaw;
                  const gap = s.gap ?? (Number(required) - Number(current));

                  const reqLevel = clampLevel(required);
                  const curLevel = current === null ? 0 : clampLevel(current);
                  const reqC = getLevelColor(reqLevel, { printFriendly: false });
                  const curC = getLevelColor(curLevel, { printFriendly: false });

                  const isMineRow = selectedUserId === '' || String(authUser?.id) === String(selectedUserId);
                  const editable = isAdmin || (canEditMine && isMineRow);

                  return (
                    <tr key={skillId}>
                      <td style={{ fontWeight: 700 }}>{skillName}</td>

                      <td style={{ background: reqC.bg, color: reqC.text, textAlign: 'center', fontWeight: 700 }}>
                        {reqLevel}
                      </td>

                      <td
                        style={{ background: curC.bg, color: curC.text, textAlign: 'center', fontWeight: 700 }}
                        title={editable ? 'Click to edit your current level' : ''}
                      >
                        {editable ? (
                          <select
                            value={current === null ? '' : curLevel}
                            disabled={savingSkillId === skillId}
                            onChange={(e) => handleLevelChange(skillId, e.target.value)}
                            style={{ width: '100%', border: 'none', background: 'transparent', color: curC.text, fontWeight: 800 }}
                          >
                            <option value="" style={{ color: '#000' }}>
                              —
                            </option>
                            {[0, 1, 2, 3, 4].map((lvl) => (
                              <option key={lvl} value={lvl} style={{ color: '#000' }}>
                                {lvl}
                              </option>
                            ))}
                          </select>
                        ) : (
                          current === null ? '' : curLevel
                        )}
                      </td>

                      <td style={{ textAlign: 'center', fontWeight: 800 }}>{gap}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} style={{ opacity: 0.7, padding: 16 }}>
                    No competencies mapped.
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
  // Reuse helper from skillColor without importing percent function (keep minimal)
  const p = Number.isFinite(Number(percent)) ? Number(percent) : 0;
  // eslint-disable-next-line no-nested-ternary
  const bg = p <= 25 ? '#d32f2f' : p <= 50 ? '#f57c00' : p <= 75 ? '#fff176' : p <= 90 ? '#81c784' : '#2e7d32';
  const text = p <= 50 ? '#ffffff' : p <= 75 ? '#000000' : p <= 90 ? '#000000' : '#ffffff';

  const style = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    background: printFriendly ? '#f4f4f4' : bg,
    color: printFriendly ? '#111' : text,
    border: printFriendly ? '1px solid #bdbdbd' : 'none',
    fontWeight: 800,
  };

  return <span style={style}>{(Number(Math.round(p)) || 0).toFixed(2)}%</span>;
}
