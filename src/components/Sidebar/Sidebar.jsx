import { NavLink, useNavigate } from 'react-router-dom';
import './sidebar.css';
import { getAuthUser } from '../../utils/auth';

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
    // auth clear
    localStorage.clear();
    sessionStorage.clear();

    navigate('/login');
  };

  // For HOD: show only Skills & Designations (per requirement)
  const coreLinks = isHOD
    ? []
    : [
        { to: '/', label: 'Dashboard', end: true },
        { to: '/my-profile', label: 'My Profile' },
      ];

  const managementLinks = [
    ...(isAdmin || isHR
      ? [
          { to: '/users', label: 'User Management' },
          { to: '/users/update-password', label: 'Update User Password' },
          { to: '/departments', label: 'Department Management' },
        ]
      : []),
    ...(isHOD ? [{ to: '/users', label: 'Users (My Dept)' }] : []),
    ...(isAdmin || isHR || isHOD
      ? [
          { to: '/designations', label: 'Designations' },
          { to: '/skills', label: 'Skills' },
        ]
      : []),
  ];

  const trainingLinks = isHOD
    ? []
    : [
        { to: '/calendar', label: 'Training Calendar' },
        { to: '/training', label: 'Training' },
        { to: '/attendance', label: 'Attendance' },
        { to: '/training-requirements', label: 'Training Requirements' },
      ];

  const matrixLinks = isHOD
    ? []
    : [
    ...(showWorkerMatrix
      ? [
          { to: '/skill-matrix', label: 'SKILL MATRIX (SINGLE)' },
          { to: '/skill-matrix/org', label: 'SKILL MATRIX (ORG)' },
        ]
      : []),
    ...(showStaffMatrix
      ? [
          { to: '/competency-matrix', label: 'COMPETENCY MATRIX (SINGLE)' },
          { to: '/competency-matrix/org', label: 'COMPETENCY MATRIX (ORG)' },
        ]
      : []),
  ];

  const insightsLinks = isHOD
    ? []
    : [
        { to: '/skill-gap', label: 'Skill Gap' },
        { to: '/reports', label: 'Reports' },
      ];

  const systemLinks = isHOD ? [] : [{ to: '/audit-logs', label: 'Audit Logs' }];

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
        <Section title="Management" links={managementLinks} />
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
