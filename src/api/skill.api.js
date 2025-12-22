import axios from 'axios';

const BASE_URL = 'http://localhost:3000/skills';

export const createSkill = async (data) => {
  // 🔥 PURE axios — NO interceptors
  const res = await axios.post(BASE_URL, {
    name: data.name, // hard bind
  });
  return res.data;
};

export const getSkills = async () => {
  const res = await axios.get(BASE_URL);
  return res.data;
};

export const deleteSkill = async (id) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res.data;
};
