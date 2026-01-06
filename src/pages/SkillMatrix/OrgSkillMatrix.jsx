import { useEffect, useMemo, useRef, useState } from 'react';
import { getOrgSkillMatrix } from '../../api/skillMatrix.api';
import { getDepartments } from '../../api/departmentApi';
import { getDesignations } from '../../api/designationApi';
import { openPrintWindow } from '../../utils/printPdf';
import { buildOrgMatrixPrintHtml } from '../../utils/orgMatrixPrint';
import { clampPercent, clampLevel, getPercentColor } from '../../utils/skillColor';
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

  const tableWrapRef = useRef(null);
  const [compact, setCompact] = useState(false);
  const [printFriendly, setPrintFriendly] = useState(true);

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [q, setQ] = useState('');

  const [data, setData] = useState({ skills: [], employees: [] });

  async function boot() {
    try {
      const [deps, desigs] = await Promise.all([getDepartments(), getDesignations()]);
      setDepartments(Array.isArray(deps) ? deps : []);
      setDesignations(Array.isArray(desigs) ? desigs : []);
    } catch (e) {
      setDepartments([]);
      setDesignations([]);
      setErr(e?.response?.data?.message || e?.message || 'Failed to load filters');
    }
  }

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const res = await getOrgSkillMatrix({
        departmentId: departmentId || undefined,
        designationId: designationId || undefined,
        q: q || undefined,
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
  }, [departmentId, designationId, q]);

  const skills = useMemo(() => (Array.isArray(data?.skills) ? data.skills : []), [data]);
  const employees = useMemo(() => (Array.isArray(data?.employees) ? data.employees : []), [data]);

  const employeeCount = employees.length;
  const skillCount = skills.length;

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
      skills,
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

          {/* Optional: % Legend (agar chaho to keep) */}
          {/* <span className="legend-pill pct-red">&lt;45%</span>
          <span className="legend-pill pct-orange">45–55%</span>
          <span className="legend-pill pct-yellow">55–65%</span>
          <span className="legend-pill pct-green">65%+</span> */}
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

        <div className="filter">
          <label>Designation</label>
          <select value={designationId} onChange={(e) => setDesignationId(e.target.value)}>
            <option value="">All</option>
            {designations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.designationName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter grow">
          <label>Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name / Employee ID / Email"
          />
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
                {skills.map((s) => (
                  <th key={s.id} className="col-skill" title={s.name}>
                    <span className="skill-header">{s.name}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {employees.length ? (
                employees.map((emp) => {
                  const pct = clampPercent(emp.completionPercentage);
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
                        <div
                          className={`score-ring ${pctClass}`}
                          title={`${pct}% completion`}
                        >
                          {pct}%
                        </div>
                      </td>

                      {emp.cells.map((c) => {
                        const tone = cellTone(4, c.currentLevel);
                        const cur = clampLevel(c.currentLevel);
                        const req = 4;

                        return (
                          <td key={c.skillId} className="col-skill">
                            <div
                              className={`cell ${tone}`}
                              title={`Current ${cur} / Required ${req}`}
                            >
                              <span className="cell-main">{cur}</span>
                              <span className="cell-sep">/</span>
                              <span className="cell-sub">{req}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3 + skills.length} className="empty">
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
