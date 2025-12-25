import api from './api';

export async function autoCreateRequirementsForUser(userId) {
  const { data } = await api.post(`/training-requirements/auto/user/${userId}`);
  return data;
}

export async function autoCreateMyRequirements() {
  const { data } = await api.post('/training-requirements/auto/me');
  return data;
}

export async function getUserTrainingRequirements(userId, status) {
  const { data } = await api.get(`/training-requirements/user/${userId}`, {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function getMyTrainingRequirements(status) {
  const { data } = await api.get('/training-requirements/me', {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function updateTrainingRequirementStatus(id, status) {
  const { data } = await api.patch(`/training-requirements/${id}`, { status });
  return data;
}
