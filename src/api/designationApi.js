import axios from 'axios';

const BASE_URL = 'http://localhost:3000/designations';

export const getDesignations = async () => {
  const res = await axios.get(BASE_URL);
  return res.data; // 🔥 IMPORTANT
};

export const getDesignationById = async (id) => {
  const res = await axios.get(`${BASE_URL}/${id}`);
  return res.data;
};

export const createDesignation = async (data) => {
  const res = await axios.post(BASE_URL, data);
  return res.data;
};

export const updateDesignation = async (id, data) => {
  const res = await axios.put(`${BASE_URL}/${id}`, data);
  return res.data;
};

export const toggleDesignationStatus = async (id) => {
  const res = await axios.patch(`${BASE_URL}/${id}/toggle-status`);
  return res.data;
};

export const deleteDesignation = async (id) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res.data;
};
