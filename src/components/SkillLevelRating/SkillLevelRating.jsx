import "./skillLevelRating.css";

export default function SkillLevelRating() {
  return (
    <div className="rating-wrapper">
      <table className="rating-table">
        <thead>
          <tr>
            <th className="title">Skill Level Rating</th>
            <th className="levelHead">% Level</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Learner &amp; under observation</td>
            <td className="levelCell">
              <div className="circle upto40" aria-label="Upto 40%" />
              <span>Upto 40%</span>
            </td>
          </tr>
          <tr>
            <td>Can work under supervision</td>
            <td className="levelCell">
              <div className="circle upto55" aria-label="40-55%" />
              <span>40 – 55%</span>
            </td>
          </tr>
          <tr>
            <td>Can work independently without supervision</td>
            <td className="levelCell">
              <div className="circle upto65" aria-label="55-65%" />
              <span>55 – 65%</span>
            </td>
          </tr>
          <tr>
            <td>
              Can train subordinates <span className="sub">(On the Job or Off the Job)</span>
            </td>
            <td className="levelCell">
              <div className="circle above65" aria-label="Above 65%" />
              <span>Above 65%</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
