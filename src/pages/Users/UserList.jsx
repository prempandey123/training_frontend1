import './userList.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function UserList() {
  const navigate = useNavigate();

  const maxScore = 20; // 5 skills × level 4

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
        setEmployees(res.data);
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
                <th>Role</th>
                <th>Biometric</th>
                <th>Completion</th>
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
                const percentage = getPercentage(emp.score);

                return (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.employeeId}</td>
                    <td>{emp.mobile}</td>
                    <td>{emp.department}</td>

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
                        <button className="biometric-btn">
                          Add Biometric
                        </button>
                      )}
                    </td>

                    {/* COMPLETION */}
                    <td>
                      <div className="circle-wrapper">
                        <svg width="40" height="40">
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            stroke="#e5e7eb"
                            strokeWidth="4"
                            fill="none"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="16"
                            stroke="#16a34a"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray="100"
                            strokeDashoffset={100 - percentage}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="circle-text">
                          {percentage}%
                        </span>
                      </div>
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
