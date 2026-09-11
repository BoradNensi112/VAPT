import axios from 'axios';
import { localStore } from './localStore';

// In Netlify, /api directly proxies to /.netlify/functions/api without any external server
const API_BASE_URL = '/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('vapt_token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
}, (error) => Promise.reject(error));

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('vapt_token');
      localStorage.removeItem('vapt_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Fallback Mock Handler if completely offline
function handleLocalFallback(method, url, data) {
  const cleanUrl = url.split('?')[0].replace(/^\/api/, '').replace(/^\//, '');
  const queryStr = url.includes('?') ? url.split('?')[1] : '';
  const searchParams = new URLSearchParams(queryStr);

  if (cleanUrl === 'auth/login' && method === 'post') {
    return { data: localStore.login(data?.username, data?.password, data?.role, data?.adminSecretKey) };
  }
  if (cleanUrl === 'auth/me' && method === 'get') {
    const userStr = localStorage.getItem('vapt_user');
    return { data: { success: true, user: userStr ? JSON.parse(userStr) : null } };
  }
  if (cleanUrl === 'auth/profile-stats' && method === 'get') {
    return { data: localStore.getProfileStats() };
  }
  if (cleanUrl === 'projects' && method === 'get') {
    return { data: localStore.getProjects() };
  }
  if (cleanUrl.startsWith('projects/') && cleanUrl.endsWith('/findings') && method === 'post') {
    const projectId = cleanUrl.split('/')[1];
    return { data: localStore.addFindingsToProject(projectId, data?.findings || data) };
  }
  if (cleanUrl.startsWith('projects/') && method === 'get') {
    const id = cleanUrl.split('/')[1];
    return { data: localStore.getProjectById(id) };
  }
  if (cleanUrl.startsWith('projects/') && method === 'put') {
    const id = cleanUrl.split('/')[1];
    return { data: localStore.updateProject(id, data) };
  }
  if (cleanUrl === 'projects' && method === 'post') {
    return { data: localStore.createProject(data) };
  }
  if (cleanUrl.startsWith('projects/') && method === 'delete') {
    const id = cleanUrl.split('/')[1];
    return { data: localStore.deleteProject(id) };
  }
  if (cleanUrl === 'reports/analytics' && method === 'get') {
    return { data: localStore.getAnalytics() };
  }
  if (cleanUrl === 'reports/compare' && method === 'get') {
    return { data: localStore.compareReports(searchParams.get('baseProjectId'), searchParams.get('compareProjectId')) };
  }
  if (cleanUrl === 'checklist/history' && method === 'get') {
    return { data: localStore.getChecklistHistory() };
  }
  if (cleanUrl === 'checklist' && method === 'get') {
    return { data: localStore.getChecklist(searchParams.get('date')) };
  }
  if (cleanUrl === 'checklist' && method === 'post') {
    return { data: localStore.saveChecklist(data) };
  }
  if (cleanUrl === 'kb' && method === 'get') {
    return { data: localStore.getKB(searchParams.get('search'), searchParams.get('severity')) };
  }
  if (cleanUrl === 'kb' && method === 'post') {
    return { data: localStore.createKB(data) };
  }
  if (cleanUrl === 'users' && method === 'get') {
    return { data: localStore.getUsers() };
  }
  if (cleanUrl === 'analysts' && method === 'get') {
    return { data: localStore.getAnalysts() };
  }
  if (cleanUrl === 'activity-logs' && method === 'get') {
    return { data: localStore.getActivityLogs() };
  }
  if (cleanUrl.startsWith('tools/')) {
    return { data: localStore.simulateToolScan(cleanUrl, data || {}) };
  }

  return { data: { success: true } };
}

const api = {
  async get(url, config) {
    try {
      return await axiosInstance.get(url, config);
    } catch (err) {
      return handleLocalFallback('get', url);
    }
  },

  async post(url, data, config) {
    try {
      return await axiosInstance.post(url, data, config);
    } catch (err) {
      return handleLocalFallback('post', url, data);
    }
  },

  async put(url, data, config) {
    try {
      return await axiosInstance.put(url, data, config);
    } catch (err) {
      return handleLocalFallback('put', url, data);
    }
  },

  async delete(url, config) {
    try {
      return await axiosInstance.delete(url, config);
    } catch (err) {
      return handleLocalFallback('delete', url);
    }
  }
};

export default api;
