import "./skillLevelRating.css";

export default function SkillLevelRating({ type = "skill" }) {
  const title =
    type === "competency"
      ? "Competency Level Rating"
      : "Skill Level Rating";

  return (
    <div className="rating-wrapper corner">
      <table className="rating-table">
        <thead>
          <tr>
            <th className="title">{title}</th>
            <th style={{ width: "70px" }}>%</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Learner & under observation</td>
            <td><div className="circle upto40"></div></td>
          </tr>
          <tr>
            <td>Can work under supervision</td>
            <td><div className="circle upto55"></div></td>
          </tr>
          <tr>
            <td>Independent without supervision</td>
            <td><div className="circle upto65"></div></td>
          </tr>
          <tr>
            <td>66% &amp; above can train others</td>
            <td><div className="circle above65"></div></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
