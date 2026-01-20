import { useEffect, useMemo, useState } from 'react';
import api from '../../api/api';
import { getAuthUser } from '../../utils/auth';
import './reports.css';

function buildUrl(template, params) {
  let url = template || '';

  // Replace path params
  if (params?.userId) url = url.replace(':userId', String(params.userId));
  if (params?.departmentId) url = url.replace(':departmentId', String(params.departmentId));

  const [path, rawQuery] = url.split('?');
  const qs = new URLSearchParams(rawQuery || '');

  // Optional filters used by some existing reports
  if (path.startsWith('/reports/training-completion/excel')) {
    const did = params?.departmentId;
    if (did && !qs.has('departmentId')) qs.set('departmentId', String(did));
  }
  if (path.startsWith('/reports/tni-requirements/excel')) {
    const did = params?.departmentId;
    if (did && !qs.has('departmentId')) qs.set('departmentId', String(did));
  }

  // Custom report params (Annexure / master record exports)
  if (params?.year && !qs.has('year')) qs.set('year', String(params.year));
  if (params?.upto && !qs.has('upto')) qs.set('upto', String(params.upto));
  if (params?.fy && !qs.has('fy')) qs.set('fy', String(params.fy));
  if (params?.start && !qs.has('start')) qs.set('start', String(params.start));
  if (params?.end && !qs.has('end')) qs.set('end', String(params.end));

  const queryOut = qs.toString();
  return `${path}${queryOut ? `?${queryOut}` : ''}`;
}

export default function Reports() {
  const authUser = getAuthUser();
  const userId = authUser?.id;

  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Custom report params
  const [year, setYear] = useState('2025');
  const [upto, setUpto] = useState('');
  const [fy, setFy] = useState('2025-2026');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [summaryCards, setSummaryCards] = useState([]);
  const [reportRows, setReportRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const deptIdNumber = useMemo(() => {
    const n = Number(selectedDeptId);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [selectedDeptId]);

  const reportTypes = useMemo(() => {
    const set = new Set(reportRows.map((r) => r.type).filter(Boolean));
    return Array.from(set);
  }, [reportRows]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError('');
        const res = await api.get('/departments');
        if (!mounted) return;
        setDepartments(res.data || []);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');

        const qs = new URLSearchParams();
        if (deptIdNumber) qs.set('departmentId', String(deptIdNumber));
        if (selectedType) qs.set('type', selectedType);

        const [catalogRes, summaryRes] = await Promise.all([
          api.get(`/reports/catalog${qs.toString() ? `?${qs.toString()}` : ''}`),
          api.get(`/reports/summary${deptIdNumber ? `?departmentId=${deptIdNumber}` : ''}`),
        ]);

        if (!mounted) return;

        setReportRows(catalogRes.data?.reports || []);
        setSummaryCards(summaryRes.data?.cards || []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || 'Failed to load reports');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [deptIdNumber, selectedType]);

  const filteredRows = useMemo(() => {
    if (!selectedType) return reportRows;
    return reportRows.filter((r) => String(r.type).toLowerCase() === String(selectedType).toLowerCase());
  }, [reportRows, selectedType]);

  const handleExport = (report) => {
    const exp = report?.exports?.[0];
    if (!exp) return;

    // Validate required params
    const needs = exp.needs || [];
    if (needs.includes('userId') && !userId) {
      alert('UserId not found. Please login again.');
      return;
    }
    if (needs.includes('departmentId') && !deptIdNumber) {
      alert('Please select a department to export this report.');
      return;
    }

    // Custom param validations
    if (needs.includes('year') && !year) {
      alert('Please select a year.');
      return;
    }
    if (needs.includes('fy') && !fy) {
      alert('Please select a financial year (FY).');
      return;
    }
    if (needs.includes('start') && !startDate) {
      alert('Please select a start date.');
      return;
    }
    if (needs.includes('end') && !endDate) {
      alert('Please select an end date.');
      return;
    }

    const url = buildUrl(exp.url, {
      userId,
      departmentId: deptIdNumber,
      year,
      upto,
      fy,
      start: startDate,
      end: endDate,
    });

    // Use API base URL so file downloads work even if axios baseURL is different
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.open(`${base}${url}`, '_blank');
  };

  return (
    <div className="reports-page">

      {/* HEADER */}
      <div className="reports-header">
        <div>
          <h2>Reports</h2>
          <p>Training, competency & skill analytics</p>
        </div>

        <div className="report-filters">
          <select value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="">All Report Types</option>
            {reportTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Custom report params (used only by some exports) */}
          <input
            className="report-input"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Year (e.g. 2025)"
            title="Year (used for Annexure exports)"
          />

          <input
            className="report-input"
            value={upto}
            onChange={(e) => setUpto(e.target.value)}
            placeholder="Upto (YYYY-MM-DD)"
            title="Upto date (optional)"
          />

          <input
            className="report-input"
            value={fy}
            onChange={(e) => setFy(e.target.value)}
            placeholder="FY (e.g. 2025-2026)"
            title="Financial year (used for master record export)"
          />

          <input
            className="report-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start (YYYY-MM-DD)"
            title="Start date (optional override)"
          />

          <input
            className="report-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End (YYYY-MM-DD)"
            title="End date (optional override)"
          />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="report-summary-grid">
        {(loading ? [{ title: 'Loading...', value: '...' }] : summaryCards).map((item) => (
          <div key={item.title} className="summary-card">
            <h4>{item.title}</h4>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {error ? <div style={{ margin: '10px 0', color: '#ff4d4d' }}>{error}</div> : null}

      {/* REPORT LIST */}
      <div className="report-list-container">
        <table className="report-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Description</th>
              <th>Category</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((report) => (
              <tr key={report.id}>
                <td className="report-name">{report.name}</td>
                <td>{report.description}</td>
                <td>
                  <span className="report-tag">{report.type}</span>
                </td>
                <td>
                  <button className="action-btn" onClick={() => handleExport(report)}>
                    View
                  </button>
                  <button className="export-btn" onClick={() => handleExport(report)}>
                    Export
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
