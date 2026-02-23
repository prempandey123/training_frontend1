import { clampLevel, getLevelColor, getNaColor, getPercentColor } from './skillColor';
import { calcCompletionFromCells } from './matrixMath';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function pill(label, { bg, text }) {
  return `<span class="pill" style="background:${bg};color:${text};">${esc(label)}</span>`;
}

export function buildOrgMatrixPrintHtml({
  title = 'Organization Skill Matrix',
  subtitle = '',
  skills = [],
  employees = [],
  columnsPerPage = 12,
  printFriendly = false,
}) {
  const now = new Date();
  const meta = `${esc(subtitle)}<span class="muted">${esc(now.toLocaleString())}</span>`;

  // Legend (levels + % buckets)
  const na = getNaColor({ printFriendly });
  const legend = `
    <div class="legend">
      <span style="font-weight:700;font-size:11px;margin-right:6px;">Legend:</span>
      ${pill('0', getLevelColor(0, { printFriendly }))}
      ${pill('1', getLevelColor(1, { printFriendly }))}
      ${pill('2', getLevelColor(2, { printFriendly }))}
      ${pill('3', getLevelColor(3, { printFriendly }))}
      ${pill('4', getLevelColor(4, { printFriendly }))}
      ${pill('N/A', na)}
      <span style="width:10px"></span>
      ${pill('0–25%', getPercentColor(10, { printFriendly }))}
      ${pill('26–50%', getPercentColor(40, { printFriendly }))}
      ${pill('51–75%', getPercentColor(70, { printFriendly }))}
      ${pill('76–90%', getPercentColor(85, { printFriendly }))}
      ${pill('91–100%', getPercentColor(100, { printFriendly }))}
    </div>
  `;

  const chunks = [];
  for (let i = 0; i < skills.length; i += columnsPerPage) {
    chunks.push(skills.slice(i, i + columnsPerPage));
  }
  if (!chunks.length) chunks.push([]);

  const pages = chunks
    .map((skillChunk, pageIndex) => {
      const head = `
        <thead>
          <tr>
            <th style="width: 170px;">Employee</th>
            <th style="width: 150px;">Dept / Role</th>
            <th style="width: 70px;" class="center">%</th>
            ${skillChunk
              .map((s) => `<th class="center" title="${esc(s.name)}">${esc(s.name)}</th>`)
              .join('')}
          </tr>
        </thead>
      `;

      const body = employees
        .map((emp) => {
          // ✅ % based only on mapped skills (same logic as blank cells)
          const derived = calcCompletionFromCells(emp?.cells || [], 4);
          const pct = derived.completionPercentage;
          const pctC = getPercentColor(pct, { printFriendly });
          const pctCell = `<td class="center" style="background:${pctC.bg};color:${pctC.text};font-weight:700;">${(Number(pct) || 0).toFixed(2)}%</td>`;

          const rowCells = skillChunk
            .map((s) => {
              const c = (emp.cells || []).find((x) => String(x.skillId) === String(s.id));
              // Not mapped or not set => blank
              if (!c || c.currentLevel === null || c.currentLevel === undefined) {
                return `<td class="center">&nbsp;</td>`;
              }

              const cur = clampLevel(c?.currentLevel);
              const req = 4;

              if (!req) {
                const naC = getNaColor({ printFriendly });
                return `<td class="center" style="background:${naC.bg};color:${naC.text};">N/A</td>`;
              }

              const col = getLevelColor(cur, { printFriendly });
              return `<td class="center" style="background:${col.bg};color:${col.text};font-weight:700;">${cur}<span class="muted" style="font-weight:700;">/${req}</span></td>`;
            })
            .join('');

          return `
            <tr>
              <td>
                <div style="font-weight:700;">${esc(emp.name)}</div>
                <div class="muted">${esc(emp.employeeId || emp.email || '')}</div>
              </td>
              <td>
                <div>${esc(emp.department || '—')}</div>
                <div class="muted">${esc(emp.designation || '—')}</div>
              </td>
              ${pctCell}
              ${rowCells}
            </tr>
          `;
        })
        .join('');

      const pageNote = chunks.length > 1 ? ` <span class="muted">(Page ${pageIndex + 1}/${chunks.length})</span>` : '';

      return `
        <div class="page">
          ${pageIndex === 0 ? `<h1>${esc(title)}</h1><div class="meta">${meta}</div>${legend}` : `<h1>${esc(title)}${pageNote}</h1>`}
          <table>
            ${head}
            <tbody>${body || `<tr><td colspan="${3 + skillChunk.length}" class="center muted">No employees</td></tr>`}</tbody>
          </table>
        </div>
      `;
    })
    .join('');

  return pages;
}
