import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useEffect } from 'react';
import { getTrainings } from '../../api/trainingApi';
import './training.css';

export default function Training() {
  const navigate = useNavigate();

  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);

  const today = new Date();

  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTrainings = async () => {
    try {
      const data = await getTrainings();
      setTrainings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert('Failed to load trainings');
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainings();
  }, []);


  const upcomingTrainings = trainings.filter(
    (t) => new Date(t.date) >= today
  );
  const previousTrainings = trainings.filter(
    (t) => new Date(t.date) < today
  );

  const openAttendees = (training) => {
    setSelectedTraining(training);
    setShowAttendeeModal(true);
  };

  const openPostpone = (training) => {
    setSelectedTraining(training);
    setShowPostponeModal(true);
  };

  return (
    <div className="training-page">

      {/* HEADER */}
      <div className="training-header">
        <h2>Training Management</h2>
        <button className="primary-btn" onClick={() => navigate('/training/add')}>
          + Add Training
        </button>
      </div>

      {/* UPCOMING TRAININGS */}
      <div className="training-section">
        <h3>Upcoming Trainings</h3>

        <table className="training-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Date</th>
              <th>Time</th>
              <th>Department</th>
              <th>Trainer</th>
              <th>Participants</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="no-data">Loading trainings...</td></tr>
            ) : upcomingTrainings.length === 0 ? (
              <tr><td colSpan="7" className="no-data">No upcoming trainings</td></tr>
            ) : upcomingTrainings.map((t) => (
              <tr key={t.id}>
                <td className="training-name">{t.topic}</td>
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td>{t.time}</td>
                <td>{t.department}</td>
                <td>{t.trainer}</td>
                <td>
                  <span className="people-count" onClick={() => openAttendees(t)}>
                    {t.attendees.length}
                  </span>
                </td>
                <td>
                  <button className="secondary-btn" onClick={() => openPostpone(t)}>
                    Postpone
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PREVIOUS TRAININGS */}
      <div className="training-section">
        <h3>Previous Trainings</h3>

        <table className="training-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Date</th>
              <th>Time</th> {/* ✅ ADDED */}
              <th>Department</th>
              <th>Trainer</th>
              <th>Participants</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="no-data">Loading trainings...</td></tr>
            ) : previousTrainings.length === 0 ? (
              <tr><td colSpan="7" className="no-data">No previous trainings</td></tr>
            ) : previousTrainings.map((t) => (
              <tr key={t.id}>
                <td className="training-name">{t.topic}</td>
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td>{t.time}</td> {/* ✅ ADDED */}
                <td>{t.department}</td>
                <td>{t.trainer}</td>
                <td>
                  <span className="people-count" onClick={() => openAttendees(t)}>
                    {t.attendees.length}
                  </span>
                </td>
                <td>
                  <span className="status completed">Completed</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ATTENDANCE MODAL */}
      {showAttendeeModal && selectedTraining && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>{selectedTraining.topic} – Attendance</h3>
              <button onClick={() => setShowAttendeeModal(false)}>✕</button>
            </div>

            <div className="attendance-summary">
              <div className="badge attended">
                Attended
                <b>
                  {selectedTraining.attendees.filter(e => e.status === 'ATTENDED').length}
                </b>
              </div>

              <div className="badge absent">
                Absent
                <b>
                  {selectedTraining.attendees.filter(e => e.status === 'ABSENT').length}
                </b>
              </div>
            </div>

            <table className="modal-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {selectedTraining.attendees.map(emp => (
                  <tr key={emp.empId}>
                    <td>{emp.empId}</td>
                    <td>{emp.name}</td>
                    <td>{emp.dept}</td>
                    <td>
                      <span className={`attendance-status ${emp.status === 'ATTENDED' ? 'green' : 'red'}`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </div>
      )}

      {/* POSTPONE MODAL */}
      {showPostponeModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Postpone Training</h3>
              <button onClick={() => setShowPostponeModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label>Reason *</label>
              <textarea rows="3" placeholder="Reason for postponement"></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>New Date *</label>
                <input type="date" />
              </div>
              <div className="form-group">
                <label>From *</label>
                <input type="time" />
              </div>
              <div className="form-group">
                <label>To *</label>
                <input type="time" />
              </div>
            </div>

            <button className="primary-btn full">
              Reschedule Training
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
