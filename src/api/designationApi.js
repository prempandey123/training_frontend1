import api from './api';
const BASE_URL = '/designations';
export const getDesignations = async () => {
  const res = await api.get(BASE_URL);
  return res.data; // 🔥 IMPORTANT
};

export const getDesignationById = async (id) => {
  const res = await api.get(`${BASE_URL}/${id}`);
  return res.data;
};

export const createDesignation = async (data) => {
  const res = await api.post(BASE_URL, data);
  return res.data;
};

export const updateDesignation = async (id, data) => {
  const res = await api.put(`${BASE_URL}/${id}`, data);
  return res.data;
};

export const toggleDesignationStatus = async (id) => {
  const res = await api.patch(`${BASE_URL}/${id}/toggle-status`);
  return res.data;
};

export const deleteDesignation = async (id) => {
  const res = await api.delete(`${BASE_URL}/${id}`);
  return res.data;
};
