// Single source of truth for UI + PDF/Print colors.
// Buckets are intentionally high-contrast so changes are easy to spot.

const PALETTE = {
  red: '#d32f2f',
  orange: '#f57c00',
  yellow: '#fff176',
  lightGreen: '#81c784',
  darkGreen: '#2e7d32',
  na: '#e0e0e0',

  // Print-friendly (softer fills + high readability)
  pfRed: '#f8c7c7',
  pfOrange: '#ffd2a6',
  pfYellow: '#fff3b0',
  pfLightGreen: '#d7f2da',
  pfDarkGreen: '#a9d8b0',
  pfNa: '#f2f2f2',
};

function clamp(n, min, max) {
  const v = Number(n ?? 0);
  if (Number.isNaN(v)) return min;
  return Math.max(min, Math.min(max, v));
}

export function clampLevel(level) {
  return clamp(level, 0, 4);
}

export function clampPercent(percent) {
  return clamp(percent, 0, 100);
}

// 0..4 levels mapped to the same visual meaning as % buckets.
export function getLevelColor(level, { printFriendly = false } = {}) {
  const l = clampLevel(level);

  if (l === 0) {
    return {
      bg: printFriendly ? PALETTE.pfRed : PALETTE.red,
      text: printFriendly ? '#000000' : '#ffffff',
    };
  }
  if (l === 1) {
    return {
      bg: printFriendly ? PALETTE.pfOrange : PALETTE.orange,
      text: '#000000',
    };
  }
  if (l === 2) {
    return {
      bg: printFriendly ? PALETTE.pfYellow : PALETTE.yellow,
      text: '#000000',
    };
  }
  if (l === 3) {
    return {
      bg: printFriendly ? PALETTE.pfLightGreen : PALETTE.lightGreen,
      text: '#000000',
    };
  }

  return {
    bg: printFriendly ? PALETTE.pfDarkGreen : PALETTE.darkGreen,
    text: printFriendly ? '#000000' : '#ffffff',
  };
}

// % buckets for completion.
export function getPercentColor(percent, { printFriendly = false } = {}) {
  const p = clampPercent(percent);

  if (p <= 25) {
    return {
      bg: printFriendly ? PALETTE.pfRed : PALETTE.red,
      text: printFriendly ? '#000000' : '#ffffff',
      bucket: 'red',
    };
  }
  if (p <= 50) {
    return {
      bg: printFriendly ? PALETTE.pfOrange : PALETTE.orange,
      text: printFriendly ? '#000000' : '#ffffff',
      bucket: 'orange',
    };
  }
  if (p <= 75) {
    return {
      bg: printFriendly ? PALETTE.pfYellow : PALETTE.yellow,
      text: '#000000',
      bucket: 'yellow',
    };
  }
  if (p <= 90) {
    return {
      bg: printFriendly ? PALETTE.pfLightGreen : PALETTE.lightGreen,
      text: '#000000',
      bucket: 'lightGreen',
    };
  }

  return {
    bg: printFriendly ? PALETTE.pfDarkGreen : PALETTE.darkGreen,
    text: printFriendly ? '#000000' : '#ffffff',
    bucket: 'darkGreen',
  };
}

export function getNaColor({ printFriendly = false } = {}) {
  return {
    bg: printFriendly ? PALETTE.pfNa : PALETTE.na,
    text: '#000000',
  };
}
