import { useEffect, useMemo, useState } from 'react';
import { getOrgSkillMatrix } from '../../api/skillMatrix.api';
import { getDepartments } from '../../api/departmentApi';
import { getDesignations } from '../../api/designationApi';
import './orgSkillMatrix.css';

function clampLevel(n) {
  const v = Number(n ?? 0);
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(4, v));
}

function cellTone(required, current) {
  const r = clampLevel(required);
  const c = clampLevel(current);
  if (r === 0 && c === 0) return 'tone-empty';
  if (c >= r && r > 0) return 'tone-good';
  if (c === 0 && r > 0) return 'tone-bad';
  return 'tone-warn';
}

export default function OrgSkillMatrix() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

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
    } catch {
      // ignore (page can still work)
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
      });
      setData(res || { skills: [], employees: [] });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to load org skill matrix');
      setData({ skills: [], employees: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    boot();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(), 250); // small debounce
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId, designationId, q]);

  const skills = useMemo(() => (Array.isArray(data?.skills) ? data.skills : []), [data]);
  const employees = useMemo(() => (Array.isArray(data?.employees) ? data.employees : []), [data]);

  return (
    <div className="org-skill-matrix-page">
      <div className="org-matrix-hero">
        <div>
          <div className="org-title">Skill Matrix</div>
          <div className="org-subtitle">All employees • heatmap view</div>
        </div>

        <div className="org-legend">
          <span className="legend-pill tone-good">Meets</span>
          <span className="legend-pill tone-warn">Partial</span>
          <span className="legend-pill tone-bad">Gap</span>
          <span className="legend-pill tone-empty">N/A</span>
        </div>
      </div>

      <div className="org-filters">
        <div className="filter">
          <label>Department</label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">All</option>
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

      {loading ? (
        <div className="org-card">Loading…</div>
      ) : (
        <div className="org-card org-table-wrap">
          <table className="org-matrix-table">
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
                employees.map((emp) => (
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
                      <div className="score-ring" title={`${emp.completionPercentage}% completion`}>
                        {emp.completionPercentage}%
                      </div>
                    </td>

                    {emp.cells.map((c) => {
                      const tone = cellTone(c.requiredLevel, c.currentLevel);
                      return (
                        <td key={c.skillId} className="col-skill">
                          <div className={`cell ${tone}`} title={`Current ${c.currentLevel} / Required ${c.requiredLevel}`}>
                            <span className="cell-main">
                              {clampLevel(c.currentLevel)}
                            </span>
                            <span className="cell-sep">/</span>
                            <span className="cell-sub">
                              {clampLevel(c.requiredLevel)}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
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
