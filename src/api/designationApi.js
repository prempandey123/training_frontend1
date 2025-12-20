import axios from 'axios';

const BASE_URL = 'http://localhost:3000/designations';

export const getDesignations = () =>
  axios.get(BASE_URL);

export const getDesignationById = (id) =>
  axios.get(`${BASE_URL}/${id}`);

export const createDesignation = (data) =>
  axios.post(BASE_URL, data);

export const updateDesignation = (id, data) =>
  axios.put(`${BASE_URL}/${id}`, data);

export const toggleDesignationStatus = (id) =>
  axios.patch(`${BASE_URL}/${id}/toggle-status`);

export const deleteDesignation = (id) =>
  axios.delete(`${BASE_URL}/${id}`);
