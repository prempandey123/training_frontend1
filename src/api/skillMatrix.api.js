import api from './api';

export async function getSkillMatrixForUser(userId) {
  const { data } = await api.get(`/skill-matrix/user/${userId}`); // ✅ FIX
  return data;
}

export async function getMySkillMatrix() {
  const { data } = await api.get('/skill-matrix/me');
  return data;
}

export async function getOrgSkillMatrix(params = {}) {
  const { data } = await api.get('/skill-matrix/org', { params });
  return data;
}
