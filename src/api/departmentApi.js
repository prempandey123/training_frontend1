import axios from 'axios';

const BASE_URL = 'http://localhost:3000/departments';

export const createDepartment = async (data) => {
  const res = await axios.post(BASE_URL, data);
  return res.data;
};

export const getDepartments = async () => {
  const res = await axios.get(BASE_URL);
  return res.data; // 🔥 IMPORTANT
};

export const deleteDepartment = async (id) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res.data;
};
