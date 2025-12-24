import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getDepartments, deleteDepartment } from '../../api/departmentApi';
import './department.css';

export default function DepartmentList() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI extras
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await getDepartments(); // ✅ already res.data
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert('Failed to load departments');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    try {
      await deleteDepartment(id);
      fetchDepartments();
    } catch {
      alert('Failed to delete department');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => (d?.name || '').toLowerCase().includes(q));
  }, [departments, query]);

  return (
    <div className="department-page">
      {/* TOP BAR */}
      <div className="department-topbar">
        <div>
          <h2 className="department-title">Department Master</h2>
          <p className="department-subtitle">Create, view and manage departments</p>
        </div>

        <button className="btn-primary" onClick={() => navigate('/departments/add')}>
          + Add New Department
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="department-toolbar">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search department..."
          />
        </div>

        <div className="department-meta">
          <span className="meta-chip">
            Total: <b>{departments.length}</b>
          </span>
          <span className="meta-chip">
            Showing: <b>{filtered.length}</b>
          </span>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="state-card">
          <div className="loader"></div>
          <p>Loading departments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="state-card">
          <p className="empty-title">No departments found</p>
          <p className="empty-sub">Try changing search or add a new department.</p>
          <button className="btn-outline" onClick={() => navigate('/departments/add')}>
            + Add Department
          </button>
        </div>
      ) : (
        <div className="department-grid">
          {filtered.map((dept) => (
            <div key={dept.id} className="department-card">
              <div className="dept-badge" aria-hidden="true">
                {(dept?.name || '?').trim().charAt(0).toUpperCase()}
              </div>

              <div className="dept-body">
                <div className="dept-name" title={dept.name}>
                  {dept.name}
                </div>
                <div className="dept-id">ID: {dept.id}</div>
              </div>

              <div className="dept-actions">
                <button
                  className="icon-btn danger"
                  onClick={() => handleDelete(dept.id)}
                  title="Delete department"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
