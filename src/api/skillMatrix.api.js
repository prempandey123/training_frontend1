import api from './api';

export async function getSkillMatrixForUser(userId) {
  const { data } = await api.get(`/skill-matrix/${userId}`);
  return data;
}

export async function getMySkillMatrix() {
  const { data } = await api.get('/skill-matrix/me');
  return data;
}
