// UI-only priority mapping for Skill Gap & Training Requirements
// Rule:
//   Level 0–1 → HIGH
//   Level 2   → MEDIUM (Moderate)
//   Level 3+  → LOW

export function getPriorityFromCurrentLevel(currentLevel) {
  const lvl = Number(currentLevel);

  // Fallback: if value is missing/invalid, keep it LOW to avoid false alarms.
  if (!Number.isFinite(lvl)) {
    return { key: 'low', label: 'LOW' };
  }

  if (lvl <= 1) return { key: 'high', label: 'HIGH' };
  if (lvl === 2) return { key: 'medium', label: 'MEDIUM (Moderate)' };
  return { key: 'low', label: 'LOW' };
}
