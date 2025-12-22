import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDesignation } from '../../api/designationApi';
import { getDepartments } from '../../api/departmentApi';
import './designation.css';

export default function AddDesignation() {
  const navigate = useNavigate();

  const [designationName, setDesignationName] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const data = await getDepartments(); // already array
      setDepartments(Array.isArray(data) ? data : []);
    } catch {
      alert('Failed to load departments');
      setDepartments([]);
    }
  };

  const toggleDepartment = (deptId) => {
    setSelectedDepartmentIds((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!designationName.trim()) {
      alert('Designation name is required');
      return;
    }

    if (selectedDepartmentIds.length === 0) {
      alert('Select at least one department');
      return;
    }

    try {
      setLoading(true);

      await createDesignation({
        designationName: designationName.trim(),
        departmentIds: selectedDepartmentIds, // 🔥 EXACT DTO MATCH
      });

      alert('Designation added successfully');
      navigate('/designations');
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          'Failed to create designation'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="designation-page">
      {/* HEADER */}
      <div className="designation-header">
        <h2>Add Designation</h2>
        <button
          className="back-btn"
          onClick={() => navigate('/designations')}
        >
          ← Back
        </button>
      </div>

      {/* FORM */}
      <form className="designation-form" onSubmit={handleSubmit}>
        {/* DESIGNATION NAME */}
        <div className="form-group">
          <label>Designation Name *</label>
          <input
            value={designationName}
            onChange={(e) => setDesignationName(e.target.value)}
            placeholder="e.g. Senior Operator"
            required
          />
        </div>

        {/* DEPARTMENTS */}
        <div className="form-group">
          <label>Applicable Departments *</label>

          <div className="department-selector">
            {departments.length === 0 ? (
              <p className="no-data">No departments available</p>
            ) : (
              departments.map((dept) => (
                <div
                  key={dept.id}
                  className={`department-option ${
                    selectedDepartmentIds.includes(dept.id)
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() => toggleDepartment(dept.id)}
                >
                  {dept.name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ACTION */}
        <button className="save-btn" disabled={loading}>
          {loading ? 'Saving...' : 'Save Designation'}
        </button>
      </form>
    </div>
  );
}
