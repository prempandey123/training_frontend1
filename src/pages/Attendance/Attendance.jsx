import { useState } from 'react';
import './attendance.css';

export default function Attendance() {
  const [selectedTraining, setSelectedTraining] = useState('Safety Induction');

  // Dummy training list
  const trainings = [
    'Safety Induction',
    'HRS Operation',
    'Quality Awareness',
  ];

  // Dummy attendance data (backend later)
  const [attendanceData, setAttendanceData] = useState([
    {
      empId: 'HSL101',
      name: 'Amit Singh',
      department: 'Production',
      biometric: true,
      status: 'Present',
      inTime: '09:05',
      outTime: '17:10',
    },
    {
      empId: 'HSL102',
      name: 'Rahul Kumar',
      department: 'Production',
      biometric: false,
      status: 'Absent',
      inTime: '--',
      outTime: '--',
    },
    {
      empId: 'HSL103',
      name: 'Suresh Verma',
      department: 'Production',
      biometric: true,
      status: 'Present',
      inTime: '09:12',
      outTime: '17:00',
    },
  ]);

  const toggleStatus = (index) => {
    const updated = [...attendanceData];
    updated[index].status =
      updated[index].status === 'Present' ? 'Absent' : 'Present';
    setAttendanceData(updated);
  };

  return (
    <div className="attendance-page">

      {/* HEADER */}
      <div className="attendance-header">
        <div>
          <h2>Attendance Management</h2>
          <p>Training-wise attendance (Biometric + Manual)</p>
        </div>

        <select
          value={selectedTraining}
          onChange={(e) => setSelectedTraining(e.target.value)}
        >
          {trainings.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Biometric</th>
              <th>Status</th>
              <th>In Time</th>
              <th>Out Time</th>
              <th>Manual Update</th>
            </tr>
          </thead>

          <tbody>
            {attendanceData.map((emp, index) => (
              <tr key={emp.empId}>
                <td>{emp.empId}</td>
                <td className="emp-name">{emp.name}</td>
                <td>{emp.department}</td>

                <td>
                  <span
                    className={`bio-status ${
                      emp.biometric ? 'yes' : 'no'
                    }`}
                  >
                    {emp.biometric ? 'Synced' : 'Not Found'}
                  </span>
                </td>

                <td>
                  <span
                    className={`attendance-status ${
                      emp.status === 'Present'
                        ? 'present'
                        : 'absent'
                    }`}
                  >
                    {emp.status}
                  </span>
                </td>

                <td>{emp.inTime}</td>
                <td>{emp.outTime}</td>

                <td>
                  <button
                    className="toggle-btn"
                    onClick={() => toggleStatus(index)}
                  >
                    Mark {emp.status === 'Present' ? 'Absent' : 'Present'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER NOTE */}
      <div className="attendance-note">
        <b>Note:</b> Biometric data is auto-synced. Manual changes are logged
        for audit.
      </div>
    </div>
  );
}
