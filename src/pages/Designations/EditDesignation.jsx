import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getDesignations,
  toggleDesignationStatus,
  deleteDesignation,
} from '../../api/designationApi';
import './designation.css';

export default function DesignationList() {
  const navigate = useNavigate();
  const location = useLocation(); // 🔥 IMPORTANT

  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 REFRESH LIST WHENEVER ROUTE CHANGES
  useEffect(() => {
    fetchDesignations();
  }, [location.pathname]);

  const fetchDesignations = async () => {
    try {
      setLoading(true);
      const res = await getDesignations();
      setDesignations(res.data);
    } catch {
      alert('Failed to load designations');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id) => {
    await toggleDesignationStatus(id);
    fetchDesignations(); // immediate refresh
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this designation?')) {
      return;
    }
    await deleteDesignation(id);
    fetchDesignations(); // immediate refresh
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="designation-page">
      <div className="designation-header">
        <h2>Designation Master</h2>
        <button
          className="save-btn"
          onClick={() => navigate('/designations/add')}
        >
          + Add Designation
        </button>
      </div>

      <div className="designation-table-container">
        <table className="designation-table">
          <thead>
            <tr>
              <th>Designation</th>
              <th>Skills</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {designations.map((d) => (
              <tr key={d.id}>
                <td>{d.designationName}</td>

                <td>
                  <div className="skill-tags">
                    {d.skills?.map((skill) => (
                      <span key={skill} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </td>

                <td>
                  <span
                    className={`status ${d.isActive ? 'active' : 'inactive'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleStatus(d.id)}
                  >
                    {d.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>

                <td>
                  <button
                    className="action-btn"
                    onClick={() =>
                      navigate(`/designations/edit/${d.id}`)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="action-btn danger"
                    onClick={() => handleDelete(d.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
