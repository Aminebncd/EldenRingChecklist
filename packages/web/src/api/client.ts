import axios from 'axios';

const env = ((import.meta as unknown) as { env?: { VITE_API_URL?: string } }).env || {};
const baseURL = env.VITE_API_URL || 'http://localhost:4000';
export const api = axios.create({ baseURL });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.set('Authorization', `Bearer ${token}`);
  return cfg;
});
