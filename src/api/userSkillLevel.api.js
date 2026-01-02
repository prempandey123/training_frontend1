import api from './api';

export async function upsertMySkillLevel(skillId, currentLevel) {
  const { data } = await api.put(`/user-skill-levels/me/${skillId}`, { currentLevel });
  return data;
}

export async function getUserSkillLevels(userId) {
  const { data } = await api.get(`/user-skill-levels/user/${userId}`);
  return data;
}

// ✅ For training assignment: users under a certain level for a skill
export async function getUsersUnderSkillLevel(skillId, maxLevel = 3) {
  const { data } = await api.get(`/user-skill-levels/skill/${skillId}`, {
    params: { maxLevel },
  });
  return data;
}

// ✅ HR/Admin: set required (target) levels per user (bulk)
export async function bulkSetRequiredLevels(userId, levels) {
  const { data } = await api.put(`/user-skill-levels/user/${userId}/required-levels`, {
    levels,
  });
  return data;
}
