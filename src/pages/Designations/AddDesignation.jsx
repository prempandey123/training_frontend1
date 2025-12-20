import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDesignation } from '../../api/designationApi';
import { getSkills } from '../../api/skillApi';
import './designation.css';

export default function AddDesignation() {
  const navigate = useNavigate();

  const [designationName, setDesignationName] = useState('');
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await getSkills();
      setSkills(res.data);
    } catch {
      alert('Failed to load skills');
    }
  };

  const toggleSkill = (skillName) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((s) => s !== skillName)
        : [...prev, skillName],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSkills.length) {
      alert('Select at least one skill');
      return;
    }

    try {
      setLoading(true);
      await createDesignation({
        designationName,
        skills: selectedSkills,
      });
      alert('Designation added successfully');
      navigate('/designations');
    } catch {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="designation-page">
      <div className="designation-header">
        <h2>Add Designation</h2>
      </div>

      <form className="designation-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Designation Name *</label>
          <input
            value={designationName}
            onChange={(e) => setDesignationName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Select Skills *</label>

          <div className="skill-dropdown">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className={`skill-option ${
                  selectedSkills.includes(skill.name)
                    ? 'selected'
                    : ''
                }`}
                onClick={() => toggleSkill(skill.name)}
              >
                {skill.name}
              </div>
            ))}
          </div>
        </div>

        <button className="save-btn" disabled={loading}>
          {loading ? 'Saving...' : 'Save Designation'}
        </button>
      </form>
    </div>
  );
}
