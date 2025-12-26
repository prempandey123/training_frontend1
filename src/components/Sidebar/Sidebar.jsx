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

        <NavLink to="/users/update-password" className="sidebar-link">
  Update User Password
</NavLink>

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
          <NavLink to="/skill-gap">
            Skill Gap
          </NavLink>
        </li>

        <li>
          <NavLink to="/training-requirements">
            Training Requirements
          </NavLink>
        </li>

        <li>
          <NavLink to="/reports">
            Reports
          </NavLink>
        </li>

        <li>
          <NavLink to="/calendar">
            Training Calendar
          </NavLink>
        </li>
      </ul>
    </div>
  );
}
