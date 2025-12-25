import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './training.css';
import { createTraining } from '../../api/trainingApi';

export default function AddTraining() {
  const navigate = useNavigate();

  /* BASIC INFO */
  const [topic, setTopic] = useState('');
  const [trainingDate, setTrainingDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [status, setStatus] = useState('PENDING');

  /* STEP 1: DEPARTMENTS */
  const departments = ['Production', 'HRS & Pickling', 'Quality'];
  const [selectedDepartments, setSelectedDepartments] = useState([]);

  /* STEP 2: SKILL MASTER (Dept → Skills) */
  const skillMaster = {
    Production: ['Safety', 'Fire Fighting'],
    'HRS & Pickling': ['HRS', 'Pickling'],
    Quality: ['Quality Inspection'],
  };
  const [selectedSkills, setSelectedSkills] = useState([]);

  /* STEP 3: EMPLOYEES WITH SKILL LEVEL */
  const employees = [
    { id: 'HSL101', name: 'Amit Singh', dept: 'Production', skills: { Safety: 2 } },
    { id: 'HSL102', name: 'Rahul Kumar', dept: 'Production', skills: { Safety: 3 } },
    { id: 'HSL103', name: 'Suresh Verma', dept: 'HRS & Pickling', skills: { HRS: 1 } },
    { id: 'HSL104', name: 'Rohit Sharma', dept: 'Quality', skills: { 'Quality Inspection': 2 } },
  ];

  // ✅ store only employee IDs to avoid object includes issue
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState('');

  /* HELPERS */
  const toggleMulti = (value, list, setter) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  /* DERIVED DATA */
  const availableSkills = [
    ...new Set(selectedDepartments.flatMap((d) => skillMaster[d] || [])),
  ];

  const skillGapEmployees = employees.filter(
    (e) =>
      selectedDepartments.includes(e.dept) &&
      selectedSkills.some((s) => (e.skills[s] || 0) < 3)
  );

  const filteredEmployees = skillGapEmployees.filter(
    (e) =>
      e.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      e.id.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ backend expects: assignedEmployees: [{ empId, name, dept }]
    const assignedEmployees = selectedEmployeeIds
      .map((id) => employees.find((emp) => emp.id === id))
      .filter(Boolean)
      .map((emp) => ({
        empId: emp.id,
        name: emp.name,
        dept: emp.dept,
      }));

    const payload = {
      topic,
      trainingDate,
      trainingTime: `${fromTime} - ${toTime}`,
      departments: selectedDepartments,
      skills: selectedSkills,
      assignedEmployees, // ✅ clean data
      status,
    };

    try {
      await createTraining(payload);
      alert('Training assigned');
      navigate('/training');
    } catch (err) {
      console.error(err);
      alert('Failed to assign training');
    }
  };

  return (
    <div className="training-page">
      <div className="training-header">
        <h2>Assign Training (Skill Gap Based)</h2>
        <button className="back-btn" onClick={() => navigate('/training')}>
          ← Back
        </button>
      </div>

      <form className="training-form" onSubmit={handleSubmit}>
        {/* TOPIC */}
        <div className="form-group">
          <label>Training Topic *</label>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} required />
        </div>

        {/* DATE & TIME */}
        <div className="form-row">
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              value={trainingDate}
              onChange={(e) => setTrainingDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>From *</label>
            <input
              type="time"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>To *</label>
            <input
              type="time"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* DEPARTMENTS */}
        <div className="form-group">
          <label>Departments *</label>
          <div className="checkbox-grid">
            {departments.map((d) => (
              <label key={d} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedDepartments.includes(d)}
                  onChange={() => toggleMulti(d, selectedDepartments, setSelectedDepartments)}
                />
                {d}
              </label>
            ))}
          </div>
        </div>

        {/* SKILLS */}
        <div className={`form-group ${!selectedDepartments.length ? 'disabled' : ''}`}>
          <label>Skills (Auto-filtered)</label>
          <div className="checkbox-grid">
            {availableSkills.map((s) => (
              <label key={s} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedSkills.includes(s)}
                  onChange={() => toggleMulti(s, selectedSkills, setSelectedSkills)}
                  disabled={!selectedDepartments.length}
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        {/* EMPLOYEES */}
        <div className={`form-group ${!selectedSkills.length ? 'disabled' : ''}`}>
          <label>Employees with Skill Gap (Level &lt; 3)</label>

          <input
            type="text"
            placeholder="Search employee"
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            disabled={!selectedSkills.length}
          />

          <div className="employee-list">
            {filteredEmployees.map((emp) => (
              <label key={emp.id} className="employee-row">
                <input
                  type="checkbox"
                  checked={selectedEmployeeIds.includes(emp.id)}
                  onChange={() => toggleMulti(emp.id, selectedEmployeeIds, setSelectedEmployeeIds)}
                  disabled={!selectedSkills.length}
                />
                {emp.name} ({emp.id}) — {emp.dept}
              </label>
            ))}
          </div>
        </div>

        {/* STATUS */}
        <div className="form-group">
          <label>Status *</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* ACTION */}
        <button type="submit" className="primary-btn">
          Assign Training
        </button>
      </form>
    </div>
  );
}
