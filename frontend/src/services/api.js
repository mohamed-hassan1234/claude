import axios from 'axios';

const DEFAULT_API_URL = '/api';
const REQUEST_TIMEOUT_MS = 30000;

const resolveApiBaseUrl = (value) => {
  const normalized = (value || DEFAULT_API_URL).trim().replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(import.meta.env.VITE_API_URL),
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || REQUEST_TIMEOUT_MS),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cloud_survey_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cloud_survey_token');
      localStorage.removeItem('cloud_survey_user');
    }

    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : '') ||
      error.message ||
      'Request failed';

    return Promise.reject({ ...error, message });
  }
);

export default api;
