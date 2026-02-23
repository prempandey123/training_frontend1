import { NavLink, useNavigate } from 'react-router-dom';
import './sidebar.css';
import { getAuthUser, logout } from '../../utils/auth';

export default function Sidebar() {
  const navigate = useNavigate();
  const authUser = getAuthUser();

  const employeeType = String(authUser?.employeeType || '').toUpperCase();
  const role = String(authUser?.role || '').toUpperCase();

  // ✅ Admin should always see ALL matrix views (Skill + Competency, Single + Org)
  // (Some setups use SUPER_ADMIN, ADMIN_USER, etc.)
  const isAdmin = role.includes('ADMIN');
  const isHR = role.includes('HR');
  const isHOD = role === 'HOD';

  // ✅ Show matrices based on role/employeeType:
  // - ADMIN -> show both (Skill + Competency)
  // - WORKER -> only Skill Matrix
  // - STAFF  -> only Competency Matrix
  // - Anything else (HR/etc or missing) -> show both
  const isWorker = employeeType === 'WORKER';
  const isStaff = employeeType === 'STAFF';
  const showWorkerMatrix = isAdmin || isWorker || (!isWorker && !isStaff);
  const showStaffMatrix = isAdmin || isStaff || (!isWorker && !isStaff);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // helper: sidebar should not show links user can't access (Route guards will block anyway)
  const canAccess = (allow = []) => {
    if (!allow?.length) return true;
    return allow.some((r) => role === String(r).toUpperCase() || role.includes(String(r).toUpperCase()));
  };

  // 
  // ✅ Sidebar information architecture
  // - Keep it consistent with route guards in App.jsx
  // - Don't remove any existing feature, just rearrange + hide inaccessible links
  //

  const coreLinks = [
    ...(canAccess(['ADMIN', 'HR']) ? [{ to: '/', label: 'Dashboard', end: true }] : []),
    ...(canAccess(['ADMIN', 'HR']) ? [{ to: '/my-profile', label: 'My Profile' }] : []),
  ];

  const peopleOrgLinks = [
    ...(canAccess(['ADMIN', 'HR', 'HOD']) ? [{ to: '/users', label: isHOD ? 'Users (My Dept)' : 'Users' }] : []),
    ...(canAccess(['ADMIN', 'HR']) ? [{ to: '/users/update-password', label: 'Update User Password' }] : []),
    ...(canAccess(['ADMIN', 'HR']) ? [{ to: '/departments', label: 'Departments' }] : []),
    ...(canAccess(['ADMIN', 'HR', 'HOD']) ? [{ to: '/designations', label: 'Designations' }] : []),
    ...(canAccess(['ADMIN', 'HR', 'HOD']) ? [{ to: '/skills', label: 'Skills' }] : []),
  ];

  const trainingLinks = [
    // Annual should appear above Monthly (per requirement)
    ...(canAccess(['ADMIN', 'HR']) ? [{ to: '/annual-training-calendar', label: 'Annual Training Calendar' }] : []),
    ...(canAccess(['ADMIN', 'HR']) ? [{ to: '/calendar', label: 'Monthly Training Plan' }] : []),
    ...(canAccess(['ADMIN', 'HR']) ? [{ to: '/training', label: 'Trainings' }] : []),
    ...(canAccess(['ADMIN', 'HR']) ? [{ to: '/attendance', label: 'Attendance' }] : []),
    ...(canAccess(['ADMIN', 'HR']) ? [{ to: '/training-requirements', label: 'Training Requirements' }] : []),
  ];

  const matrixLinks = [
    ...(canAccess(['ADMIN', 'HR', 'HOD']) && showWorkerMatrix ? [{ to: '/skill-matrix', label: 'Skill Matrix (Individual)' }] : []),
    ...(canAccess(['ADMIN', 'HR', 'HOD']) && showStaffMatrix ? [{ to: '/competency-matrix', label: 'Competency Matrix (Individual)' }] : []),
    ...(canAccess(['ADMIN', 'HR']) && showWorkerMatrix ? [{ to: '/skill-matrix/org', label: 'Skill Matrix (Org)' }] : []),
    ...(canAccess(['ADMIN', 'HR']) && showStaffMatrix ? [{ to: '/competency-matrix/org', label: 'Competency Matrix (Org)' }] : []),
  ];

  const insightsLinks = [
    ...(canAccess(['ADMIN', 'HR']) ? [{ to: '/skill-gap', label: 'Skill Gap' }] : []),
    ...(canAccess(['ADMIN', 'HR']) ? [{ to: '/reports', label: 'Reports' }] : []),
  ];

  const systemLinks = [
    ...(canAccess(['ADMIN']) ? [{ to: '/audit-logs', label: 'Audit Logs' }] : []),
  ];

  const Section = ({ title, links }) => {
    if (!links?.length) return null;
    return (
      <div className="sidebar-section">
        <div className="sidebar-section-title">{title}</div>
        <ul className="sidebar-menu">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3 className="logo">Learning Management System</h3>
        <div className="sidebar-subtitle">Navigation</div>
      </div>

      <div className="sidebar-scroll">
        <Section title="Core" links={coreLinks} />
        <Section title="People & Org" links={peopleOrgLinks} />
        <Section title="Training" links={trainingLinks} />
        <Section title="Matrices" links={matrixLinks} />
        <Section title="Insights" links={insightsLinks} />
        <Section title="System" links={systemLinks} />
      </div>

      {/* 🔴 LOGOUT AT BOTTOM */}
      <div className="sidebar-logout" onClick={handleLogout}>
        Logout
      </div>
    </div>
  );
}
