import { useNavigate } from 'react-router-dom';
import './skillMatrix.css';

export default function SkillMatrix() {
  const navigate = useNavigate();

  const skills = ['HRS', 'Pickling', 'Rolling', 'Safety', 'Quality'];

  const employees = [
    {
      name: 'Prem Pandey',
      skills: { HRS: 3, Pickling: 2, Rolling: 1, Safety: 4, Quality: 3 },
    },
    {
      name: 'Rahul Kumar',
      skills: { HRS: 2, Pickling: 3, Rolling: 2, Safety: 3, Quality: 2 },
    },
    {
      name: 'Amit Singh',
      skills: { HRS: 1, Pickling: 1, Rolling: 3, Safety: 2, Quality: 1 },
    },
  ];

  const maxScore = skills.length * 4;

  const calculateScore = (skillObj) =>
    Object.values(skillObj).reduce((a, b) => a + b, 0);

  const calculatePercentage = (score) =>
    Math.round((score / maxScore) * 100);

  const getCompletionColor = (percentage) => {
    if (percentage < 45) return '#dc2626';      // red
    if (percentage <= 55) return '#f97316';     // orange
    if (percentage <= 65) return '#facc15';     // yellow
    return '#16a34a';                            // green
  };

  return (
    <div className="skill-matrix-page">

      {/* HEADER */}
      <div className="skill-matrix-header">
        <h2>Skill Matrix</h2>

        <div className="skill-matrix-actions">
          <button className="secondary-btn" onClick={() => navigate('/skills')}>
            Skill Master
          </button>
          <button className="primary-btn" onClick={() => navigate('/skills/add')}>
            + Add Skill
          </button>
        </div>
      </div>

      {/* MATRIX TABLE */}
      <div className="matrix-container">
        <table className="matrix-table">
          <thead>
            <tr>
              <th>Employee</th>
              {skills.map((skill) => (
                <th key={skill}>{skill}</th>
              ))}
              <th>Total</th>
              <th>Completion</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((emp, index) => {
              const totalScore = calculateScore(emp.skills);
              const percentage = calculatePercentage(totalScore);
              const circleColor = getCompletionColor(percentage);

              return (
                <tr key={index}>
                  <td className="emp-name">{emp.name}</td>

                  {skills.map((skill) => (
                    <td key={skill}>
                      <span className={`level level-${emp.skills[skill]}`}>
                        {emp.skills[skill]}
                      </span>
                    </td>
                  ))}

                  <td className="total-score">
                    {totalScore} / {maxScore}
                  </td>

                  <td>
                    <div className="circle-wrapper">
                      <svg width="44" height="44">
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          stroke="#e5e7eb"
                          strokeWidth="4"
                          fill="none"
                        />
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          stroke={circleColor}
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray="113"
                          strokeDashoffset={
                            113 - (113 * percentage) / 100
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                      <span
                        className="circle-text"
                        style={{ color: circleColor }}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* LEGEND */}
      <div className="legend">
        <span><b>0</b> = No Skill</span>
        <span><b>1</b> = Beginner</span>
        <span><b>2</b> = Basic</span>
        <span><b>3</b> = Skilled</span>
        <span><b>4</b> = Expert</span>
      </div>

    </div>
  );
}
