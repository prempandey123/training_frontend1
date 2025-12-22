import axios from 'axios';

const BASE_URL = 'http://localhost:3000/users';

/**
 * CREATE USER
 */
export const createUser = async (data) => {
  const res = await axios.post(BASE_URL, data);
  return res.data;
};

/**
 * GET ALL USERS
 */
export const getUsers = async () => {
  const res = await axios.get(BASE_URL);
  return res.data;
};

/**
 * GET USER BY ID
 */
export const getUserById = async (id) => {
  const res = await axios.get(`${BASE_URL}/${id}`);
  return res.data;
};

/**
 * UPDATE USER
 */
export const updateUser = async (id, data) => {
  const res = await axios.put(`${BASE_URL}/${id}`, data);
  return res.data;
};

/**
 * DELETE USER
 */
export const deleteUser = async (id) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res.data;
};
