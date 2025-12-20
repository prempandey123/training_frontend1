import './reports.css';

export default function Reports() {
  // Dummy summary data (backend later)
  const summary = [
    { title: 'Total Trainings', value: 24 },
    { title: 'Completed', value: 86 },
    { title: 'Pending', value: 42 },
    { title: 'Skill Gaps', value: 18 },
  ];

  const reports = [
    {
      id: 1,
      name: 'Training Completion Report',
      description: 'Employee-wise training completion status',
      type: 'Training',
    },
    {
      id: 2,
      name: 'Skill Matrix Report',
      description: 'Designation & employee skill mapping',
      type: 'Skill Matrix',
    },
    {
      id: 3,
      name: 'Skill Gap Analysis',
      description: 'Identify skill gaps by designation',
      type: 'Analytics',
    },
    {
      id: 4,
      name: 'Department-wise Training Report',
      description: 'Training status by department',
      type: 'Training',
    },
  ];

  return (
    <div className="reports-page">

      {/* HEADER */}
      <div className="reports-header">
        <div>
          <h2>Reports</h2>
          <p>Training, competency & skill analytics</p>
        </div>

        <div className="report-filters">
          <select>
            <option>All Departments</option>
            <option>IT</option>
            <option>Production</option>
            <option>Maintenance</option>
          </select>

          <select>
            <option>All Report Types</option>
            <option>Training</option>
            <option>Skill Matrix</option>
            <option>Analytics</option>
          </select>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="report-summary-grid">
        {summary.map((item) => (
          <div key={item.title} className="summary-card">
            <h4>{item.title}</h4>
            <span>{item.value}</span>
          </div>
        ))}
      </div>

      {/* REPORT LIST */}
      <div className="report-list-container">
        <table className="report-table">
          <thead>
            <tr>
              <th>Report Name</th>
              <th>Description</th>
              <th>Category</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="report-name">{report.name}</td>
                <td>{report.description}</td>
                <td>
                  <span className="report-tag">{report.type}</span>
                </td>
                <td>
                  <button className="action-btn">View</button>
                  <button className="export-btn">Export</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
