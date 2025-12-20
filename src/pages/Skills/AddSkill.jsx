import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './skill.css';

export default function AddSkill() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    department: '',
    isCommon: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      isCommon: form.isCommon,
      department: form.isCommon ? null : form.department || null,
    };

    try {
      await axios.post('http://localhost:3000/skills', payload);
      alert('Skill added successfully');
      navigate('/skills');
    } catch (err) {
      console.error(err);
      alert('Failed to add skill');
    }
  };

  return (
    <div className="skill-page">

      {/* HEADER */}
      <div className="skill-header">
        <h2>Add Skill</h2>
        <button className="back-btn" onClick={() => navigate('/skills')}>
          ← Back
        </button>
      </div>

      {/* FORM */}
      <form className="skill-form" onSubmit={handleSubmit}>

        <div className="form-group">
          <label>Skill Name *</label>
          <input
            name="name"
            placeholder="e.g. HRS Operation"
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
              <option>Maintenance</option>
            </select>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="primary-btn">
            Save Skill
          </button>
        </div>
      </form>
    </div>
  );
}
