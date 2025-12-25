import api from './api';

export async function getUserSkillGap(userId) {
  const { data } = await api.get(`/skill-gap/user/${userId}`);
  return data;
}

export async function getMySkillGap() {
  const { data } = await api.get('/skill-gap/me');
  return data;
}
