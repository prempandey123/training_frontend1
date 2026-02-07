import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../Profile/myProfile.css';
import './userProfileView.css';

import { getUserById } from '../../api/user.api';

export default function UserProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getUserById(id);
        setUser(data);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load employee profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const joinedOn = useMemo(() => {
    if (!user?.dateOfJoining) return '-';
    try {
      return new Date(user.dateOfJoining).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return user.dateOfJoining;
    }
  }, [user]);

  if (loading) return <p className="status-text">Loading profile...</p>;
  if (error) return <p className="status-text error">{error}</p>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h2>Employee Profile</h2>
        <p>
          {user?.name || '-'} {user?.employeeId ? `• ${user.employeeId}` : ''}
        </p>
      </div>

      <div className="profile-card">
        <div className="profile-section">
          <h3>Basic Details</h3>
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
              <label>Mobile</label>
              <span>{user?.mobile || '-'}</span>
            </div>
            <div>
              <label>Date of Joining</label>
              <span>{joinedOn}</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Organization</h3>
          <div className="profile-grid">
            <div>
              <label>Department</label>
              <span>{user?.department?.name || user?.department || '-'}</span>
            </div>
            <div>
              <label>Designation</label>
              <span>
                {user?.designation?.designationName ||
                  user?.designation?.name ||
                  user?.designation ||
                  '-'}
              </span>
            </div>
            <div>
              <label>Role</label>
              <span className="badge-role">{user?.role || '-'}</span>
            </div>
            <div>
              <label>Status</label>
              <span className="badge-status">{user?.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="secondary-btn" onClick={() => navigate(-1)}>
            Back
          </button>
          <button
            className="primary-btn"
            onClick={() => navigate(`/users/edit/${user?.id || id}`)}
          >
            Edit Employee
          </button>
        </div>
      </div>
    </div>
  );
}
