import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // sends the httpOnly refresh-token cookie
});

// Attach the access token from the store to every request.
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// AUTH-CL-002/AUTH-S-002: on a 401, try refreshing the access token once,
// then retry the original request. Avoids bouncing the user to /login every
// time the 15-minute access token expires.
let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry || originalRequest.url === '/auth/refresh') {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post('/auth/refresh');
      const newToken = data.data.accessToken;
      useAuthStore.getState().setSession({ accessToken: newToken, user: data.data.user });
      resolveQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      resolveQueue(refreshError, null);
      useAuthStore.getState().clearSession();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
