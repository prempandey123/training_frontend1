import { useEffect, useState } from 'react';
import api from '../../api/api';
// Reuse existing audit styles from dashboard
import '../Dashboard/dashboard.css';

export default function AuditLogs() {
  const [logsLoading, setLogsLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [logUserFilter, setLogUserFilter] = useState('');
  const [logDeptFilter, setLogDeptFilter] = useState('');

  const loadAuditLogs = () => {
    setLogsLoading(true);
    const qs = new URLSearchParams();
    qs.set('limit', '50');
    if (logUserFilter) qs.set('userId', logUserFilter);
    if (logDeptFilter) qs.set('departmentId', logDeptFilter);

    api
      .get(`/audit-logs?${qs.toString()}`)
      .then((res) => {
        const items = res?.data?.items;
        setAuditLogs(Array.isArray(items) ? items : []);
      })
      .catch((err) => {
        console.error('Failed to load audit logs', err?.response?.status, err?.response?.data);
        setAuditLogs([]);
      })
      .finally(() => setLogsLoading(false));
  };

  useEffect(() => {
    loadAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logUserFilter, logDeptFilter]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-section">
        <h3>Audit Logs</h3>
        <p style={{ marginTop: 6, color: '#6b7280', fontWeight: 700 }}>
          Who did what, when (filter by user / department)
        </p>

        <div className="audit-card" style={{ marginTop: 12 }}>
          <div className="audit-header">
            <div>
              <h3>Audit Logs</h3>
              <p>Latest activities across users, skills, designations, trainings, etc.</p>
            </div>

            <div className="audit-actions">
              <button
                className="audit-btn"
                onClick={() => {
                  api
                    .post('/audit-logs/generate-sample?count=20')
                    .then(() => loadAuditLogs())
                    .catch((err) => {
                      console.error('Failed to generate sample logs', err?.response?.status, err?.response?.data);
                    });
                }}
                title="Generate 20 sample logs"
              >
                Generate Sample Logs
              </button>

              <button className="audit-btn secondary" onClick={loadAuditLogs} title="Refresh logs">
                Refresh
              </button>
            </div>
          </div>

          <div className="audit-filters">
            <div className="audit-filter">
              <label>User</label>
              <select value={logUserFilter} onChange={(e) => setLogUserFilter(e.target.value)}>
                <option value="">All</option>
                {[
                  ...new Map(
                    auditLogs.filter((l) => l?.actor?.id).map((l) => [l.actor.id, l.actor]),
                  ).values(),
                ].map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.name} (#{u.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="audit-filter">
              <label>Department</label>
              <select value={logDeptFilter} onChange={(e) => setLogDeptFilter(e.target.value)}>
                <option value="">All</option>
                {[
                  ...new Map(
                    auditLogs.filter((l) => l?.department?.id).map((l) => [l.department.id, l.department]),
                  ).values(),
                ].map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Department</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {logsLoading ? (
                  <tr>
                    <td colSpan={6} className="audit-empty">
                      Loading...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="audit-empty">
                      No logs found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((l) => (
                    <tr key={l.id}>
                      <td>{l.createdAt ? new Date(l.createdAt).toLocaleString() : '-'}</td>
                      <td>{l.actor?.name || l.actor?.email || 'System'}</td>
                      <td>{l.department?.name || '-'}</td>
                      <td>
                        <span className="audit-pill">{l.action}</span>
                      </td>
                      <td>{l.entity || '-'}</td>
                      <td className="audit-desc">{l.description || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
