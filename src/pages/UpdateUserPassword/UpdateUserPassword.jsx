import './updateUserPassword.css';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function UpdateUserPassword() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // smart search
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:3000/users');
        setUsers(res.data);
      } catch (e) {
        console.error(e);
        alert('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return users
      .filter((u) => {
        const name = (u.name || '').toLowerCase();
        const empId = (u.employeeId || '').toLowerCase();
        return name.includes(q) || empId.includes(q);
      })
      .slice(0, 8);
  }, [query, users]);

  const pickUser = (u) => {
    setSelectedUser(u);
    setQuery(`${u.name} (${u.employeeId})`);
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser) return alert('Please select a user first');
    if (!newPassword || !confirm) return alert('All fields are required');
    if (newPassword !== confirm) return alert('New password and confirm password do not match');
    if (newPassword.length < 6) return alert('Password should be at least 6 characters');

    try {
      setSubmitting(true);

      // ✅ Backend endpoint (recommended):
      // PATCH http://localhost:3000/users/:id/password
      await axios.patch(`http://localhost:3000/users/${selectedUser.id}/password`, {
        newPassword,
      });

      alert('Password updated successfully');
      setNewPassword('');
      setConfirm('');
      setSelectedUser(null);
      setQuery('');
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="update-pass-page">
      <div className="update-pass-header">
        <h2>Update User Password</h2>
        <p>Search user by Name / Employee ID and update password</p>
      </div>

      <div className="update-pass-card">
        <label className="label">Search User</label>

        <div className="smart-search">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedUser(null);
            }}
            placeholder={loadingUsers ? 'Loading users...' : 'Type name or employee id...'}
            disabled={loadingUsers}
          />

          {query && !loadingUsers && suggestions.length > 0 && !selectedUser && (
            <div className="suggestion-box">
              {suggestions.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="suggestion-item"
                  onClick={() => pickUser(u)}
                >
                  <div className="s-name">{u.name}</div>
                  <div className="s-meta">
                    {u.employeeId} • {u.department?.name || '-'} • {u.designation?.designationName || '-'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedUser && (
          <div className="selected-user">
            <div><b>Name:</b> {selectedUser.name}</div>
            <div><b>Employee ID:</b> {selectedUser.employeeId}</div>
            <div><b>Email:</b> {selectedUser.email}</div>
            <div><b>Role:</b> {selectedUser.role}</div>
          </div>
        )}

        <div className="form-row">
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <button className="primary-btn" onClick={handleUpdatePassword} disabled={submitting}>
          {submitting ? 'Updating...' : 'Update Password'}
        </button>

        <p className="hint">
          Note: Password update endpoint should be secured (Admin-only).
        </p>
      </div>
    </div>
  );
}
