import { useEffect, useMemo, useRef, useState } from 'react';
import { getOrgSkillMatrix } from '../../api/skillMatrix.api';
import { getDepartments } from '../../api/departmentApi';
import { openPrintWindow } from '../../utils/printPdf';
import { buildOrgMatrixPrintHtml } from '../../utils/orgMatrixPrint';
import { clampPercent, clampLevel, getPercentColor } from '../../utils/skillColor';
import { calcCompletionFromCells, isAssignedCell } from '../../utils/matrixMath';
import { upsertUserSkillLevel } from '../../api/userSkillLevel.api';
import SkillLevelRating from '../../components/SkillLevelRating/SkillLevelRating';
import './orgSkillMatrix.css';

/**
 * Color code is based on CURRENT level (0..4)
 * If required is 0 => treat as N/A
 */
function cellTone(required, current) {
  const r = clampLevel(required);
  const c = clampLevel(current);

  if (r === 0) return 'tone-na'; // not applicable
  return `tone-${c}`; // tone-0..tone-4
}

/**
 * % badge color rules:
 * <45 red, 45-55 orange, 55-65 yellow, 65+ green
 */
function percentTone(percent) {
  const p = clampPercent(percent);
  const bucket = getPercentColor(p).bucket;
  if (bucket === 'red') return 'pct-red';
  if (bucket === 'orange') return 'pct-orange';
  if (bucket === 'yellow') return 'pct-yellow';
  if (bucket === 'lightGreen') return 'pct-lgreen';
  return 'pct-dgreen';
}

export default function OrgSkillMatrix() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [editing, setEditing] = useState(null); // { userId, skillId }
  const [savingKey, setSavingKey] = useState('');

  const tableWrapRef = useRef(null);
  // Requested: keep Org matrices compact by default
  const [compact, setCompact] = useState(true);
  const [printFriendly, setPrintFriendly] = useState(true);

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');

  const [data, setData] = useState({ skills: [], employees: [] });

  async function boot() {
    try {
      const deps = await getDepartments();
      setDepartments(Array.isArray(deps) ? deps : []);
    } catch (e) {
      setDepartments([]);
      setErr(e?.response?.data?.message || e?.message || 'Failed to load departments');
    }
  }

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const res = await getOrgSkillMatrix({
        departmentId: departmentId || undefined,
        employeeType: 'WORKER',
      });
      setData(res || { skills: [], employees: [] });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to load skill matrix');
      setData({ skills: [], employees: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    boot();
    // Department must be selected first
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Require department selection before loading data
    if (!departmentId) {
      setData({ skills: [], employees: [] });
      setLoading(false);
      return;
    }

    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId]);

  const skills = useMemo(() => (Array.isArray(data?.skills) ? data.skills : []), [data]);
  const employees = useMemo(() => (Array.isArray(data?.employees) ? data.employees : []), [data]);

  const updateLocalCell = (userId, skillId, newLevel) => {
    setData((prev) => {
      const next = {
        ...(prev || {}),
        skills: Array.isArray(prev?.skills) ? prev.skills : [],
        employees: Array.isArray(prev?.employees) ? prev.employees : [],
      };

      next.employees = next.employees.map((emp) => {
        if (String(emp?.id) !== String(userId)) return emp;
        const cells = Array.isArray(emp?.cells) ? emp.cells : [];
        const updated = cells.map((c) =>
          String(c?.skillId) === String(skillId) ? { ...c, currentLevel: newLevel } : c,
        );
        return { ...emp, cells: updated };
      });

      return next;
    });
  };

  const saveLevel = async (userId, skillId, level) => {
    const key = `${userId}:${skillId}`;
    setSavingKey(key);
    setErr('');
    try {
      await upsertUserSkillLevel(userId, skillId, level);
      updateLocalCell(userId, skillId, level);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to update level');
    } finally {
      setSavingKey('');
      setEditing(null);
    }
  };

  // ✅ Show ONLY those skills that actually exist for employees in the selected department.
  // If nobody has a mapping for a skill, it won't appear in the header.
  const visibleSkills = useMemo(() => {
    if (!skills.length || !employees.length) return [];
    const used = new Set();
    for (const emp of employees) {
      for (const c of emp?.cells || []) {
        if (!isAssignedCell(c)) continue;
        if (c?.skillId !== null && c?.skillId !== undefined) used.add(String(c.skillId));
      }
    }
    return skills.filter((s) => used.has(String(s.id)));
  }, [skills, employees]);

  const employeeCount = employees.length;
  const skillCount = visibleSkills.length;

  const canScrollX = skillCount > 10;
  const scrollByX = (dx) => {
    const el = tableWrapRef.current;
    if (!el) return;
    el.scrollBy({ left: dx, behavior: 'smooth' });
  };

  const exportPdf = () => {
    const html = buildOrgMatrixPrintHtml({
      title: 'Organization Skill Matrix',
      subtitle: `${employeeCount} employees • ${skillCount} skills`,
      skills: visibleSkills,
      employees,
      columnsPerPage: compact ? 14 : 12,
      printFriendly,
    });
    openPrintWindow({
      title: 'Organization Skill Matrix',
      html,
      landscape: true,
    });
  };

  return (
    <div className={`org-skill-matrix-page ${compact ? 'compact' : ''}`}>
      <div className="org-matrix-hero">
        <div>
          <div className="org-title">Skill Matrix</div>
          <div className="org-subtitle">
            {employeeCount} employees • {skillCount} skills • heatmap view
          </div>
        </div>

        <div className="org-legend">
          {canScrollX ? (
            <div className="org-xscroll">
              <button
                type="button"
                className="xbtn"
                onClick={() => scrollByX(-420)}
                aria-label="Scroll left"
                title="Scroll left"
              >
                ◀
              </button>
              <button
                type="button"
                className="xbtn"
                onClick={() => scrollByX(420)}
                aria-label="Scroll right"
                title="Scroll right"
              >
                ▶
              </button>
            </div>
          ) : null}

          {/* Legend based on CURRENT level */}
          <span className="legend-pill tone-0">0</span>
          <span className="legend-pill tone-1">1</span>
          <span className="legend-pill tone-2">2</span>
          <span className="legend-pill tone-3">3</span>
          <span className="legend-pill tone-4">4</span>
          <span className="legend-pill tone-na">N/A</span>
        </div>
      </div>

      <div className="org-actions">
        <button
          type="button"
          className={`org-chip ${printFriendly ? 'active' : ''}`}
          onClick={() => setPrintFriendly((v) => !v)}
          title="Softer colors + grey borders (best for printing)"
        >
          Print-friendly
        </button>

        <button
          type="button"
          className="org-chip"
          onClick={exportPdf}
          title="Opens print dialog — choose Save as PDF"
        >
          Export PDF
        </button>

        <button
          type="button"
          className={`org-chip ${compact ? 'active' : ''}`}
          onClick={() => setCompact((v) => !v)}
          title="More skills visible on screen"
        >
          Compact
        </button>
      </div>

      <SkillLevelRating />

      {/* ONLY DEPARTMENT FILTER */}
      <div className="org-filters">
        <div className="filter">
          <label>Department</label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="" disabled>
              Select
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {err ? <div className="org-alert">⚠ {err}</div> : null}

      {!departmentId ? (
        <div className="org-card" style={{ padding: 16 }}>
          Please select a <b>Department</b> to load the Skill Matrix.
        </div>
      ) : loading ? (
        <div className="org-card">Loading…</div>
      ) : (
        <div
          className="org-card org-table-wrap"
          ref={tableWrapRef}
          role="region"
          aria-label="Organization skill matrix"
          tabIndex={0}
        >
          <table className="org-matrix-table" aria-label="Org skill matrix table">
            <thead>
              <tr>
                <th className="sticky-left col-emp">Employee</th>
                <th className="sticky-left-2 col-meta">Dept / Role</th>
                <th className="sticky-left-3 col-score">%</th>
                {visibleSkills.map((s) => (
                  <th key={s.id} className="col-skill" title={s.name}>
                    <span className="skill-header">{s.name}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {employees.length ? (
                employees.map((emp) => {
                  // ✅ % must be based ONLY on mapped skills (same logic as blank cells)
                  const derived = calcCompletionFromCells(emp?.cells || [], 4);
                  const pct = clampPercent(derived.completionPercentage);
                  const pctClass = percentTone(pct);

                  return (
                    <tr key={emp.id}>
                      <td className="sticky-left col-emp">
                        <div className="emp-name">{emp.name}</div>
                        <div className="emp-sub">{emp.employeeId || emp.email}</div>
                      </td>

                      <td className="sticky-left-2 col-meta">
                        <div className="emp-meta">{emp.department || '—'}</div>
                        <div className="emp-sub">{emp.designation || '—'}</div>
                      </td>

                      <td className="sticky-left-3 col-score">
                        <div className={`score-ring ${pctClass}`} title={`${(Number(pct) || 0).toFixed(2)}% completion`}>
                          {(Number(pct) || 0).toFixed(2)}%
                        </div>
                      </td>

                      {/* ✅ Render per skill so missing mapping stays blank */}
                      {visibleSkills.map((s) => {
                        const c = (emp.cells || []).find((x) => String(x.skillId) === String(s.id));

                        // Not mapped/unassigned => blank cell
                        if (!c || !isAssignedCell(c)) {
                          return (
                            <td key={s.id} className="col-skill">
                              <div className="cell cell-empty" title="Not assigned">_</div>
                            </td>
                          );
                        }

                        // Mapped but level not set => blank (still counts as 0 in %)
                        const raw = c.currentLevel;
                        const isEditing =
                          editing &&
                          String(editing.userId) === String(emp.id) &&
                          String(editing.skillId) === String(s.id);

                        if (raw === null || raw === undefined) {
                          return (
                            <td key={s.id} className="col-skill">
                              {isEditing ? (
                                <select
                                  className="cell-select"
                                  autoFocus
                                  defaultValue=""
                                  onBlur={() => setEditing(null)}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === '') return;
                                    saveLevel(emp.id, s.id, Number(v));
                                  }}
                                  disabled={savingKey === `${emp.id}:${s.id}`}
                                  aria-label={`Set level for ${emp.name} - ${s.name}`}
                                >
                                  <option value="" disabled>
                                    Select
                                  </option>
                                  <option value="0">0</option>
                                  <option value="1">1</option>
                                  <option value="2">2</option>
                                  <option value="3">3</option>
                                  <option value="4">4</option>
                                </select>
                              ) : (
                                <button
                                  type="button"
                                  className="cell cell-empty org-org-cell-btn"
                                  title="Click to set level"
                                  onClick={() => setEditing({ userId: emp.id, skillId: s.id })}
                                >
                                  _
                                </button>
                              )}
                            </td>
                          );
                        }

                        const tone = cellTone(4, raw);
                        const cur = clampLevel(raw);
                        const req = 4;

                        return (
                          <td key={s.id} className="col-skill">
                            {isEditing ? (
                              <select
                                className={`cell-select ${tone}`}
                                autoFocus
                                value={String(cur)}
                                onBlur={() => setEditing(null)}
                                onChange={(e) => saveLevel(emp.id, s.id, Number(e.target.value))}
                                disabled={savingKey === `${emp.id}:${s.id}`}
                                aria-label={`Set level for ${emp.name} - ${s.name}`}
                              >
                                <option value="0">0</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                              </select>
                            ) : (
                              <button
                                type="button"
                                className={`cell ${tone} org-org-cell-btn`}
                                title="Click to change level"
                                onClick={() => setEditing({ userId: emp.id, skillId: s.id })}
                              >
                                <span className="cell-main">{cur}</span>
                                <span className="cell-sep">/</span>
                                <span className="cell-sub">{req}</span>
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3 + visibleSkills.length} className="empty">
                    No employees found for current filters.
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
