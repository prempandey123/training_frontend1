import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './header.css';
import { getAuthUser, logout } from '../../utils/auth';
import logo from '../../assets/hero-steels-logo.png';

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

    const [user, setUser] = useState({ name: 'User', designation: '', department: '' });

  useEffect(() => {
    const u = getAuthUser();
    if (u?.email) {
      setUser((prev) => ({ ...prev, name: u.email }));
    }
  }, []);


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
          className="profile-wrapper"
          onClick={() => setOpen(!open)}
        >
          <span className="user-name">Admin ▾</span>

          {open && (
            <div className="profile-dropdown">
              <div className="profile-name">{user.name}</div>
              <div className="profile-detail">{user.designation}</div>
              <div className="profile-detail">{user.department}</div>

              <div className="profile-divider"></div>

              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
