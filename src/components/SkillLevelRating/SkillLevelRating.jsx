import "./skillLevelRating.css";

/**
 * Rating legend used in Org Skill/Competency matrices.
 * UI: ultra-compact and aligned to the right half.
 */
export default function SkillLevelRating({
  title = "Skill Level Rating",
  variant = "ultra",
  align = "right",
}) {
  return (
    <div className={`rating-wrapper ${variant} ${align}`}>
      <table className="rating-table">
        <thead>
          <tr>
            <th className="title">{title}</th>
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
              Can train others <span className="sub">(On the Job or Off the Job)</span>
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
