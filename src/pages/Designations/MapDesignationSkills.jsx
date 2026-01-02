import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSkills } from '../../api/skill.api';
import {
  mapSkillToDesignation,
  getSkillsByDesignation,
  removeSkillFromDesignation,
} from '../../api/designationSkill.api';
import './designation-skill.css';

export default function MapDesignationSkills() {
  const { id } = useParams(); // designationId
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [mappedSkills, setMappedSkills] = useState([]);

  const [skillId, setSkillId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = async () => {
    await Promise.all([loadSkills(), loadMappedSkills()]);
  };

  const loadSkills = async () => {
    try {
      const data = await getSkills(); // already array
      setSkills(Array.isArray(data) ? data : []);
    } catch {
      setSkills([]);
    }
  };

  const loadMappedSkills = async () => {
    try {
      const res = await getSkillsByDesignation(id);
      setMappedSkills(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMappedSkills([]);
    }
  };

  const handleAdd = async () => {
    if (!skillId) {
      alert('Please select a skill');
      return;
    }

    try {
      setLoading(true);

      await mapSkillToDesignation({
        designationId: Number(id),
        skillId: Number(skillId),
      });

      setSkillId('');
      loadMappedSkills();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          'Failed to map skill',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (mappingId) => {
    if (!window.confirm('Remove this skill from designation?')) {
      return;
    }

    try {
      await removeSkillFromDesignation(mappingId);
      loadMappedSkills();
    } catch {
      alert('Failed to remove skill');
    }
  };

  return (
    <div className="ds-page">
      {/* HEADER */}
      <div className="ds-header">
        <h2>Map Skills to Designation</h2>
        <button
          className="back-btn"
          onClick={() => navigate('/designations')}
        >
          ← Back
        </button>
      </div>

      {/* ADD SKILL */}
      <div className="ds-card">
        <h4>Add Skill</h4>

        <div className="ds-form">
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
          >
            <option value="">Select Skill</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAdd}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      {/* MAPPED SKILLS */}
      <div className="ds-card">
        <h4>Mapped Skills</h4>

        {mappedSkills.length === 0 ? (
          <p className="no-data">
            No skills mapped yet
          </p>
        ) : (
          <table className="ds-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th width="120">Action</th>
              </tr>
            </thead>

            <tbody>
              {mappedSkills.map((m) => (
                <tr key={m.id}>
                  <td>{m.skill.name}</td>

                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleRemove(m.id)}
                    >
                      Remove
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
