/*
  Local demo data for OrgSkillMatrix
  - Used when backend is not connected yet, or when "Demo Data" toggle is on.
  - Output shape matches getOrgSkillMatrix API response used by OrgSkillMatrix.jsx
*/

export const DEFAULT_DEMO_DEPARTMENTS = [
  { id: 'dep-1', name: 'Engineering' },
  { id: 'dep-2', name: 'Production' },
  { id: 'dep-3', name: 'Quality' },
  { id: 'dep-4', name: 'HR' },
  { id: 'dep-5', name: 'Sales' },
];

export const DEFAULT_DEMO_DESIGNATIONS = [
  { id: 'des-1', designationName: 'Trainee' },
  { id: 'des-2', designationName: 'Associate' },
  { id: 'des-3', designationName: 'Engineer' },
  { id: 'des-4', designationName: 'Senior Engineer' },
  { id: 'des-5', designationName: 'Lead' },
];

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(arr, r) {
  return arr[Math.floor(r() * arr.length)];
}

function clampLevel(n) {
  const v = Number(n ?? 0);
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(4, v));
}

function computeCompletion(cells) {
  // % of skills meeting required (ignore required=0)
  const relevant = cells.filter((c) => clampLevel(c.requiredLevel) > 0);
  if (!relevant.length) return 0;
  const met = relevant.filter((c) => clampLevel(c.currentLevel) >= clampLevel(c.requiredLevel)).length;
  return Math.round((met / relevant.length) * 100);
}

export function generateMockOrgSkillMatrix({ employeeCount = 50, skillCount = 20, seed = 42 } = {}) {
  const r = mulberry32(seed);

  const skills = Array.from({ length: skillCount }, (_, i) => ({
    id: `skill-${i + 1}`,
    name: `Skill ${String(i + 1).padStart(2, '0')}`,
  }));

  const firstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Ishaan', 'Krishna', 'Kabir', 'Rohan',
    'Anaya', 'Diya', 'Ira', 'Kiara', 'Meera', 'Nisha', 'Pooja', 'Sana',
  ];
  const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Khan', 'Iyer', 'Nair'];

  const employees = Array.from({ length: employeeCount }, (_, idx) => {
    const department = pick(DEFAULT_DEMO_DEPARTMENTS, r).name;
    const designation = pick(DEFAULT_DEMO_DESIGNATIONS, r).designationName;
    const name = `${pick(firstNames, r)} ${pick(lastNames, r)}`;

    const cells = skills.map((s) => {
      // Required level pattern: more variance but mostly 1..3; sometimes 0 (N/A)
      const requiredLevel = 4;

      // Current level biased slightly below required to show heatmap variety
      let currentLevel;
      if (requiredLevel === 0) {
        currentLevel = r() < 0.25 ? 1 + Math.floor(r() * 3) : 0;
      } else {
        const drift = (r() - 0.55) * 2; // [-1.1..0.9]
        currentLevel = clampLevel(Math.round(requiredLevel + drift));
      }

      return {
        skillId: s.id,
        requiredLevel,
        currentLevel,
      };
    });

    return {
      id: `emp-${idx + 1}`,
      name,
      employeeId: `EMP${String(1000 + idx).slice(-4)}`,
      email: `user${idx + 1}@example.com`,
      department,
      designation,
      completionPercentage: computeCompletion(cells),
      cells,
    };
  });

  // stable sort: show higher completion first (nicer glance)
  employees.sort((a, b) => b.completionPercentage - a.completionPercentage);

  return { skills, employees };
}
