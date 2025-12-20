import { useState } from 'react';
import './myProfile.css';

export default function MyProfile() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Dummy logged-in user (API later)
  const user = {
    name: 'Prem Pandey',
    email: 'prem@herosteels.com',
    employeeId: 'HSL1975',
    department: 'IT',
    designation: 'IT Executive',
    role: 'ADMIN',
    mobile: '98XXXXXXXX',
    joinedOn: '12 March 2021',
    status: 'Active',
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }

    // API CALL LATER
    console.log({
      oldPassword,
      newPassword,
    });

    alert('Password updated successfully (demo)');
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

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
              <span>{user.name}</span>
            </div>

            <div>
              <label>Email</label>
              <span>{user.email}</span>
            </div>

            <div>
              <label>Employee ID</label>
              <span>{user.employeeId}</span>
            </div>

            <div>
              <label>Mobile</label>
              <span>{user.mobile}</span>
            </div>
          </div>
        </div>

        {/* ORGANIZATION INFO */}
        <div className="profile-section">
          <h3>Organization Details</h3>

          <div className="profile-grid">
            <div>
              <label>Department</label>
              <span>{user.department}</span>
            </div>

            <div>
              <label>Designation</label>
              <span>{user.designation}</span>
            </div>

            <div>
              <label>Role</label>
              <span className="badge-role">{user.role}</span>
            </div>

            <div>
              <label>Status</label>
              <span className="badge-status">{user.status}</span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="profile-actions">
          <button className="secondary-btn">Edit Profile</button>
          <button
            className="primary-btn"
            onClick={() => setShowPasswordModal(true)}
          >
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
              <button
                className="secondary-btn"
                onClick={() => setShowPasswordModal(false)}
              >
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
