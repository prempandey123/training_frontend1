// Date/Time formatting helpers
// UI requirement: show 12-hour time (AM/PM). In listing screens, do NOT show "IST".

export const formatDateIST = (input) => {
  if (!input) return '—';
  const s = String(input).trim();

  // Common backend format: YYYY-MM-DD
  const m = s.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
  if (m) {
    const yyyy = m[1];
    const mm = Number(m[2]);
    const dd = m[3];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mon = months[mm - 1];
    if (mon) return `${dd} ${mon} ${yyyy}`;
    return s;
  }

  // Fallback: try Date parsing (ISO etc.)
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return s;
  // Render in IST explicitly
  return dt.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime12 = (input) => {
  const s = String(input || '').trim();
  if (!s) return '';

  // Already 12h
  const ampm = s.match(/^([0-9]{1,2}):([0-9]{2})\s*([AaPp][Mm])$/);
  if (ampm) {
    const hh = String(Number(ampm[1])).padStart(2, '0');
    const mm = ampm[2];
    const ap = ampm[3].toUpperCase();
    return `${hh}:${mm} ${ap}`;
  }

  // 24h
  const m = s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!m) return s;

  let h = Number(m[1]);
  const min = m[2];
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hh = String(h).padStart(2, '0');
  return `${hh}:${min} ${ap}`;
};

// Convert 12-hour parts -> 24-hour "HH:mm" (no timezone conversion, just formatting)
export const to24Time = (hh12, mm, ap) => {
  const h = Number(String(hh12 || '').trim());
  const m = String(mm || '').trim();
  const mer = String(ap || '').trim().toUpperCase();
  if (!h || h < 1 || h > 12) return '';
  if (!/^\d{2}$/.test(m)) return '';
  if (mer !== 'AM' && mer !== 'PM') return '';

  let hour = h % 12;
  if (mer === 'PM') hour += 12;
  const HH = String(hour).padStart(2, '0');
  return `${HH}:${m}`;
};

// Convert 24-hour "HH:mm" -> 12-hour parts
export const from24Time = (hhmm) => {
  const s = String(hhmm || '').trim();
  const m = s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!m) return { hh: '12', mm: '00', ap: 'AM' };

  let H = Number(m[1]);
  const MM = m[2];
  const ap = H >= 12 ? 'PM' : 'AM';
  H = H % 12;
  if (H === 0) H = 12;
  const hh = String(H).padStart(2, '0');
  return { hh, mm: MM, ap };
};

export const splitTimeRange = (range) => {
  const s = String(range || '').trim();
  const parts = s.split('-').map((p) => p.trim()).filter(Boolean);
  return { from: parts[0] || '', to: parts[1] || '' };
};

export const formatTimeRangeIST = (input) => {
  const s = String(input || '').trim();
  if (!s) return '—';

  const parts = s.split('-').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return `${formatTime12(parts[0])} - ${formatTime12(parts[1])}`;
  return `${formatTime12(s)}`;
};
