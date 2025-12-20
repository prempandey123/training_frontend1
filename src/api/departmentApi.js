import axios from 'axios';

const BASE_URL = 'http://localhost:3000/departments';

export const createDepartment = (data) =>
  axios.post(BASE_URL, data);

export const getDepartments = () =>
  axios.get(BASE_URL);

export const deleteDepartment = (id) =>
  axios.delete(`${BASE_URL}/${id}`);
