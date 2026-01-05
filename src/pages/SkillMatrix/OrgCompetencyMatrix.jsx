import { useEffect, useMemo, useRef, useState } from 'react';
import { getOrgSkillMatrix } from '../../api/skillMatrix.api';
import { getDepartments } from '../../api/departmentApi';
import { getDesignations } from '../../api/designationApi';
import { openPrintWindow } from '../../utils/printPdf';
import { buildOrgMatrixPrintHtml } from '../../utils/orgMatrixPrint';
import { clampPercent, clampLevel, getPercentColor } from '../../utils/skillColor';
import './orgSkillMatrix.css';

/**
 * Competency Matrix (Org)
 * Same rendering as OrgSkillMatrix, but only shows STAFF employees.
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId, designationId]);

  const skills = useMemo(() => (Array.isArray(data?.skills) ? data.skills : []), [data]);
  const employees = useMemo(() => (Array.isArray(data?.employees) ? data.employees : []), [data]);

  const exportPdf = () => {
    const html = buildOrgMatrixPrintHtml({
      title: 'Competency Matrix (All)',
      filters: {
        departmentId: departmentId || undefined,
        designationId: designationId || undefined,
        q: q || undefined,
      },
      skills,
      employees,
      compact,
      printFriendly,
    });

    openPrintWindow({
      title: 'Competency Matrix (All)',
      html,
      landscape: true,
    });
  };

  const handleSearch = () => load();
  const clear = () => {
    setDepartmentId('');
    setDesignationId('');
    setQ('');
    setTimeout(load, 0);
  };

  return (
    <div className={`org-skill-matrix-page ${compact ? 'compact' : ''}`}>
      <div className="org-matrix-header">
        <h2>Competency Matrix (All)</h2>

        <div className="org-matrix-actions">
          <button
            type="button"
            className={`add-btn ${compact ? 'active' : ''}`}
            onClick={() => setCompact((v) => !v)}
            title="More compact view"
          >
            Compact
          </button>

          <button
            type="button"
            className={`add-btn ${printFriendly ? 'active' : ''}`}
            onClick={() => setPrintFriendly((v) => !v)}
            title="Softer colors + grey borders (best for printing)"
          >
            Print-friendly
          </button>

          <button type="button" className="add-btn" onClick={exportPdf}>
            Export PDF
          </button>
        </div>
      </div>

      <div className="org-matrix-filters">
        <div className="filter-row">
          <div className="filter-item">
            <label>Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="" disabled>
                Select Department
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Designation</label>
            <select value={designationId} onChange={(e) => setDesignationId(e.target.value)}>
              <option value="">All</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title || d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item" style={{ minWidth: 320 }}>
            <label>Search</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name / Emp ID / Email" />
              <button type="button" className="add-btn" onClick={handleSearch}>
                Search
              </button>
              <button type="button" className="add-btn" onClick={clear}>
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {err ? (
        <div className="card" style={{ padding: 16 }}>
          <b>Error:</b> {err}
        </div>
      ) : null}

      {!departmentId ? (
        <div className="card" style={{ padding: 16 }}>
          Please select a <b>Department</b> to load the Competency Matrix.
        </div>
      ) : loading ? (
        <div className="card" style={{ padding: 16 }}>Loading...</div>
      ) : (
        <div className="org-table-wrap" ref={tableWrapRef}>
          <table className="org-matrix-table">
            <thead>
              <tr>
                <th className="sticky-left col-emp">Employee</th>
                <th className="sticky-left-2 col-meta">Designation</th>
                <th className="sticky-left-3 col-meta">Department</th>
                {skills.map((s) => (
                  <th key={s.id} className="col-skill">
                    <div className="skill-header">{s.name}</div>
                  </th>
                ))}
                <th className="col-summary">%</th>
              </tr>
            </thead>
            <tbody>
              {employees.length ? (
                employees.map((e) => (
                  <tr key={e.userId}>
                    <td className="sticky-left col-emp">
                      <div style={{ fontWeight: 800 }}>{e.name}</div>
                      <div style={{ opacity: 0.7, fontSize: 12 }}>{e.employeeId}</div>
                    </td>
                    <td className="sticky-left-2 col-meta">{e.designation}</td>
                    <td className="sticky-left-3 col-meta">{e.department}</td>

                    {e.cells.map((c) => {
                      const tone = cellTone(c.requiredLevel, c.currentLevel);
                      const req = c.requiredLevel;
                      const cur = c.currentLevel;
                      const gap = c.gap;
                      const na = req == null || req === 0;

                      return (
                        <td key={c.skillId} className="col-skill">
                          {/* Use stacked layout so text doesn't merge into a single line like "0 R4 G4" */}
                          <div className={`cell stack ${tone} ${printFriendly ? 'print' : ''}`}>
                            {/* Keep the SAME content format as Skill Matrix, but stacked for readability */}
                            <div className="cell-main">{na ? '-' : String(clampLevel(cur))}</div>
                            <div className="cell-sub">{na ? '' : `R${clampLevel(req)}  G${clampLevel(gap)}`}</div>
                          </div>
                        </td>
                      );
                    })}

                    <td className="col-summary">
                      <span className={`pct-badge ${percentTone(e.completionPercentage)} ${printFriendly ? 'print' : ''}`}>
                        {e.completionPercentage}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={skills.length + 4} style={{ padding: 16, opacity: 0.75 }}>
                    No staff employees found.
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
