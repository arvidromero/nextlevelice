import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nlice_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expiro o es invalido, mandamos al login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nlice_token');
      localStorage.removeItem('nlice_usuario');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
