import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnnualTrainingCalendar, uploadAnnualTrainingCalendar } from '../../api/annualTrainingCalendar.api';
import './annualTrainingCalendar.css';

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeekMonday(date) {
  const d = new Date(date);
  // JS: 0=Sun..6=Sat. We want Monday as start.
  const day = d.getDay();
  const diff = (day + 6) % 7; // Mon->0 ... Sun->6
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeeksForMonth(ym) {
  // Returns an array of week start dates (Monday) that intersect the month.
  // Example: 2025-04 -> [Mon of week containing Apr 1, ..., last week intersecting Apr]
  const [y, m] = ym.split('-').map((x) => Number(x));
  const monthStart = new Date(y, m - 1, 1);
  const nextMonthStart = new Date(y, m, 1);
  let cursor = startOfWeekMonday(monthStart);

  const weeks = [];
  while (cursor < nextMonthStart) {
    weeks.push(new Date(cursor));
    cursor = addDays(cursor, 7);
    // safety
    if (weeks.length > 6) break;
  }
  return weeks;
}

const EXPECTED_HEADERS = [
  'Sr. No.',
  'Training Programme Code',
  'Programme Name',
  'Mode of Session',
  'Name of Faculties',
  'Participants',
  'Department',
  "Apr'25",
  "May'25",
  "Jun'25",
  "Jul'25",
  "Aug'25",
  "Sep'25",
  "Oct'25",
  "Nov'25",
  "Dec'25",
  "Jan'26",
  "Feb'26",
  "Mar'26",
  'Total Sessions',
  'Overall Sessions',
];

function buildTemplateCsv() {
  const header = EXPECTED_HEADERS.join(',');
  const sampleRow = [
    '1',
    'T0401',
    'Preventive Maintenance & Breakdown Analysis/Techniques',
    'Classroom',
    'Mr. Vikas Kamboj',
    'Mechanical & Utilities',
    'Mechanical & Utilities',
    '1','0','0','1','0','0','0','0','0','0','0','1','3','3',
  ].join(',');
  return `${header}\n${sampleRow}\n`;
}

export default function AnnualTrainingCalendar() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [file, setFile] = useState(null);
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [importRes, setImportRes] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [hoverWeek, setHoverWeek] = useState(null);

  const months = useMemo(
    () => [
      { key: 'apr25', label: 'Apr', ym: '2025-04' },
      { key: 'may25', label: 'May', ym: '2025-05' },
      { key: 'jun25', label: 'Jun', ym: '2025-06' },
      { key: 'jul25', label: 'Jul', ym: '2025-07' },
      { key: 'aug25', label: 'Aug', ym: '2025-08' },
      { key: 'sep25', label: 'Sep', ym: '2025-09' },
      { key: 'oct25', label: 'Oct', ym: '2025-10' },
      { key: 'nov25', label: 'Nov', ym: '2025-11' },
      { key: 'dec25', label: 'Dec', ym: '2025-12' },
      { key: 'jan26', label: 'Jan', ym: '2026-01' },
      { key: 'feb26', label: 'Feb', ym: '2026-02' },
      { key: 'mar26', label: 'Mar', ym: '2026-03' },
    ],
    [],
  );

  // Build a weekly partition for each month (visual grid like the PDF).
  const monthsWithWeeks = useMemo(() => months.map((m) => ({ ...m, weeks: getWeeksForMonth(m.ym) })), [months]);

  const totalWeekCols = useMemo(
    () => monthsWithWeeks.reduce((acc, m) => acc + (m.weeks?.length || 0), 0),
    [monthsWithWeeks],
  );

  const goToAddTraining = (row, ym) => {
    const topic = (row?.programmeName || '').trim();
    const code = (row?.trainingProgrammeCode || '').trim();
    const trainer = (row?.facultyName || '').trim();
    // Prefill Add Training page: topic from programmeName; month as YYYY-MM.
    // AddTraining page will turn month into a default date (1st of month) which user can edit.
    navigate(
      `/training/add?topic=${encodeURIComponent(topic)}&month=${encodeURIComponent(ym)}&code=${encodeURIComponent(code)}&trainer=${encodeURIComponent(trainer)}`,
    );
  };

  const templateCsv = useMemo(() => buildTemplateCsv(), []);

  async function refreshList() {
    try {
      const data = await getAnnualTrainingCalendar();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    refreshList();
  }, []);

  const downloadTemplate = () => {
    const blob = new Blob([templateCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annual_training_calendar_template_${academicYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    setErr('');
    setImportRes(null);
    if (!file) {
      setErr('Please select a CSV/XLSX file.');
      return;
    }

    setLoading(true);
    try {
      const res = await uploadAnnualTrainingCalendar(file, academicYear);
      setImportRes(res);
      await refreshList();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Upload failed. Backend/API check karo.';
      setErr(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  };

  // Some layouts (or OS/browser scrollbar settings) make horizontal scrolling feel “not working”.
  // Convert vertical wheel gestures into horizontal scroll when the calendar is wider than the viewport.
  const handleWheel = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    const canScrollX = el.scrollWidth > el.clientWidth;
    if (!canScrollX) return;

    // If the user is already doing horizontal scrolling (trackpad deltaX), don't interfere.
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

    // Convert vertical wheel to horizontal movement.
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  };

  return (
    <div className="atc-page">
      <h2>Annual Training Calendar Upload</h2>

      <div className="atc-card">
        <div className="atc-help">
          <div className="atc-help-title">Upload Format (Same as PDF)</div>
          <ul>
            <li>File: <b>.csv</b> or <b>.xlsx</b></li>
            <li>Required columns: Sr No, Training Programme Code, Programme Name, Mode of Session, Name of Faculties, Participants, Department, Apr&apos;25 ... Mar&apos;26, Total Sessions, Overall Sessions</li>
            <li>Months columns me: <b>1</b> (planned) ya blank/0</li>
          </ul>
          <button className="btn" type="button" onClick={downloadTemplate}>
            Download Template CSV
          </button>
        </div>

        <div className="atc-form">
          <label className="field">
            <span>Academic Year</span>
            <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025-26" />
          </label>

          <label className="field">
            <span>Select File</span>
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <button className="btn primary" type="button" onClick={handleUpload} disabled={loading}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>

          {!!err && <div className="atc-error">{err}</div>}

          {importRes && (
            <div className="atc-result">
              <div><b>Inserted:</b> {importRes.inserted}</div>
              <div><b>Updated:</b> {importRes.updated}</div>
              <div><b>Skipped:</b> {importRes.skipped}</div>
              {importRes.errors?.length ? (
                <details>
                  <summary>Row Errors ({importRes.errors.length})</summary>
                  <pre>{JSON.stringify(importRes.errors, null, 2)}</pre>
                </details>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="atc-table-wrap">
        <h3>Uploaded Records</h3>
        <div className="atc-table-scroll" ref={scrollRef} onWheel={handleWheel}>
          <table className="atc-table">
            <thead>
              <tr>
                <th className="sticky-col sticky-1">Sr</th>
                <th className="sticky-col sticky-2">Code</th>
                <th className="sticky-col sticky-3">Programme</th>
                <th>Mode</th>
                <th>Faculty</th>
                <th>Participants</th>
                <th>Department</th>
                {monthsWithWeeks.map((m) => (
                  <th key={m.key} className="month-col" colSpan={m.weeks.length}>{m.label}</th>
                ))}
                <th>Total</th>
                <th>Overall</th>
              </tr>
              <tr>
                <th className="sticky-col sticky-1 atc-subhead" />
                <th className="sticky-col sticky-2 atc-subhead" />
                <th className="sticky-col sticky-3 atc-subhead" />
                <th className="atc-subhead" />
                <th className="atc-subhead" />
                <th className="atc-subhead" />
                <th className="atc-subhead" />
                {(() => {
                  let g = 0;
                  return monthsWithWeeks.flatMap((m) =>
                    m.weeks.map((_, idx) => {
                      const gi = g++;
                      const isHovered = hoverWeek === gi;
                      return (
                        <th
                          key={`${m.key}-w${idx + 1}`}
                          className={`week-col ${idx === 0 ? 'month-start' : ''} ${isHovered ? 'week-hover' : ''}`}
                          title={`${m.label} - Week ${idx + 1}`}
                          onMouseEnter={() => setHoverWeek(gi)}
                          onMouseLeave={() => setHoverWeek(null)}
                        >
                          W{idx + 1}
                        </th>
                      );
                    }),
                  );
                })()}
                <th className="atc-subhead" />
                <th className="atc-subhead" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="sticky-col sticky-1">{r.srNo ?? ''}</td>
                  <td className="sticky-col sticky-2">{r.trainingProgrammeCode}</td>
                  <td className="sticky-col sticky-3">{r.programmeName}</td>
                  <td>{r.modeOfSession || ''}</td>
                  <td>{r.facultyName || ''}</td>
                  <td>{r.participants || ''}</td>
                  <td>{r.department || ''}</td>
                  {(() => {
                    let g = 0;
                    return monthsWithWeeks.flatMap((m) => {
                      const planned = Math.max(0, Number(r?.[m.key] ?? 0) || 0);
                      return m.weeks.map((_, idx) => {
                        const gi = g++;
                        const isHovered = hoverWeek === gi;
                        const isPlannedCell = idx < planned;
                        return (
                          <td
                            key={`${r.id}-${m.key}-w${idx + 1}`}
                            className={`week-col ${idx === 0 ? 'month-start' : ''} ${isPlannedCell ? 'cell-clickable' : ''} ${isHovered ? 'week-hover' : ''}`}
                            onMouseEnter={() => setHoverWeek(gi)}
                            onMouseLeave={() => setHoverWeek(null)}
                          >
                            {isPlannedCell ? (
                              <button
                                type="button"
                                className="cell-btn cell-btn--tiny"
                                title={`Add Training for ${m.label} (Topic: ${r.programmeName})`}
                                onClick={() => goToAddTraining(r, m.ym)}
                              >
                                1
                              </button>
                            ) : (
                              ''
                            )}
                          </td>
                        );
                      });
                    });
                  })()}
                  <td>{r.totalSessions}</td>
                  <td>{r.overallSessions}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7 + totalWeekCols + 2} className="atc-empty">No records uploaded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
