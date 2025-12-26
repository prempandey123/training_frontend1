import api from './api';
const BASE_URL = '/skills';
export const createSkill = async (data) => {
  // 🔥 PURE axios — NO interceptors
  const res = await api.post(BASE_URL, {
    name: data.name, // hard bind
  });
  return res.data;
};

export const getSkills = async () => {
  const res = await api.get(BASE_URL);
  return res.data;
};

// ✅ Typeahead search
export const searchSkills = async (q) => {
  const query = (q || '').trim();
  if (!query) return [];
  const res = await api.get(`${BASE_URL}/search`, { params: { q: query } });
  return res.data;
};

export const deleteSkill = async (id) => {
  const res = await api.delete(`${BASE_URL}/${id}`);
  return res.data;
};
