// ✅ DesignationList.jsx (complete) — Departments column removed (reverted)

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDesignations, deleteDesignation } from '../../api/designationApi';
import './designation.css';

export default function DesignationList() {
  const navigate = useNavigate();

  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDesignations();
  }, []);

  const loadDesignations = async () => {
    try {
      const data = await getDesignations(); // already res.data
      setDesignations(Array.isArray(data) ? data : []);
    } catch {
      alert('Failed to load designations');
      setDesignations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this designation?')) {
      return;
    }

    try {
      await deleteDesignation(id);
      alert('Designation deleted');
      loadDesignations();
    } catch {
      alert('Failed to delete designation');
    }
  };

  // ✅ mapped skills normalize helper
  const getMappedSkills = (d) => {
    // Case 1: backend returns designationSkills: [{ skill: {name} }]
    if (Array.isArray(d.designationSkills)) {
      return d.designationSkills
        .map((ds) => ds?.skill?.name || null)
        .filter(Boolean);
    }

    // Case 2: backend returns skills: [{name}]
    if (Array.isArray(d.skills)) {
      return d.skills.map((s) => s?.name).filter(Boolean);
    }

    return [];
  };

  return (
    <div className="designation-page">
      {/* HEADER */}
      <div className="designation-header">
        <h2>Designation Management</h2>

        <button className="save-btn" onClick={() => navigate('/designations/add')}>
          + Add Designation
        </button>
      </div>

      {/* TABLE */}
      <div className="designation-table-container">
        {loading ? (
          <p className="no-data">Loading designations...</p>
        ) : designations.length === 0 ? (
          <p className="no-data">No designations found</p>
        ) : (
          <table className="designation-table">
            <thead>
              <tr>
                <th>Designation Name</th>
                <th>Mapped Skills</th>
                <th width="240">Action</th>
              </tr>
            </thead>

            <tbody>
              {designations.map((d) => {
                const mappedSkills = getMappedSkills(d);

                return (
                  <tr key={d.id}>
                    <td className="designation-name">{d.designationName}</td>

                    {/* ✅ MAPPED SKILLS */}
                    <td>
                      {mappedSkills.length === 0 ? (
                        <span className="mapped-skill-placeholder">No skills</span>
                      ) : (
                        <div className="mapped-skill-wrap">
                          <div className="mapped-skill-count">{mappedSkills.length} mapped</div>

                          <div className="mapped-skill-tags">
                            {mappedSkills.slice(0, 6).map((name) => (
                              <span key={name} className="skill-tag">
                                {name}
                              </span>
                            ))}

                            {mappedSkills.length > 6 && (
                              <span className="skill-tag more-tag">
                                +{mappedSkills.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <button
                        className="map-btn"
                        onClick={() => navigate(`/designations/${d.id}/map-skills`)}
                      >
                        Map Skills
                      </button>

                      <button className="delete-btn" onClick={() => handleDelete(d.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
