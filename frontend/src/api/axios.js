import axios from 'axios';

const DEFAULT_API_ORIGIN = 'http://localhost:5000';

const resolveApiBaseUrl = (value) => {
  const normalized = (value || DEFAULT_API_ORIGIN).trim().replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(import.meta.env.VITE_API_URL)
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
    }
    return Promise.reject(error);
  }
);

export default api;
