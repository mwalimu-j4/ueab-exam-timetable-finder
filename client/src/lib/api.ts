import axios from 'axios';
import { getToken, clearToken } from './auth';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({ baseURL: API_URL, withCredentials: true });

apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }
  const token = getToken();
  const studentToken = localStorage.getItem('ueab_student_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else if (studentToken) config.headers.Authorization = `Bearer ${studentToken}`;
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
      clearToken();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  },
);
