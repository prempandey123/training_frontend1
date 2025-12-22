import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './skill.css';

export default function EditSkill() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`http://localhost:3000/skills/${id}`)
      .then(res => setName(res.data.name))
      .catch(() => alert('Skill not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Skill name is required');
      return;
    }

    try {
      await axios.put(`http://localhost:3000/skills/${id}`, {
        name: name.trim(), // 🔥 ONLY allowed field
      });
      alert('Skill updated');
      navigate('/skills');
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="skill-page">
      <div className="skill-header">
        <h2>Edit Skill</h2>
        <button className="back-btn" onClick={() => navigate('/skills')}>
          ← Back
        </button>
      </div>

      <form className="skill-card" onSubmit={handleSubmit}>
        <label>Skill Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        {error && <p className="error-text">{error}</p>}

        <div className="form-actions">
          <button className="primary-btn">Update</button>
        </div>
      </form>
    </div>
  );
}
