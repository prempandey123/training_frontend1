import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  getDepartments,
  deleteDepartment,
} from '../../api/departmentApi';
import './department.css';

export default function DepartmentList() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      await deleteDepartment(id);
      fetchDepartments();
    } catch {
      alert('Failed to delete department');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="department-page">
      {/* HEADER */}
      <div className="department-header">
        <h2>Department Master</h2>

        <button
          className="save-btn"
          onClick={() => navigate('/departments/add')}
        >
          + Add New Department
        </button>
      </div>

      {/* LIST */}
      {departments.length === 0 ? (
        <p>No departments found</p>
      ) : (
        <div className="department-list">
          {departments.map((dept) => (
            <div key={dept.id} className="department-card">
              <span>{dept.name}</span>

              <button
                className="delete-btn"
                onClick={() => handleDelete(dept.id)}
                title="Delete department"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
