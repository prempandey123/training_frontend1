import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSkill } from '../../api/skill.api';
import './skill.css';

export default function CreateSkill() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = { name: name.trim() };

    if (!payload.name) {
      setError('Skill name is required');
      return;
    }

    try {
      setLoading(true);
      await createSkill(payload);
      alert('Skill created successfully');
      navigate('/skills');
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="skill-page">
      <div className="skill-header">
        <h2>Add Skill</h2>
        <button className="back-btn" onClick={() => navigate('/skills')}>
          ← Back
        </button>
      </div>

      <form className="skill-card" onSubmit={handleSubmit}>
        <div className="form-section">
          <label>Skill Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. SAP MM"
            disabled={loading}
          />
          {error && <p className="error-text">{error}</p>}
        </div>

        <div className="form-actions">
          <button className="primary-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Skill'}
          </button>
        </div>
      </form>
    </div>
  );
}
