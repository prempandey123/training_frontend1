import api from './api';
const BASE_URL = '/users';
/**
 * CREATE USER
 */
export const createUser = async (data) => {
  const res = await api.post(BASE_URL, data);
  return res.data;
};

/**
 * GET ALL USERS
 */
export const getUsers = async () => {
  const res = await api.get(BASE_URL);
  return res.data;
};

/**
 * ✅ Search users by name / employeeId / email
 * GET /users/search?q=HSL101
 */
export const searchUsers = async (q) => {
  const query = (q || '').trim();
  if (!query) return [];
  const res = await api.get(`${BASE_URL}/search`, { params: { q: query } });
  return res.data;
};

/**
 * GET USER BY ID
 */
export const getUserById = async (id) => {
  const res = await api.get(`${BASE_URL}/${id}`);
  return res.data;
};

/**
 * UPDATE USER
 */
export const updateUser = async (id, data) => {
  const res = await api.put(`${BASE_URL}/${id}`, data);
  return res.data;
};

/**
 * DELETE USER
 */
export const deleteUser = async (id) => {
  const res = await api.delete(`${BASE_URL}/${id}`);
  return res.data;
};
