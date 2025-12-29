import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/api';
import './dashboard.css';

function parseTimeRangeToHours(timeRange) {
  // Supports: "10:00 - 12:00", "10:00-12:00"
  if (!timeRange || typeof timeRange !== 'string') return 0;

  const parts = timeRange.split('-').map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return 0;

  const [startStr, endStr] = parts;

  const toMinutes = (hhmm) => {
    const m = String(hhmm).match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  };

  const startMin = toMinutes(startStr);
  const endMin = toMinutes(endStr);
  if (startMin == null || endMin == null) return 0;

  const diff = endMin - startMin;
  if (diff <= 0) return 0;

  return diff / 60;
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
  const [showHours, setShowHours] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // trainings stats from backend
  const [loadingTraining, setLoadingTraining] = useState(true);
  const [totalUpcomingHours, setTotalUpcomingHours] = useState(0);
  const [monthWiseHours, setMonthWiseHours] = useState([]); // [{ month, hours }]

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

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        let upcomingTotal = 0;
        const monthMap = new Map(); // key yyyy-mm -> {monthLabel, hours}

        for (const t of list) {
          const date = t?.date; // "YYYY-MM-DD"
          const time = t?.time; // "HH:mm - HH:mm"
          if (!date) continue;

          let startDt = new Date(date);
          if (time && typeof time === 'string') {
            const startPart = time.split('-')[0]?.trim();
            const m = String(startPart || '').match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
            if (m) {
              startDt = new Date(
                `${date}T${String(m[1]).padStart(2, '0')}:${m[2]}:00`
              );
            }
          }

          const hours = parseTimeRangeToHours(time);

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
        setMonthWiseHours(sorted);
      })
      .catch((err) => {
        console.error('Failed to load trainings', err?.response?.status, err?.response?.data);
        setTotalUpcomingHours(0);
        setMonthWiseHours([]);
      })
      .finally(() => setLoadingTraining(false));
  }, []);

  const totalHoursLabel = useMemo(() => {
    if (loadingTraining) return '...';
    const val = totalUpcomingHours;
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)} hrs`;
  }, [loadingTraining, totalUpcomingHours]);

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
          <button onClick={() => setShowHours(false)} aria-label="Close">✕</button>
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
              <div
                key={`${item.month}-${index}`}
                className={`hours-row ${index === 0 ? 'current' : ''}`}
              >
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
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Overview of training, competency & skill matrix</p>
      </div>

      <div className="kpi-grid">
        <div
          className="kpi-card kpi-users clickable"
          onClick={() => navigate('/users')}
          title="Open User Master"
        >
          <h3>Total Users</h3>

          <span className="kpi-main">
            {loadingStats ? '...' : userStats.total}
          </span>

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

        <div
          className="kpi-card kpi-hours clickable"
          onClick={() => setShowHours(true)}
          title="View month-wise hours"
        >
          <h3>Total Training Hours</h3>
          <span className="kpi-main">{totalHoursLabel}</span>
          <p className="kpi-hint">
            Click to view month-wise
            {loadingTraining ? '' : ' (based on backend trainings)'}
          </p>
        </div>

        <div
          className="kpi-card kpi-skill clickable"
          onClick={() => navigate('/skill-matrix')}
          title="Open Organization Skill Matrix"
        >
          <h3>Skill Matrix (Organization)</h3>
          <span className="kpi-action">View <span aria-hidden>→</span></span>
          <p className="kpi-hint">Open skill matrix module</p>
        </div>

        <div
          className="kpi-card kpi-req clickable"
          onClick={() => navigate('/training-requirements')}
          title="Open Organization Training Requirements"
        >
          <h3>Training Requirements (Organization)</h3>
          <span className="kpi-action">View <span aria-hidden>→</span></span>
          <p className="kpi-hint">Open training requirements module</p>
        </div>

        <div
          className="kpi-card kpi-cal clickable"
          onClick={() => navigate('/calendar')}
        >
          <h3>Training Calendar</h3>
          <span className="kpi-action">View <span aria-hidden>→</span></span>
          <p className="kpi-hint">Open calendar view</p>
        </div>
      </div>

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
          <ul>
            <li>Designation <b>Senior Operator</b> added</li>
            <li>Skill Matrix updated for <b>HRS & Pickling</b></li>
            <li>Training <b>Safety Induction</b> assigned to IT</li>
            <li>User <b>Prem Pandey</b> mapped to skill matrix</li>
          </ul>
        </div>
      </div>

      {/* ✅ Portal render (Always top/center of viewport) */}
      {showHours ? createPortal(hoursModal, document.body) : null}
    </div>
  );
}
