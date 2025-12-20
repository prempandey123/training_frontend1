import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './skill.css';

export default function EditSkill() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    department: '',
    isCommon: false,
  });

  const [loading, setLoading] = useState(true);

  // 🔹 LOAD SKILL DETAILS
  useEffect(() => {
    const fetchSkill = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/skills/${id}`,
        );

        setForm({
          name: res.data.name,
          department: res.data.department || '',
          isCommon: res.data.isCommon,
        });
      } catch (err) {
        console.error(err);
        alert('Failed to load skill');
      } finally {
        setLoading(false);
      }
    };

    fetchSkill();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // 🔹 UPDATE SKILL
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `http://localhost:3000/skills/${id}`,
        {
          name: form.name,
          department: form.isCommon ? null : form.department,
          isCommon: form.isCommon,
        },
      );

      alert('Skill updated successfully');
      navigate('/skills');
    } catch (err) {
      console.error(err);
      alert('Failed to update skill');
    }
  };

  if (loading) {
    return <p className="loading-text">Loading skill...</p>;
  }

  return (
    <div className="skill-page">

      {/* HEADER */}
      <div className="skill-header">
        <h2>Edit Skill</h2>
        <button className="back-btn" onClick={() => navigate('/skills')}>
          ← Back
        </button>
      </div>

      {/* FORM */}
      <form className="skill-form" onSubmit={handleSubmit}>

        <div className="form-group">
          <label>Skill Name *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isCommon"
              checked={form.isCommon}
              onChange={handleChange}
            />
            Common Skill (Applicable to all departments)
          </label>
        </div>

        {!form.isCommon && (
          <div className="form-group">
            <label>Department</label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
            >
              <option value="">Select Department</option>
              <option>IT</option>
              <option>Production</option>
              <option>HRS & Pickling</option>
              <option>Quality</option>
            </select>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="primary-btn">
            Update Skill
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={() => navigate('/skills')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
