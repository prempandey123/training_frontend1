import { clampLevel, getLevelColor, getPercentColor } from './skillColor';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function pill(label, { bg, text }) {
  return `<span class="pill" style="background:${bg};color:${text};">${esc(label)}</span>`;
}

export function buildUserMatrixPrintHtml({
  title = 'Skill Matrix',
  userTitle = '',
  userMeta = '',
  summary = null,
  rows = [],
  printFriendly = false,
}) {
  const now = new Date();

  const legend = `
    <div class="legend">
      <span style="font-weight:700;font-size:11px;margin-right:6px;">Legend:</span>
      ${pill('0', getLevelColor(0, { printFriendly }))}
      ${pill('1', getLevelColor(1, { printFriendly }))}
      ${pill('2', getLevelColor(2, { printFriendly }))}
      ${pill('3', getLevelColor(3, { printFriendly }))}
      ${pill('4', getLevelColor(4, { printFriendly }))}
      <span style="width:10px"></span>
      ${pill('0–25%', getPercentColor(10, { printFriendly }))}
      ${pill('26–50%', getPercentColor(40, { printFriendly }))}
      ${pill('51–75%', getPercentColor(70, { printFriendly }))}
      ${pill('76–90%', getPercentColor(85, { printFriendly }))}
      ${pill('91–100%', getPercentColor(100, { printFriendly }))}
    </div>
  `;

  const summaryHtml = summary
    ? `<div class="meta">
        Skills: <b>${esc(summary.totalSkills)}</b> • Required Score: <b>${esc(summary.totalRequiredScore)}</b>
        • Current Score: <b>${esc(summary.totalCurrentScore)}</b> • Completion: <b>${(Number(esc(summary.completionPercentage)) || 0).toFixed(2)}%</b>
      </div>`
    : '';

  const head = `
    <thead>
      <tr>
        <th>Skill</th>
        <th class="center" style="width:90px;">Required</th>
        <th class="center" style="width:90px;">Current</th>
        <th class="center" style="width:70px;">Gap</th>
      </tr>
    </thead>
  `;

  const body = (rows || [])
    .map((r) => {
      const skill = esc(r.skillName || r.name || 'Skill');
      const req = 4;
      const cur = clampLevel(r.currentLevel ?? r.current ?? 0);
      const gap = Number(r.gap ?? req - cur);

      const reqC = getLevelColor(req, { printFriendly });
      const curC = getLevelColor(cur, { printFriendly });

      return `
        <tr>
          <td>${skill}</td>
          <td class="center" style="background:${reqC.bg};color:${reqC.text};font-weight:700;">${req}</td>
          <td class="center" style="background:${curC.bg};color:${curC.text};font-weight:700;">${cur}</td>
          <td class="center">${Number.isFinite(gap) ? gap : ''}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="page">
      <h1>${esc(title)}</h1>
      <div class="meta">
        <div style="font-weight:700;">${esc(userTitle)}</div>
        <div class="muted">${esc(userMeta)}</div>
        <div class="muted">${esc(now.toLocaleString())}</div>
      </div>
      ${summaryHtml}
      ${legend}
      <table>
        ${head}
        <tbody>
          ${body || `<tr><td colspan="4" class="center muted">No skills</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}
