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

  // Bulk Upload
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');
  const [bulkErr, setBulkErr] = useState('');

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      let data = res.data || [];
      if (isHOD && deptId) {
        data = data.filter((u) => Number(u?.department?.id) === deptId);
      }
      setEmployees(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 FETCH USERS FROM BACKEND
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHOD, deptId]);

  const handleBulkUpload = async () => {
    setBulkMsg('');
    setBulkErr('');
    if (!bulkFile) {
      setBulkErr('Please select an Excel file (.xlsx)');
      return;
    }

    const name = String(bulkFile?.name || '').toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xlsm')) {
      setBulkErr('Only .xlsx/.xlsm files are supported');
      return;
    }

    try {
      setBulkUploading(true);
      const formData = new FormData();
      formData.append('file', bulkFile);

      const res = await api.post('/users/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const d = res.data || {};
      setBulkMsg(
        `Upload done. Total rows: ${d.totalRows || 0}, Created: ${d.created || 0}, Skipped: ${d.skipped || 0}, Errors: ${d.errors || 0}`,
      );
      setBulkFile(null);

      // Refresh list
      await fetchUsers();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Bulk upload failed';
      setBulkErr(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setBulkUploading(false);
    }
  };

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

      {/* BULK UPLOAD (ADMIN/HR only) */}
      {!isHOD && (
        <div className="bulk-upload-card">
          <div className="bulk-upload-left">
            <h3>Bulk Upload (Excel)</h3>
            <p>
              Upload .xlsx file with columns like: name, email, employeeId, mobile,
              password (optional), departmentId/department, designationId/designation,
              role, employeeType, dateOfJoining, isActive, biometricLinked.
            </p>
          </div>

          <div className="bulk-upload-right">
            <input
              type="file"
              accept=".xlsx,.xlsm"
              onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
            />
            <button
              className="bulk-upload-btn"
              onClick={handleBulkUpload}
              disabled={bulkUploading}
            >
              {bulkUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {bulkMsg && <p className="bulk-msg">{bulkMsg}</p>}
          {bulkErr && <p className="bulk-err">{bulkErr}</p>}
        </div>
      )}

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
