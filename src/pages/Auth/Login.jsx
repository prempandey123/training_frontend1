import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../utils/auth';
import './login.css';
import logo from '../../assets/hero-steels-logo.png';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

    const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed';
      setError(msg);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={logo} alt="Hero Steels" className="login-logo" />

        <h2>Learning Management System</h2>
        <p>Sign in to continue</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin}>
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
          </button>
        </form>
      </div>
    </div>
  );
}
