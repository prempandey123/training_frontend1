/**
 * Matrix math helpers
 *
 * Requirement:
 * - Only count skills/competencies that are actually mapped to the employee.
 * - If a skill is not mapped (missing cell/row), it should be blank in UI and ignored in %.
 * - If a skill is mapped but current level is not set, treat it as 0 for scoring.
 */

import { clampLevel, clampPercent } from './skillColor';

// Decide whether a cell is actually ASSIGNED/MAPPED to the employee.
// Org matrices often come as a full catalog; unassigned entries should be blank and ignored in %.
// Heuristics mirror the individual matrix logic but are a bit more permissive to avoid false negatives.
export function isAssignedCell(c) {
  if (!c) return false;

  // Explicit unassigned flags
  const flagFalse =
    c?.isMapped === false
    || c?.mapped === false
    || c?.isAssigned === false
    || c?.assigned === false
    || c?.is_mapped === false
    || c?.is_assigned === false
    || c?.isMappedToUser === false
    || c?.mappedToUser === false
    || c?.isMappedToEmployee === false
    || c?.mappedToEmployee === false;
  if (flagFalse) return false;

  // Explicit assigned flags
  const flagTrue =
    c?.isMapped === true
    || c?.mapped === true
    || c?.isAssigned === true
    || c?.assigned === true
    || c?.is_mapped === true
    || c?.is_assigned === true
    || c?.isMappedToUser === true
    || c?.mappedToUser === true
    || c?.isMappedToEmployee === true
    || c?.mappedToEmployee === true;
  if (flagTrue) return true;

  // If mapping/cell id exists, it's assigned
  const mappingId =
    c?.mappingId
    ?? c?.mapId
    ?? c?.userSkillId
    ?? c?.user_skill_id
    ?? c?.userSkillLevelId
    ?? c?.user_skill_level_id
    ?? c?.userSkillMappingId
    ?? c?.user_skill_mapping_id
    ?? c?.employeeSkillId
    ?? c?.employee_skill_id
    ?? c?.cellId
    ?? c?.cell_id;
  if (mappingId !== null && mappingId !== undefined) return true;

  // Some APIs include required/target level per employee-skill. If it's 0/empty => not assigned.
  const reqRaw =
    c?.requiredLevel
    ?? c?.required_level
    ?? c?.required
    ?? c?.targetLevel
    ?? c?.target_level
    ?? c?.target;
  if (reqRaw !== null && reqRaw !== undefined) {
    return Number(reqRaw) > 0;
  }

  // If we don't have any marker, assume the cell provided is assigned.
  // (Org APIs often only include assigned cells; this avoids hiding legit "0" levels.)
  return true;
}

export function uniqueBySkillId(cells = []) {
  const map = new Map();
  (Array.isArray(cells) ? cells : []).forEach((c) => {
    if (!isAssignedCell(c)) return;
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
