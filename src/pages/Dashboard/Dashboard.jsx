import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/api';
import './dashboard.css';
import { formatTimeRangeIST } from '../../utils/datetime';
import { getAuthUser } from '../../utils/auth';

function parseTimeRangeToHours(timeRange) {
  // Supports (examples):
  // - "10:00 - 12:00"
  // - "10:00-12:00"
  // - "10:00 AM - 12:30 PM"
  // - "10 AM - 1 PM"
  // - "10:00 am-12:00 pm"
  if (!timeRange || typeof timeRange !== 'string') return 0;

  const parts = timeRange.split('-').map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return 0;

  const [startStr, endStr] = parts;

  const toMinutes = (raw) => {
    const s = String(raw || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();

    // 24h: HH:mm
    let m = s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (m) return Number(m[1]) * 60 + Number(m[2]);

    // 12h: H(:mm)? (AM|PM)
    m = s.match(/^(\d{1,2})(?::([0-5]\d))?\s*(AM|PM)$/);
    if (!m) return null;
    let hh = Number(m[1]);
    const mm = Number(m[2] || 0);
    const ap = m[3];
    if (hh < 1 || hh > 12) return null;
    if (ap === 'AM') {
      if (hh === 12) hh = 0;
    } else {
      if (hh !== 12) hh += 12;
    }
    return hh * 60 + mm;
  };

  const startMin = toMinutes(startStr);
  const endMin = toMinutes(endStr);
  if (startMin == null || endMin == null) return 0;

  let diff = endMin - startMin;

  // If training crosses midnight (rare), treat as next day.
  if (diff < 0) diff += 24 * 60;

  if (diff <= 0) return 0;
  return Math.round((diff / 60) * 100) / 100;
}

function getMonthLabel(dateStr) {
  // dateStr: "YYYY-MM-DD"
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function yyyymm(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'unknown';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const [showHours, setShowHours] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // ✅ Today trainings slider
  const [todayTrainings, setTodayTrainings] = useState([]);
  const [todayIdx, setTodayIdx] = useState(0);
  const [pauseTodaySlider, setPauseTodaySlider] = useState(false);

  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // trainings stats from backend
  const [loadingTraining, setLoadingTraining] = useState(true);
  const [trainings, setTrainings] = useState([]);
  const [totalUpcomingHours, setTotalUpcomingHours] = useState(0);
  const [totalYearHours, setTotalYearHours] = useState(0);
  const [monthWiseHours, setMonthWiseHours] = useState([]); // [{ month, hours }]

  // ✅ Recent activities (latest audit logs)
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);

  const loadRecentLogs = () => {
    setRecentLoading(true);
    api
      .get('/audit-logs?limit=12')
      .then((res) => {
        const items = res?.data?.items;
        setRecentLogs(Array.isArray(items) ? items : []);
      })
      .catch((err) => {
        console.error('Failed to load recent logs', err?.response?.status, err?.response?.data);
        setRecentLogs([]);
      })
      .finally(() => setRecentLoading(false));
  };

  useEffect(() => {
    loadRecentLogs();
  }, []);

  // ✅ Training graph controls
  const [graphView, setGraphView] = useState('annual'); // annual | monthly | weekly
  const [graphMonth, setGraphMonth] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  useEffect(() => {
    setLoadingStats(true);

    api
      .get('/users/stats/count')
      .then((res) => {
        const data = res?.data || {};
        setUserStats({
          total: Number(data.total || 0),
          active: Number(data.active || 0),
          inactive: Number(data.inactive || 0),
        });
      })
      .catch((err) => {
        console.error('Failed to load user stats', err?.response?.status, err?.response?.data);
        setUserStats({ total: 0, active: 0, inactive: 0 });
      })
      .finally(() => setLoadingStats(false));
  }, []);

  // Load trainings and compute total upcoming + month-wise
  useEffect(() => {
    setLoadingTraining(true);

    api
      .get('/trainings')
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : [];

        setTrainings(list);

        // ✅ Today's trainings (for dashboard slider)
        const nowLocal = new Date();
        const todayKey = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(
          nowLocal.getDate(),
        ).padStart(2, '0')}`;

        const todays = list
          .filter((t) => t?.date === todayKey)
          .map((t) => ({
            id: t?.id,
            topic: t?.topic || t?.title || 'Training',
            date: t?.date,
            time: t?.time,
            trainer: t?.trainer,
            status: t?.status,
            departments: Array.isArray(t?.departments) ? t.departments : [],
            skills: Array.isArray(t?.skills) ? t.skills : [],
          }));

        setTodayTrainings(todays);
        setTodayIdx(0);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const curYear = now.getFullYear();

        let upcomingTotal = 0;
        let yearTotal = 0;
        const monthMap = new Map(); // key yyyy-mm -> {monthLabel, hours}

        const getStartDateTime = (dateStr, timeRange) => {
          if (!dateStr) return new Date('invalid');
          const parts = String(timeRange || '')
            .split('-')
            .map((s) => s.trim())
            .filter(Boolean);
          const startRaw = parts[0] || '';

          const s = startRaw
            .trim()
            .replace(/\s+/g, ' ')
            .toUpperCase();

          // 24h HH:mm
          let m = s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
          if (m) return new Date(`${dateStr}T${String(m[1]).padStart(2, '0')}:${m[2]}:00`);

          // 12h H(:mm)? AM|PM
          m = s.match(/^(\d{1,2})(?::([0-5]\d))?\s*(AM|PM)$/);
          if (m) {
            let hh = Number(m[1]);
            const mm = Number(m[2] || 0);
            const ap = m[3];
            if (hh >= 1 && hh <= 12) {
              if (ap === 'AM') {
                if (hh === 12) hh = 0;
              } else {
                if (hh !== 12) hh += 12;
              }
              return new Date(`${dateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
            }
          }

          // fallback: midnight
          return new Date(`${dateStr}T00:00:00`);
        };

        for (const t of list) {
          const date = t?.date; // "YYYY-MM-DD"
          const time = t?.time; // "HH:mm - HH:mm"
          if (!date) continue;

          const startDt = getStartDateTime(date, time);

          const hours = parseTimeRangeToHours(time);

          // Year-wise total (current year)
          const dOnly = new Date(date);
          if (!Number.isNaN(dOnly.getTime()) && dOnly.getFullYear() === curYear) {
            yearTotal += hours;
          }

          // Month-wise: include all trainings
          const key = yyyymm(date);
          const label = getMonthLabel(date);
          const prev = monthMap.get(key) || { month: label, hours: 0 };
          monthMap.set(key, { month: label, hours: prev.hours + hours });

          // Upcoming: only future/ongoing by date-time
          if (!Number.isNaN(startDt.getTime()) && startDt >= todayStart) {
            upcomingTotal += hours;
          }
        }

        const sorted = [...monthMap.entries()]
          .sort((a, b) => (a[0] < b[0] ? 1 : -1))
          .map(([, v]) => ({
            month: v.month,
            hours: Math.round(v.hours * 10) / 10,
          }));

        setTotalUpcomingHours(Math.round(upcomingTotal * 10) / 10);
        setTotalYearHours(Math.round(yearTotal * 10) / 10);
        setMonthWiseHours(sorted);
      })
      .catch((err) => {
        console.error('Failed to load trainings', err?.response?.status, err?.response?.data);
        setTotalUpcomingHours(0);
        setTotalYearHours(0);
        setMonthWiseHours([]);
        setTodayTrainings([]);
        setTodayIdx(0);
      })
      .finally(() => setLoadingTraining(false));
  }, []);

  // ✅ Auto-play today's slider
  useEffect(() => {
    if (pauseTodaySlider) return;
    if (!Array.isArray(todayTrainings) || todayTrainings.length <= 1) return;

    const t = setInterval(() => {
      setTodayIdx((i) => (i + 1) % todayTrainings.length);
    }, 4200);

    return () => clearInterval(t);
  }, [todayTrainings, pauseTodaySlider]);

  const goPrevToday = () => {
    if (!todayTrainings.length) return;
    setTodayIdx((i) => (i - 1 + todayTrainings.length) % todayTrainings.length);
  };

  const goNextToday = () => {
    if (!todayTrainings.length) return;
    setTodayIdx((i) => (i + 1) % todayTrainings.length);
  };

  const totalHoursLabel = useMemo(() => {
    if (loadingTraining) return '...';
    // Dashboard KPI shows this year's total training hours
    const val = totalYearHours;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)} hrs`;
  }, [loadingTraining, totalYearHours]);

  const graph = useMemo(() => {
    const rows = Array.isArray(trainings) ? trainings : [];
    const now = new Date();
    const curYear = now.getFullYear();

    const add = (map, key, label, hours) => {
      const prev = map.get(key) || { label, hours: 0 };
      map.set(key, { label, hours: prev.hours + (hours || 0) });
    };

    const bars = [];

    if (graphView === 'annual') {
      const monthMap = new Map();
      for (const t of rows) {
        const date = t?.date;
        if (!date) continue;
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) continue;
        if (d.getFullYear() !== curYear) continue;
        const m = d.getMonth();
        const key = String(m);
        const label = d.toLocaleString('en-US', { month: 'short' });
        add(monthMap, key, label, parseTimeRangeToHours(t?.time));
      }
      for (let m = 0; m < 12; m++) {
        const key = String(m);
        const label = new Date(curYear, m, 1).toLocaleString('en-US', { month: 'short' });
        const v = monthMap.get(key) || { label, hours: 0 };
        bars.push({ label: v.label, value: Math.round(v.hours * 10) / 10 });
      }
      const total = Math.round(bars.reduce((s, b) => s + Number(b.value || 0), 0) * 10) / 10;
      return { title: `Annual Training Hours (${curYear})`, bars, total };
    }

    if (graphView === 'monthly') {
      // Weeks in selected month
      const [yStr, mStr] = String(graphMonth || '').split('-');
      const y = Number(yStr);
      const m0 = Number(mStr) - 1;
      if (!y || Number.isNaN(m0)) return { title: 'Monthly Training Hours', bars: [], total: 0 };

      const first = new Date(y, m0, 1);
      const last = new Date(y, m0 + 1, 0);

      // week starts on Monday
      const start = new Date(first);
      const startDay = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - startDay);

      const end = new Date(last);
      const endDay = (end.getDay() + 6) % 7;
      end.setDate(end.getDate() + (6 - endDay));

      const weekMap = new Map();
      for (const t of rows) {
        const date = t?.date;
        if (!date) continue;
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) continue;
        if (d < start || d > end) continue;

        // Find week start (Monday)
        const dd = new Date(d);
        const dow = (dd.getDay() + 6) % 7;
        dd.setDate(dd.getDate() - dow);
        dd.setHours(0, 0, 0, 0);
        const key = dd.toISOString().slice(0, 10);
        const label = `Wk ${key.slice(5)}`;
        add(weekMap, key, label, parseTimeRangeToHours(t?.time));
      }

      const weeks = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
        const key = d.toISOString().slice(0, 10);
        const label = `Wk ${key.slice(8, 10)}/${key.slice(5, 7)}`;
        const v = weekMap.get(key) || { label, hours: 0 };
        weeks.push({ label: v.label, value: Math.round(v.hours * 10) / 10 });
      }

      const total = Math.round(weeks.reduce((s, b) => s + Number(b.value || 0), 0) * 10) / 10;
      return {
        title: `Monthly (Weekly) Training Hours (${first.toLocaleString('en-US', { month: 'long' })} ${y})`,
        bars: weeks,
        total,
      };
    }

    // weekly
    const weekStart = new Date(now);
    const dow = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - dow);
    weekStart.setHours(0, 0, 0, 0);

    const dayMap = new Map();
    for (const t of rows) {
      const date = t?.date;
      if (!date) continue;
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) continue;
      const deltaDays = Math.floor((d.getTime() - weekStart.getTime()) / (24 * 3600 * 1000));
      if (deltaDays < 0 || deltaDays > 6) continue;
      const key = String(deltaDays);
      const label = d.toLocaleString('en-US', { weekday: 'short' });
      add(dayMap, key, label, parseTimeRangeToHours(t?.time));
    }

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const key = String(i);
      const label = d.toLocaleString('en-US', { weekday: 'short' });
      const v = dayMap.get(key) || { label, hours: 0 };
      days.push({ label: v.label, value: Math.round(v.hours * 10) / 10 });
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const total = Math.round(days.reduce((s, b) => s + Number(b.value || 0), 0) * 10) / 10;
    return {
      title: `Weekly Training Hours (${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()})`,
      bars: days,
      total,
    };
  }, [trainings, graphView, graphMonth, loadingTraining]);

  // ✅ Lock background scroll when modal open + ESC close
  useEffect(() => {
    if (!showHours) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowHours(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [showHours]);

  // ✅ Modal UI as Portal (so it always appears at top of screen, not inside transformed parent)
  const hoursModal = showHours ? (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // click outside closes
        if (e.target === e.currentTarget) setShowHours(false);
      }}
    >
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Training Hours (Month-wise)</h3>
          <button onClick={() => setShowHours(false)} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="hours-list">
          {loadingTraining ? (
            <div className="hours-row current">
              <span>Loading...</span>
              <b>...</b>
            </div>
          ) : monthWiseHours.length === 0 ? (
            <div className="hours-row current">
              <span>No trainings found</span>
              <b>0 hrs</b>
            </div>
          ) : (
            monthWiseHours.map((item, index) => (
              <div key={`${item.month}-${index}`} className={`hours-row ${index === 0 ? 'current' : ''}`}>
                <span>{item.month}</span>
                <b>{item.hours % 1 === 0 ? item.hours.toFixed(0) : item.hours.toFixed(1)} hrs</b>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="dashboard-page">
      {/* ❌ Removed dashboard header section as requested */}

      {/* ✅ Today Training Slider */}
      {todayTrainings.length ? (
        <div
          className="today-slider"
          onMouseEnter={() => setPauseTodaySlider(true)}
          onMouseLeave={() => setPauseTodaySlider(false)}
          role="region"
          aria-label="Today's trainings"
        >
          <div className="today-slider-top">
            <div>
              <div className="today-badge">Today</div>
              <div className="today-title">Training Schedule</div>
              <div className="today-sub">
                {todayTrainings.length} training{todayTrainings.length > 1 ? 's' : ''} today
              </div>
            </div>

            <div className="today-controls">
              <button
                type="button"
                className="today-btn"
                onClick={goPrevToday}
                aria-label="Previous training"
                title="Previous"
              >
                ◀
              </button>
              <button
                type="button"
                className="today-btn"
                onClick={goNextToday}
                aria-label="Next training"
                title="Next"
              >
                ▶
              </button>
            </div>
          </div>

          <div className="today-track">
            {todayTrainings.map((t, idx) => {
              const active = idx === todayIdx;
              return (
                <div
                  key={t.id ?? `${t.topic}-${idx}`}
                  className={`today-slide ${active ? 'active' : ''}`}
                  style={{ transform: `translateX(${(Number((idx - todayIdx) * 100) || 0).toFixed(2)}%)` }}
                >
                  <div className="today-slide-inner">
                    <div className="today-kicker">{t.status || 'PENDING'}</div>
                    <div className="today-topic">{t.topic}</div>

                    <div className="today-meta">
                      <span className="today-chip">🕒 {formatTimeRangeIST(t.time)}</span>
                      {t.trainer ? <span className="today-chip">👤 {t.trainer}</span> : null}
                    </div>

                    {t.departments.length ? (
                      <div className="today-tags">
                        {t.departments.slice(0, 4).map((d) => (
                          <span key={d} className="today-tag">
                            {d}
                          </span>
                        ))}
                        {t.departments.length > 4 ? (
                          <span className="today-tag more">+{t.departments.length - 4} more</span>
                        ) : null}
                      </div>
                    ) : null}

                    {t.skills.length ? (
                      <div className="today-skillline" title={t.skills.join(', ')}>
                        Skills: <b>{t.skills.slice(0, 3).join(', ')}</b>
                        {t.skills.length > 3 ? ` +${t.skills.length - 3} more` : ''}
                      </div>
                    ) : null}

                    <div className="today-actions">
                      <button type="button" className="today-cta" onClick={() => navigate('/calendar')}>
                        Open Calendar →
                      </button>
                      <button type="button" className="today-cta secondary" onClick={() => navigate('/training')}>
                        View Trainings
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {todayTrainings.length > 1 ? (
            <div className="today-dots" aria-label="Slider dots">
              {todayTrainings.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`dot ${i === todayIdx ? 'active' : ''}`}
                  onClick={() => setTodayIdx(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="kpi-grid">
        <div className="kpi-card kpi-users clickable" onClick={() => navigate('/users')} title="Open User Master">
          <h3>Total Users</h3>

          <span className="kpi-main">{loadingStats ? '...' : userStats.total}</span>

          <div className="kpi-divider"></div>

          <div className="kpi-sub">
            <div className="kpi-pill active">
              Active <b>{loadingStats ? '...' : userStats.active}</b>
            </div>

            <div className="kpi-pill inactive">
              Inactive <b>{loadingStats ? '...' : userStats.inactive}</b>
            </div>
          </div>
        </div>

        <div className="kpi-card kpi-hours clickable" onClick={() => setShowHours(true)} title="View month-wise hours">
          <h3>Total Training Hours</h3>
          <span className="kpi-main">{totalHoursLabel}</span>
          <p className="kpi-hint">
            Click to view month-wise
            {loadingTraining ? '' : ' (based on backend trainings)'}
          </p>
        </div>

        <div
          className="kpi-card kpi-skill clickable"
          onClick={() => navigate('/skill-matrix/org')}
          title="Open Organization Skill Matrix"
        >
          <h3>Skill Matrix (Organization)</h3>
          <span className="kpi-action">
            View <span aria-hidden>→</span>
          </span>
          <p className="kpi-hint">Open skill matrix module</p>
        </div>

        <div
          className="kpi-card kpi-comp clickable"
          onClick={() => navigate('/competency-matrix/org')}
          title="Open Organization Competency Matrix"
        >
          <h3>Competency Matrix (Organization)</h3>
          <span className="kpi-action">
            View <span aria-hidden>→</span>
          </span>
          <p className="kpi-hint">Open competency matrix module</p>
        </div>


        <div
          className="kpi-card kpi-req clickable"
          onClick={() => navigate('/training-requirements')}
          title="Open Organization Training Requirements"
        >
          <h3>Training Requirements (Organization)</h3>
          <span className="kpi-action">
            View <span aria-hidden>→</span>
          </span>
          <p className="kpi-hint">Open training requirements module</p>
        </div>

        <div className="kpi-card kpi-cal clickable" onClick={() => navigate('/calendar')}>
          <h3>Training Calendar</h3>
          <span className="kpi-action">
            View <span aria-hidden>→</span>
          </span>
          <p className="kpi-hint">Open calendar view</p>
        </div>
      </div>

      {/* ✅ Training Graph (Annual / Monthly / Weekly) */}
      <div className="dashboard-section">
        <div className="graph-head">
          <div>
            <h3>{graph.title}</h3>
            <p>Switch view to see annual, monthly (weekly breakup), or weekly (daily breakup)</p>
            {!loadingTraining ? (
              <div className="graph-total">
                Total: <b>{(graph?.total || 0) % 1 === 0 ? Number(graph?.total || 0).toFixed(0) : Number(graph?.total || 0).toFixed(1)}</b>{' '}
                hrs
              </div>
            ) : null}
          </div>

          <div className="graph-controls">
            <select value={graphView} onChange={(e) => setGraphView(e.target.value)}>
              <option value="annual">Annual</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>

            {graphView === 'monthly' ? (
              <input
                type="month"
                value={graphMonth}
                onChange={(e) => setGraphMonth(e.target.value)}
                aria-label="Select month"
              />
            ) : null}
          </div>
        </div>

        <div className="graph-card">
          {loadingTraining ? (
            <div className="graph-empty">Loading...</div>
          ) : !graph.bars?.length ? (
            <div className="graph-empty">No training data</div>
          ) : (
            <div className="bar-chart" role="img" aria-label="Training hours chart">
              {(() => {
                const max = Math.max(0.0001, ...graph.bars.map((b) => Number(b.value || 0)));
                return graph.bars.map((b, idx) => {
                  const pct = Math.max(0, Math.min(100, (Number(b.value || 0) / max) * 100));
                  return (
                    <div key={`${b.label}-${idx}`} className="bar-col" title={`${b.label}: ${b.value} hrs`}>
                      <div className="bar" style={{ height: `${(Number(pct) || 0).toFixed(2)}%` }} />
                      <div className="bar-label">{b.label}</div>
                      <div className="bar-value">{b.value}</div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {/* ✅ MOVED UP: Quick Actions */}
      <div className="dashboard-section">
        <h3>Quick Actions</h3>

        <div className="action-grid">
          <div className="action-card" onClick={() => navigate('/users')}>
            User Master
          </div>

          <div className="action-card" onClick={() => navigate('/departments')}>
            Department Master
          </div>

          <div className="action-card" onClick={() => navigate('/designations')}>
            Designation Master
          </div>

          <div className="action-card" onClick={() => navigate('/skills')}>
            Skill Master
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Recent Activity</h3>

        <div className="activity-card">
          {recentLoading ? (
            <div className="activity-empty">Loading...</div>
          ) : recentLogs.length === 0 ? (
            <div className="activity-empty">
              No recent activity yet. Once you create/edit users, skills, designations, etc. it will show here.
            </div>
          ) : (
            <ul>
              {recentLogs.map((l) => (
                <li key={l.id}>
                  <div className="activity-line">
                    <span className="activity-pill">{l.action}</span>
                    <span className="activity-text">
                      {l.actor?.name || l.actor?.email || 'System'} — {l.description || l.entity || 'Activity'}
                    </span>
                  </div>
                  <div className="activity-time">{l.createdAt ? new Date(l.createdAt).toLocaleString() : ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ✅ Portal render (Always top/center of viewport) */}
      {showHours ? createPortal(hoursModal, document.body) : null}
    </div>
  );
}
