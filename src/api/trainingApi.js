import axios from 'axios';

// If you already have a configured axios instance elsewhere, replace this with that import.
// Keeping it minimal so it works out-of-the-box.
const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:3000';

export const getTrainings = async () => {
  const res = await axios.get(`${API_BASE}/trainings`);
  return res.data;
};

export const createTraining = async (payload) => {
  const res = await axios.post(`${API_BASE}/trainings`, payload);
  return res.data;
};

export const updateTraining = async (id, payload) => {
  const res = await axios.patch(`${API_BASE}/trainings/${id}`, payload);
  return res.data;
};

export const deleteTraining = async (id) => {
  const res = await axios.delete(`${API_BASE}/trainings/${id}`);
  return res.data;
};

// Placeholder: biometric device sync (backend will be wired later)
export const getTrainingBiometric = async (id) => {
  const res = await axios.get(`${API_BASE}/trainings/${id}/biometric`);
  return res.data;
};

export const downloadTrainingExcel = async () => {
  const res = await axios.get(`${API_BASE}/trainings/excel`, {
    responseType: 'blob',
  });
  return res.data;
};
