import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSkills, deleteSkill } from '../../api/skill.api';
import './skill.css';

export default function SkillList() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSkills = async () => {
    try {
      const data = await getSkills();
      setSkills(data);
    } catch {
      alert('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this skill?')) return;
    await deleteSkill(id);
    loadSkills();
  };

  return (
    <div className="skill-page">
      <div className="skill-header">
        <h2>Skill Master</h2>
        <button className="primary-btn" onClick={() => navigate('/skills/add')}>
          + Add Skill
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="skill-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th width="180">Action</th>
            </tr>
          </thead>
          <tbody>
            {skills.length === 0 && (
              <tr>
                <td colSpan="3" align="center">No skills found</td>
              </tr>
            )}

            {skills.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>
                  <span className={s.isActive ? 'status active' : 'status inactive'}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button onClick={() => navigate(`/skills/edit/${s.id}`)}>
                    Edit
                  </button>
                  <button className="danger" onClick={() => handleDelete(s.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
