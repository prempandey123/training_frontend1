import { useEffect, useMemo, useRef, useState } from 'react';
import { getOrgSkillMatrix } from '../../api/skillMatrix.api';
import { getDepartments } from '../../api/departmentApi';
import { openPrintWindow } from '../../utils/printPdf';
import { buildOrgMatrixPrintHtml } from '../../utils/orgMatrixPrint';
import { clampPercent, clampLevel, getPercentColor } from '../../utils/skillColor';
import { calcCompletionFromCells } from '../../utils/matrixMath';
import SkillLevelRating from '../../components/SkillLevelRating/SkillLevelRating';
import './orgSkillMatrix.css';

/**
 * Competency Matrix (Org / Department-wise)
 * Only shows STAFF employees
 */

function cellTone(required, current) {
  const r = clampLevel(required);
  const c = clampLevel(current);
  if (r === 0) return 'tone-na';
  return `tone-${c}`;
}

function percentTone(percent) {
  const p = clampPercent(percent);
  const bucket = getPercentColor(p).bucket;
  if (bucket === 'red') return 'pct-red';
  if (bucket === 'orange') return 'pct-orange';
  if (bucket === 'yellow') return 'pct-yellow';
  if (bucket === 'lightGreen') return 'pct-lgreen';
  return 'pct-dgreen';
}

export default function OrgCompetencyMatrix() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

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
        departmentId,
        employeeType: 'STAFF',
      });
      setData(res || { skills: [], employees: [] });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to load competency matrix');
      setData({ skills: [], employees: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    boot();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!departmentId) {
      setData({ skills: [], employees: [] });
      setLoading(false);
      return;
    }

    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
  }, [departmentId]);

  const skills = useMemo(() => (Array.isArray(data?.skills) ? data.skills : []), [data]);
  const employees = useMemo(() => (Array.isArray(data?.employees) ? data.employees : []), [data]);

  // ✅ Show ONLY competencies that are present for employees in the selected department.
  const visibleSkills = useMemo(() => {
    if (!skills.length || !employees.length) return [];
    const used = new Set();
    for (const emp of employees) {
      for (const c of emp?.cells || []) {
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
      title: 'Competency Matrix (All)',
      subtitle: `${employeeCount} employees • ${skillCount} competencies`,
      skills: visibleSkills,
      employees,
      columnsPerPage: compact ? 14 : 12,
      printFriendly,
    });

    openPrintWindow({
      title: 'Competency Matrix (All)',
      html,
      landscape: true,
    });
  };

  return (
    <div className={`org-skill-matrix-page ${compact ? 'compact' : ''}`}>
      <div className="org-matrix-hero">
        <div>
          <div className="org-title">Competency Matrix</div>
          <div className="org-subtitle">
            {employeeCount} employees • {skillCount} competencies • heatmap view
          </div>
        </div>

        <div className="org-legend">
          {canScrollX && (
            <div className="org-xscroll">
              <button type="button" className="xbtn" onClick={() => scrollByX(-420)}>◀</button>
              <button type="button" className="xbtn" onClick={() => scrollByX(420)}>▶</button>
            </div>
          )}

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
        >
          Print-friendly
        </button>

        <button type="button" className="org-chip" onClick={exportPdf}>
          Export PDF
        </button>

        <button
          type="button"
          className={`org-chip ${compact ? 'active' : ''}`}
          onClick={() => setCompact((v) => !v)}
        >
          Compact
        </button>
      </div>

      <SkillLevelRating title="Competency Level Rating" />

      {/* ONLY DEPARTMENT FILTER */}
      <div className="org-filters">
        <div className="filter">
          <label>Department</label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="" disabled>Select</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {err && <div className="org-alert">⚠ {err}</div>}

      {!departmentId ? (
        <div className="org-card" style={{ padding: 16 }}>
          Please select a <b>Department</b> to load the Competency Matrix.
        </div>
      ) : loading ? (
        <div className="org-card">Loading…</div>
      ) : (
        <div className="org-card org-table-wrap" ref={tableWrapRef}>
          <table className="org-matrix-table">
            <thead>
              <tr>
                <th className="sticky-left col-emp">Employee</th>
                <th className="sticky-left-2 col-meta">Dept / Role</th>
                <th className="sticky-left-3 col-score">%</th>
                {visibleSkills.map((s) => (
                  <th key={s.id} className="col-skill">{s.name}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {employees.length ? employees.map((emp) => {
                // ✅ % must be based ONLY on mapped competencies (same logic as blank cells)
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
                      <div className={`score-ring ${pctClass}`}>{pct}%</div>
                    </td>

                    {/* ✅ Render per competency so missing mapping stays blank */}
                    {visibleSkills.map((s) => {
                      const c = (emp.cells || []).find((x) => String(x.skillId) === String(s.id));

                      // Not mapped => blank cell
                      if (!c) {
                        return (
                          <td key={s.id} className="col-skill">
                            <div className="cell cell-empty" title="Not mapped" />
                          </td>
                        );
                      }

                      // Mapped but level not set => blank
                      const raw = c.currentLevel;
                      if (raw === null || raw === undefined) {
                        return (
                          <td key={s.id} className="col-skill">
                            <div className="cell cell-empty" title="Level not set" />
                          </td>
                        );
                      }

                      const cur = clampLevel(raw);
                      const req = 4;
                      const tone = cellTone(req, cur);

                      return (
                        <td key={s.id} className="col-skill">
                          <div className={`cell ${tone}`} title={`Current ${cur} / Required ${req}`}>
                            <span className="cell-main">{cur}</span>
                            <span className="cell-sep">/</span>
                            <span className="cell-sub">{req}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={3 + visibleSkills.length} className="empty">
                    No employees found.
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
