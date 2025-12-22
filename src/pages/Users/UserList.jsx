import './userList.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function UserList() {
  const navigate = useNavigate();

  const maxScore = 20; // future use (skill matrix)

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getPercentage = (score = 0) =>
    Math.round((score / maxScore) * 100);

  // 🔹 FETCH USERS FROM BACKEND
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:3000/users');
        setEmployees(res.data); // 🔥 axios unwrap
      } catch (err) {
        console.error(err);
        setError('Failed to load employees');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="user-list-page">
      {/* HEADER */}
      <div className="user-list-header">
        <h2>Employee Master</h2>

        <button
          className="create-btn"
          onClick={() => navigate('/users/create')}
        >
          + Add Employee
        </button>
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
                <th>Role</th>
                <th>Biometric</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {employees.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center' }}>
                    No employees found
                  </td>
                </tr>
              )}

              {employees.map((emp) => {
                const percentage = getPercentage(emp.score || 0);

                return (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.employeeId}</td>
                    <td>{emp.mobile}</td>

                    {/* 🔥 FIX: department is object */}
                    <td>{emp.department?.name || '-'}</td>

                    {/* 🔥 FIX: designation is object */}
                    <td>{emp.designation?.designationName || '-'}</td>

                    <td>
                      <span className={`role ${emp.role.toLowerCase()}`}>
                        {emp.role}
                      </span>
                    </td>

                    {/* BIOMETRIC (safe) */}
                    <td>
                      {emp.biometricLinked ? (
                        <span className="biometric linked">Linked</span>
                      ) : (
                        <span className="biometric not-linked">Not Linked</span>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
