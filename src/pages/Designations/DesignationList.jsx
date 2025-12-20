import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDesignations } from '../../api/designationApi';
import './designation.css';

export default function DesignationList() {
  const navigate = useNavigate();

  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    try {
      const res = await getDesignations();
      setDesignations(res.data);
    } catch (error) {
      alert('Failed to load designations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="designation-page">
      {/* HEADER */}
      <div className="designation-header">
        <h2>Designation Master</h2>

        <button
          className="save-btn"
          onClick={() => navigate('/designations/add')}
        >
          + Add Designation
        </button>
      </div>

      {/* TABLE */}
      <div className="designation-table-container">
        {loading ? (
          <p>Loading designations...</p>
        ) : designations.length === 0 ? (
          <p>No designations found</p>
        ) : (
          <table className="designation-table">
            <thead>
              <tr>
                <th>Designation Name</th>
                <th>Skills Mapped</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {designations.map((d) => (
                <tr key={d.id}>
                  <td className="designation-name">
                    {d.designationName}
                  </td>

                  <td>
                    <div className="skill-tags">
                      {d.skills.map((skill) => (
                        <span key={skill} className="skill-tag">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td>
                    <span className="status active">
                      Active
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
