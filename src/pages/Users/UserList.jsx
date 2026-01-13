import './userList.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../../api/api';
import { getAuthUser } from '../../utils/auth';

export default function UserList() {
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const role = String(authUser?.role || '').toUpperCase();
  const isHOD = role === 'HOD';
  const deptId = Number(authUser?.departmentId);

  const maxScore = 20; // future use (skill matrix)

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // 🔹 FETCH USERS FROM BACKEND
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        let data = res.data || [];
        // Extra frontend safety: filter to my department for HOD
        if (isHOD && deptId) {
          data = data.filter((u) => Number(u?.department?.id) === deptId);
        }
        setEmployees(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load employees');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isHOD, deptId]);

  // 🔍 SEARCH FILTER (Name / Employee ID)
  const filteredEmployees = employees.filter((emp) => {
    const q = search.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.employeeId?.toLowerCase().includes(q)
    );
  });

  const handleAddBiometric = (userId) => {
    // FUTURE: biometric device integration
    alert(`Biometric device not connected yet (User ID: ${userId})`);
  };

  return (
    <div className="user-list-page">
      {/* HEADER */}
      <div className="user-list-header">
        <h2>Employee Master</h2>

        <div className="user-list-actions">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or employee ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {!isHOD && (
            <button
              className="create-btn"
              onClick={() => navigate('/users/create')}
            >
              + Add Employee
            </button>
          )}
        </div>
      </div>

      {/* STATES */}
      {loading && <p className="loading-text">Loading employees...</p>}
      {error && <p className="error-text">{error}</p>}

      {/* TABLE */}
      {!loading && !error && (
        <div className="table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Employee ID</th>
                <th>Mobile</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Worker/Staff</th>
                <th>Date of Joining</th>
                <th>Role</th>
                <th>Biometric</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center' }}>
                    No matching employees found
                  </td>
                </tr>
              )}

              {filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.employeeId}</td>
                  <td>{emp.mobile}</td>

                  <td>{emp.department?.name || '-'}</td>
                  <td>{emp.designation?.designationName || '-'}</td>

                  {/* WORKER / STAFF */}
                  <td>{emp.employeeType || '-'}</td>

                  {/* DATE OF JOINING */}
                  <td>{formatDate(emp.dateOfJoining)}</td>

                  {/* ROLE */}
                  <td>
                    <span className={`role ${emp.role.toLowerCase()}`}>
                      {emp.role}
                    </span>
                  </td>

                  {/* BIOMETRIC */}
                  <td>
                    {emp.biometricLinked ? (
                      <span className="biometric linked">Linked</span>
                    ) : (
                      <button
                        className="biometric-btn"
                        onClick={() => handleAddBiometric(emp.id)}
                      >
                        + Add Biometric
                      </button>
                    )}
                  </td>

                  {/* STATUS */}
                  <td>
                    <span
                      className={
                        emp.isActive
                          ? 'status active'
                          : 'status inactive'
                      }
                    >
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td>
                    <button
                      className="action-btn"
                      onClick={() =>
                        navigate(`/users/edit/${emp.id}`)
                      }
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
