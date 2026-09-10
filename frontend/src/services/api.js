import axios from 'axios';
import { localStore } from './localStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3500,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('vapt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

// Fallback Mock Handler when backend is offline/unreachable (e.g. standalone Netlify deployment)
function handleLocalFallback(method, url, data) {
  const cleanUrl = url.split('?')[0].replace(/^\/api/, '').replace(/^\//, '');
  const queryStr = url.includes('?') ? url.split('?')[1] : '';
  const searchParams = new URLSearchParams(queryStr);

  // 1. Auth
  if (cleanUrl === 'auth/login' && method === 'post') {
    const res = localStore.login(data?.username, data?.password, data?.role, data?.adminSecretKey);
    return { data: res };
  }
  if (cleanUrl === 'auth/me' && method === 'get') {
    const userStr = localStorage.getItem('vapt_user');
    return { data: { success: true, user: userStr ? JSON.parse(userStr) : null } };
  }
  if (cleanUrl === 'auth/profile-stats' && method === 'get') {
    return { data: localStore.getProfileStats() };
  }
  if (cleanUrl === 'auth/profile' && method === 'put') {
    return { data: { success: true, message: 'Profile updated' } };
  }

  // 2. Projects
  if (cleanUrl === 'projects' && method === 'get') {
    return { data: localStore.getProjects() };
  }
  if (cleanUrl.startsWith('projects/') && cleanUrl.endsWith('/findings') && method === 'post') {
    const projectId = cleanUrl.split('/')[1];
    return { data: localStore.addFindingsToProject(projectId, data?.findings) };
  }
  if (cleanUrl.startsWith('projects/') && method === 'get') {
    const id = cleanUrl.split('/')[1];
    return { data: localStore.getProjectById(id) };
  }
  if (cleanUrl === 'projects' && method === 'post') {
    return { data: localStore.createProject(data) };
  }
  if (cleanUrl.startsWith('projects/') && method === 'delete') {
    const id = cleanUrl.split('/')[1];
    return { data: localStore.deleteProject(id) };
  }

  // 3. Analytics & Compare Reports
  if (cleanUrl === 'reports/analytics' && method === 'get') {
    return { data: localStore.getAnalytics() };
  }
  if (cleanUrl === 'reports/compare' && method === 'get') {
    return { data: localStore.compareReports(searchParams.get('baseProjectId'), searchParams.get('compareProjectId')) };
  }

  // 4. Checklist
  if (cleanUrl === 'checklist/history' && method === 'get') {
    return { data: localStore.getChecklistHistory() };
  }
  if (cleanUrl === 'checklist' && method === 'get') {
    return { data: localStore.getChecklist(searchParams.get('date')) };
  }
  if (cleanUrl === 'checklist' && method === 'post') {
    return { data: localStore.saveChecklist(data) };
  }

  // 5. Knowledge Base
  if (cleanUrl === 'kb' && method === 'get') {
    return { data: localStore.getKB(searchParams.get('search'), searchParams.get('severity')) };
  }
  if (cleanUrl === 'kb' && method === 'post') {
    return { data: localStore.createKB(data) };
  }
  if (cleanUrl.startsWith('kb/') && method === 'put') {
    const id = cleanUrl.split('/')[1];
    return { data: localStore.updateKB(id, data) };
  }
  if (cleanUrl.startsWith('kb/') && method === 'delete') {
    const id = cleanUrl.split('/')[1];
    return { data: localStore.deleteKB(id) };
  }

  // 6. Users
  if (cleanUrl === 'users' && method === 'get') {
    return { data: localStore.getUsers() };
  }
  if (cleanUrl === 'users' && method === 'post') {
    return { data: localStore.createUser(data) };
  }
  if (cleanUrl.startsWith('users/') && method === 'put') {
    const id = cleanUrl.split('/')[1];
    return { data: localStore.updateUser(id, data) };
  }
  if (cleanUrl.startsWith('users/') && method === 'delete') {
    const id = cleanUrl.split('/')[1];
    return { data: localStore.deleteUser(id) };
  }

  // 7. Analysts
  if (cleanUrl === 'analysts' && method === 'get') {
    return { data: localStore.getAnalysts() };
  }

  // 8. Activity Logs
  if (cleanUrl === 'activity-logs' && method === 'get') {
    return { data: localStore.getActivityLogs() };
  }

  // 9. Tools
  if (cleanUrl.startsWith('tools/')) {
    return { data: localStore.simulateToolScan(cleanUrl, data || {}) };
  }

  return { data: { success: true } };
}

// Resilient Hybrid API Client
const api = {
  async get(url, config) {
    try {
      return await axiosInstance.get(url, config);
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.response?.status >= 500) {
        return handleLocalFallback('get', url);
      }
      throw err;
    }
  },

  async post(url, data, config) {
    try {
      return await axiosInstance.post(url, data, config);
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.response?.status >= 500) {
        return handleLocalFallback('post', url, data);
      }
      throw err;
    }
  },

  async put(url, data, config) {
    try {
      return await axiosInstance.put(url, data, config);
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.response?.status >= 500) {
        return handleLocalFallback('put', url, data);
      }
      throw err;
    }
  },

  async delete(url, config) {
    try {
      return await axiosInstance.delete(url, config);
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.response?.status >= 500) {
        return handleLocalFallback('delete', url);
      }
      throw err;
    }
  }
};

export default api;
