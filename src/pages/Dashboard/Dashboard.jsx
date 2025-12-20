import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../../api/api';
import './dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  const [showHours, setShowHours] = useState(false);

  // 🔹 User stats from backend
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  // 🔹 Dummy month-wise training hours (backend later)
  const trainingHours = [
    { month: 'September 2025', hours: 180 },
    { month: 'August 2025', hours: 220 },
    { month: 'July 2025', hours: 160 },
    { month: 'June 2025', hours: 140 },
    { month: 'May 2025', hours: 110 },
  ];

  // 🔹 Fetch user counts
  useEffect(() => {
    api
      .get('/users/stats/count')
      .then((res) => {
        setUserStats(res.data);
      })
      .catch((err) => {
        console.error('Failed to load user stats', err);
      });
  }, []);

  return (
    <div className="dashboard-page">

      {/* PAGE TITLE */}
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Overview of training, competency & skill matrix</p>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid">

        {/* TOTAL USERS → EMPLOYEE MASTER */}
        <div
          className="kpi-card clickable"
          onClick={() => navigate('/users')}
          title="Open Employee Master"
        >
          <h3>Total Users</h3>
          <span className="kpi-main">{userStats.total}</span>

          <div className="kpi-divider"></div>

          <div className="kpi-sub">
            <div className="kpi-pill active">
              Active <b>{userStats.active}</b>
            </div>

            <div className="kpi-pill inactive">
              Inactive <b>{userStats.inactive}</b>
            </div>
          </div>
        </div>

        {/* TOTAL TRAINING HOURS */}
        <div
          className="kpi-card clickable"
          onClick={() => setShowHours(true)}
        >
          <h3>Total Training Hours</h3>
          <span className="kpi-main">1,240 hrs</span>
          <p className="kpi-hint">Click to view month-wise</p>
        </div>

        {/* TRAINING CALENDAR */}
        <div
          className="kpi-card clickable"
          onClick={() => navigate('/calendar')}
        >
          <h3>Training Calendar</h3>
          <span className="kpi-main">View</span>
          <p className="kpi-hint">Open calendar view</p>
        </div>

      </div>

      {/* DEPARTMENTS */}
<div
  className="kpi-card clickable"
  onClick={() => navigate('/departments')}
>
  
  <span className="kpi-main">Departments</span>
  <p className="kpi-hint">Manage department master</p>
</div>


      {/* QUICK ACTIONS */}
      <div className="dashboard-section">
        <h3>Quick Actions</h3>

        <div className="action-grid">
          <div
            className="action-card"
            onClick={() => navigate('/users/create')}
          >
            + Create User
          </div>

          <div
            className="action-card"
            onClick={() => navigate('/designations')}
          >
            + Add Designation
          </div>

          <div
            className="action-card"
            onClick={() => navigate('/skill-matrix')}
          >
            Manage Skill Matrix
          </div>

          <div
            className="action-card"
            onClick={() => navigate('/reports')}
          >
            View Reports
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
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

      {/* TRAINING HOURS MODAL */}
      {showHours && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Training Hours (Month-wise)</h3>
              <button onClick={() => setShowHours(false)}>✕</button>
            </div>

            <div className="hours-list">
              {trainingHours.map((item, index) => (
                <div
                  key={item.month}
                  className={`hours-row ${index === 0 ? 'current' : ''}`}
                >
                  <span>{item.month}</span>
                  <b>{item.hours} hrs</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
