import api from './api';

export const createUser = (data) => api.post('/users', data);
export const getUsers = () => api.get('/users');
