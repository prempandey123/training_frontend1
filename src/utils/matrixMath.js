/**
 * Matrix math helpers
 *
 * Requirement:
 * - Only count skills/competencies that are actually mapped to the employee.
 * - If a skill is not mapped (missing cell/row), it should be blank in UI and ignored in %.
 * - If a skill is mapped but current level is not set, treat it as 0 for scoring.
 */

import { clampLevel, clampPercent } from './skillColor';

export function uniqueBySkillId(cells = []) {
  const map = new Map();
  (Array.isArray(cells) ? cells : []).forEach((c) => {
    const id = c?.skillId ?? c?.skill_id ?? c?.id;
    if (id === null || id === undefined) return;
    const key = String(id);
    if (!map.has(key)) map.set(key, c);
  });
  return Array.from(map.values());
}

export function calcCompletionFromCells(cells, requiredLevel = 4) {
  const req = clampLevel(requiredLevel);
  const mapped = uniqueBySkillId(cells);
  const totalSkills = mapped.length;
  const totalRequiredScore = totalSkills * req;
  const totalCurrentScore = mapped.reduce((sum, c) => {
    // If mapped but no current level, treat as 0
    const curRaw = c?.currentLevel ?? c?.current_level ?? c?.current;
    const cur = curRaw === null || curRaw === undefined ? 0 : clampLevel(curRaw);
    return sum + cur;
  }, 0);

  const completionPercentage = totalRequiredScore ? clampPercent((totalCurrentScore / totalRequiredScore) * 100) : 0;

  return {
    totalSkills,
    totalRequiredScore,
    totalCurrentScore,
    completionPercentage,
  };
}

export function calcCompletionFromRows(rows, requiredLevel = 4) {
  const req = clampLevel(requiredLevel);
  const list = Array.isArray(rows) ? rows : [];
  const totalSkills = list.length;
  const totalRequiredScore = totalSkills * req;
  const totalCurrentScore = list.reduce((sum, r) => {
    const curRaw = r?.currentLevel ?? r?.current_level ?? r?.current;
    const cur = curRaw === null || curRaw === undefined ? 0 : clampLevel(curRaw);
    return sum + cur;
  }, 0);
  const completionPercentage = totalRequiredScore ? clampPercent((totalCurrentScore / totalRequiredScore) * 100) : 0;
  return {
    totalSkills,
    totalRequiredScore,
    totalCurrentScore,
    completionPercentage,
  };
}
