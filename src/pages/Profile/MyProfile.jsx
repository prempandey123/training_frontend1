import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './myProfile.css';

import { getAuthUser, logout } from '../../utils/auth';
import { getUserById } from '../../api/user.api';

export default function MyProfile() {
  const navigate = useNavigate();

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const authUser = useMemo(() => getAuthUser(), []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr('');

        if (!authUser?.id || Number.isNaN(Number(authUser.id))) {
          // token/user missing -> login
          logout();
          navigate('/login', { replace: true });
          return;
        }

        const data = await getUserById(authUser.id);

        // backend returns eager relations: department, designation
        setUser(data);
      } catch (e) {
        console.error(e);
        setErr(e?.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authUser?.id, navigate]);

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }

    /**
     * NOTE:
     * Tumhare current backend me change-password endpoint exist nahi hai.
     * Isliye abhi demo ke liye ye wahi रहेगा.
     * Agar chaho to main backend me /auth/change-password ya /users/:id/password add karke
     * frontend me API call bhi wire kar dunga.
     */
    console.log({ oldPassword, newPassword });

    alert('Password updated successfully (demo)');
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const joinedOn =
    user?.dateOfJoining
      ? new Date(user.dateOfJoining).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : '-';

  const statusText = user?.isActive ? 'Active' : 'Inactive';

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <h2>My Profile</h2>
          <p>Loading your details...</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <h2>My Profile</h2>
          <p style={{ color: 'crimson' }}>{err}</p>
        </div>

        <div className="profile-card">
          <div className="profile-actions">
            <button className="primary-btn" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* HEADER */}
      <div className="profile-header">
        <h2>My Profile</h2>
        <p>View your personal & organizational details</p>
      </div>

      {/* PROFILE CARD */}
      <div className="profile-card">
        {/* BASIC INFO */}
        <div className="profile-section">
          <h3>Basic Information</h3>

          <div className="profile-grid">
            <div>
              <label>Name</label>
              <span>{user?.name || '-'}</span>
            </div>

            <div>
              <label>Email</label>
              <span>{user?.email || '-'}</span>
            </div>

            <div>
              <label>Employee ID</label>
              <span>{user?.employeeId || '-'}</span>
            </div>

            <div>
              <label>Mobile</label>
              <span>{user?.mobile || '-'}</span>
            </div>
          </div>
        </div>

        {/* ORGANIZATION INFO */}
        <div className="profile-section">
          <h3>Organization Details</h3>

          <div className="profile-grid">
            <div>
              <label>Department</label>
              <span>{user?.department?.name || '-'}</span>
            </div>

            <div>
              <label>Designation</label>
              <span>{user?.designation?.designationName || '-'}</span>
            </div>

            <div>
              <label>Role</label>
              <span className="badge-role">{user?.role || '-'}</span>
            </div>

            <div>
              <label>Status</label>
              <span className="badge-status">{statusText}</span>
            </div>

            <div>
              <label>Joined On</label>
              <span>{joinedOn}</span>
            </div>

            <div>
              <label>Biometric Linked</label>
              <span>{user?.biometricLinked ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="profile-actions">
          <button
            className="secondary-btn"
            onClick={() => navigate(`/users/edit/${authUser?.id}`)}
          >
            Edit Profile
          </button>
          <button className="primary-btn" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </button>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Old Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={handleChangePassword}>
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
