import axios from 'axios';

// Base config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8080/api'
});

// Add token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;