import { loginApi } from '../api/auth.api';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'auth_user';

export const isAuthenticated = () => {
  return Boolean(localStorage.getItem(TOKEN_KEY));
};

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const getAuthUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

// lightweight JWT decode (no verification)
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const login = async (email, password) => {
  const data = await loginApi(email, password); // { access_token }
  const token = data?.access_token;
  if (!token) throw new Error('No token received');

  localStorage.setItem(TOKEN_KEY, token);

  const payload = decodeJwt(token) || {};
  // Store what we can for UI
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name, // might be undefined
    })
  );

  return { token, payload };
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
