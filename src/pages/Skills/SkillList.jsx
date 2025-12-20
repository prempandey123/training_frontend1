import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './skill.css';

export default function SkillList() {
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🔹 FETCH SKILLS FROM BACKEND
  const fetchSkills = async () => {
    try {
      const res = await axios.get('http://localhost:3000/skills');
      setSkills(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  // 🔹 DELETE SKILL
  const deleteSkill = async (id) => {
    const confirm = window.confirm(
      'Are you sure you want to delete this skill?',
    );
    if (!confirm) return;

    try {
      await axios.delete(`http://localhost:3000/skills/${id}`);
      fetchSkills(); // refresh list
    } catch (err) {
      console.error(err);
      alert('Failed to delete skill');
    }
  };

  return (
    <div className="skill-page">

      {/* HEADER */}
      <div className="skill-header">
        <h2>Skill Master</h2>
        <button
          className="primary-btn"
          onClick={() => navigate('/skills/add')}
        >
          + Add Skill
        </button>
      </div>

      {/* STATES */}
      {loading && <p className="loading-text">Loading skills...</p>}
      {error && <p className="error-text">{error}</p>}

      {/* TABLE */}
      {!loading && !error && (
        <div className="skill-table-container">
          <table className="skill-table">
            <thead>
              <tr>
                <th>Skill Name</th>
                <th>Department</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {skills.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>
                    No skills found
                  </td>
                </tr>
              )}

              {skills.map((skill) => (
                <tr key={skill.id}>
                  <td className="skill-name">{skill.name}</td>

                  <td>
                    {skill.isCommon ? (
                      <span className="badge common">
                        All Departments
                      </span>
                    ) : (
                      <span className="badge department">
                        {skill.department || '-'}
                      </span>
                    )}
                  </td>

                  <td>
                    {skill.isCommon ? (
                      <span className="status active">Common</span>
                    ) : (
                      <span className="status inactive">
                        Department Specific
                      </span>
                    )}
                  </td>

                  <td>
                    <button
                      className="action-btn"
                      onClick={() =>
                        navigate(`/skills/edit/${skill.id}`)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteSkill(skill.id)}
                    >
                      Delete
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
