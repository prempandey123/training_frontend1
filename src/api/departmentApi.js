import api from './api';
const BASE_URL = '/departments';
export const createDepartment = async (data) => {
  const res = await api.post(BASE_URL, data);
  return res.data;
};

export const getDepartments = async () => {
  const res = await api.get(BASE_URL);
  return res.data; // 🔥 IMPORTANT
};

export const deleteDepartment = async (id) => {
  const res = await api.delete(`${BASE_URL}/${id}`);
  return res.data;
};
