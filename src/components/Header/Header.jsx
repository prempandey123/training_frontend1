import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './header.css';
import { getAuthUser, logout } from '../../utils/auth';
import logo from '../../assets/hero-steels-logo.png';

export default function Header() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const [user, setUser] = useState({ name: 'User', role: 'ADMIN', designation: '', department: '' });

  useEffect(() => {
    const u = getAuthUser();
    if (u?.email) {
      setUser((prev) => ({ ...prev, name: u.email, role: String(u.role || prev.role) }));
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">

      {/* LEFT : LOGO */}
      <div className="header-left">
        <img
          src={logo}
          alt="Hero Steels Logo"
          className="logo clickable"
          onClick={() => navigate('/')}
        />
      </div>

      {/* RIGHT : BACK + PROFILE */}
      <div className="header-right">

        {/* COOL BACK BUTTON */}
        <button
          className="header-back-btn"
          onClick={() => navigate(-1)}
          title="Go back"
        >
          ← Back
        </button>

        {/* PROFILE */}
        <div
          ref={wrapperRef}
          className="profile-wrapper"
          onClick={() => setOpen(!open)}
        >
          <span className="user-name">{String(user.role || 'Admin')} ▾</span>

          {open && (
            <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="profile-name">{user.name}</div>
              <div className="profile-detail">{user.designation}</div>
              <div className="profile-detail">{user.department}</div>

              <div className="profile-divider"></div>

              <button
                className="logout-btn"
                onClick={(e) => {
                  // prevent wrapper toggle interfering with click
                  e.stopPropagation();
                  setOpen(false);
                  handleLogout();
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
