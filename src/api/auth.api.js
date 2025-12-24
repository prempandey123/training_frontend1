import api from './api';

export async function loginApi(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data; // { access_token }
}
