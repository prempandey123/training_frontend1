import api from './api';

export async function upsertMySkillLevel(skillId, currentLevel) {
  const { data } = await api.put(`/user-skill-levels/me/${skillId}`, { currentLevel });
  return data;
}

export async function getUserSkillLevels(userId) {
  const { data } = await api.get(`/user-skill-levels/user/${userId}`);
  return data;
}
