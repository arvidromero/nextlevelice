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

// Sube un archivo de imagen y regresa la ruta relativa (ej. /uploads/xxx.jpg)
export async function subirImagen(file) {
  const formData = new FormData();
  formData.append('imagen', file);
  const { data } = await api.post('/uploads', formData);
  return data.url;
}

// Convierte una ruta relativa (/uploads/xxx.jpg) en una URL completa para mostrarla
export function urlImagen(rutaRelativa) {
  if (!rutaRelativa) return null;
  if (rutaRelativa.startsWith('http')) return rutaRelativa;
  const host = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '');
  return `${host}${rutaRelativa.startsWith('/') ? '' : '/'}${rutaRelativa}`;
}
