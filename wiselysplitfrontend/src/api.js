import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './auth/tokenStore';

// Base config. withCredentials lets the browser send the HttpOnly refresh cookie to /api/auth.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8080/api',
  withCredentials: true
});

// Add token interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// A 401 from these means bad credentials / dead session, not an expired access token.
const NO_REFRESH_ENDPOINTS = ['/auth/login', '/auth/verify-otp', '/auth/google', '/auth/refresh', '/auth/logout'];
const RACE_RETRY_DELAY_MS = 300;

let refreshPromise = null;
let authFailureHandler = null;

/** Called when the session can no longer be refreshed (AuthContext clears its state). */
export const setAuthFailureHandler = (handler) => {
  authFailureHandler = handler;
};

const postRefresh = async () => {
  const { data } = await api.post('/auth/refresh');
  setAccessToken(data.token);
  return data.token;
};

const requestRefresh = async () => {
  try {
    return await postRefresh();
  } catch (err) {
    // 409: another tab rotated the shared cookie a moment ago; retry with the newer cookie.
    if (err.response?.status === 409) {
      await new Promise((resolve) => setTimeout(resolve, RACE_RETRY_DELAY_MS));
      return postRefresh();
    }
    throw err;
  }
};

/** Single-flight refresh: concurrent callers share one /auth/refresh request. */
export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = requestRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const skip = !original
      || original._retry
      || error.response?.status !== 401
      || NO_REFRESH_ENDPOINTS.some((path) => original.url?.startsWith(path));
    if (skip) return Promise.reject(error);

    original._retry = true;
    try {
      const token = await refreshAccessToken();
      original.headers['Authorization'] = `Bearer ${token}`;
      return api(original);
    } catch {
      clearAccessToken();
      authFailureHandler?.();
      return Promise.reject(error);
    }
  }
);

export default api;
