import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../utils/auth';
import './login.css';
import logo from '../../assets/hero-steels-logo.png';

export default function Login() {
  const navigate = useNavigate();

  const pageRef = useRef(null);
  const cardRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // UI-only: access is still controlled by credentials/token
  const [role, setRole] = useState('ADMIN');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      setError(msg);
    }
  };

  // UI-only: subtle cursor spotlight + tilt for a premium feel
  useEffect(() => {
    const pageEl = pageRef.current;
    const cardEl = cardRef.current;
    if (!pageEl || !cardEl) return;

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    const onMove = (e) => {
      const r = pageEl.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      pageEl.style.setProperty('--mx', `${x}px`);
      pageEl.style.setProperty('--my', `${y}px`);

      const cr = cardEl.getBoundingClientRect();
      const cx = (e.clientX - cr.left) / cr.width;
      const cy = (e.clientY - cr.top) / cr.height;
      const rx = clamp((0.5 - cy) * 10, -8, 8);
      const ry = clamp((cx - 0.5) * 10, -8, 8);
      cardEl.style.setProperty('--rx', `${rx}deg`);
      cardEl.style.setProperty('--ry', `${ry}deg`);
    };

    const onLeave = () => {
      cardEl.style.setProperty('--rx', `0deg`);
      cardEl.style.setProperty('--ry', `0deg`);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    cardEl.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cardEl.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div className="login-page" ref={pageRef}>
      {/* Background decor */}
      <div className="bg-orb orb-1" aria-hidden="true" />
      <div className="bg-orb orb-2" aria-hidden="true" />
      <div className="bg-orb orb-3" aria-hidden="true" />

      <div className="login-shell">
        {/* Left hero panel */}
        <div className="login-hero" aria-hidden="true">
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />

          <div className="hero-top">
            {/* Left vala logo removed */}
            <div className="hero-brand">
              <div className="hero-brand-title">Hero Steels Limited</div>
              <div className="hero-brand-sub">Learning Management System</div>
            </div>
          </div>

          <div className="hero-copy">
            <h1>Learn. Track. Grow.</h1>
            <p>
              Smart training journeys for Admin &amp; HOD — with calendars, attendance,
              skill matrix &amp; reports.
            </p>

            <div className="hero-chips">
              <span className="chip">Training Calendar</span>
              <span className="chip">Attendance</span>
              <span className="chip">Skill Matrix</span>
              <span className="chip">Reports</span>
            </div>

            <div className="hero-illus">
              <div className="ring ring-1" />
              <div className="ring ring-2" />
              <div className="ring ring-3" />
              {/* Decorative sparkle only (removed: Upcoming / Skill Gap / Completion tiles) */}
              <div className="hero-spark" aria-hidden="true" />
            </div>
          </div>

          <div className="hero-footer">
            <span className="hero-dot" /> Secure login • JWT enabled
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-card" ref={cardRef}>
          {/* Logo top pe + bada */}
          <div className="login-top-logo">
            <img src={logo} alt="Hero Steels" className="login-logo-big" />
          </div>

          {/* Welcome back removed */}
          <div className="login-title">LOGIN TO CONTINUE</div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-row">
              <div className="form-group">
                <label>Login as</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="login-select"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="HOD">HOD</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@herosteels.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                required
              />
            </div>

            <button type="submit" className="login-btn">
              Login
              <span className="btn-shine" aria-hidden="true" />
            </button>

            <div className="login-hint">
              Tip: Select role for quick UI context — access is validated by your account.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
