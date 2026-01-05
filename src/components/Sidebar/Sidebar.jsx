import { NavLink, useNavigate } from 'react-router-dom';
import './sidebar.css';
import { getAuthUser } from '../../utils/auth';

export default function Sidebar() {
  const navigate = useNavigate();
  const authUser = getAuthUser();

  const employeeType = String(authUser?.employeeType || '').toUpperCase();
  const showWorkerMatrix = employeeType === 'WORKER' || !employeeType; // admins/unknown: show both
  const showStaffMatrix = employeeType === 'STAFF' || !employeeType;

  const handleLogout = () => {
    // auth clear
    localStorage.clear();
    sessionStorage.clear();

    navigate('/login');
  };

  return (
    <div className="sidebar">
      <h3 className="logo">Learning Management System</h3>

      <ul className="sidebar-menu">
        <li>
          <NavLink to="/" end>Dashboard</NavLink>
        </li>

        <li className="profile-link">
          <NavLink to="/my-profile">My Profile</NavLink>
        </li>

        <li>
          <NavLink to="/users">User Management</NavLink>
        </li>

        <li>
          <NavLink to="/users/update-password">Update User Password</NavLink>
        </li>

        <li>
          <NavLink to="/calendar">Training Calendar</NavLink>
        </li>

        <li>
          <NavLink to="/training">Training</NavLink>
        </li>

        <li>
          <NavLink to="/attendance">Attendance</NavLink>
        </li>

        {showWorkerMatrix ? (
          <li>
            <NavLink to="/skill-matrix">Skill Matrix</NavLink>
          </li>
        ) : null}
        {showWorkerMatrix ? (
          <li>
            <NavLink to="/skill-matrix/org">Skill Matrix (All)</NavLink>
          </li>
        ) : null}

        {showStaffMatrix ? (
          <li>
            <NavLink to="/competency-matrix">Competency Matrix</NavLink>
          </li>
        ) : null}

        {showStaffMatrix ? (
          <li>
            <NavLink to="/competency-matrix/org">Competency Matrix (All)</NavLink>
          </li>
        ) : null}

        <li>
          <NavLink to="/skill-gap">Skill Gap</NavLink>
        </li>

        <li>
          <NavLink to="/training-requirements">Training Requirements</NavLink>
        </li>

        <li>
          <NavLink to="/reports">Reports</NavLink>
        </li>

        <li>
          <NavLink to="/audit-logs">Audit Logs</NavLink>
        </li>
      </ul>

      {/* 🔴 LOGOUT AT BOTTOM */}
      <div className="sidebar-logout" onClick={handleLogout}>
        Logout
      </div>
    </div>
  );
}
