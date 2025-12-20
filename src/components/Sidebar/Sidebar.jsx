import { NavLink } from 'react-router-dom';
import './sidebar.css';

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h3 className="logo">Learning Management System</h3>

      <ul>
        <li>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
        </li>

        <li className="profile-link">
          <NavLink to="/my-profile">
            My Profile
          </NavLink>
        </li>

        <li>
          <NavLink to="/users">
            User Management
          </NavLink>
        </li>

        <li>
          <NavLink to="/training">
            Training
          </NavLink>
        </li>

        {/* ✅ NEW ATTENDANCE MODULE */}
        <li>
          <NavLink to="/attendance">
            Attendance
          </NavLink>
        </li>

        <li>
          <NavLink to="/skill-matrix">
            Skill Matrix
          </NavLink>
        </li>

        <li>
          <NavLink to="/reports">
            Reports
          </NavLink>
        </li>
      </ul>
    </div>
  );
}
