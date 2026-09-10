import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { localStore } from '../services/localStore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('vapt_user');
    const token = localStorage.getItem('vapt_token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('vapt_user');
        localStorage.removeItem('vapt_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password, role, adminSecretKey) => {
    try {
      const res = await api.post('/auth/login', { username, password, role, adminSecretKey });
      if (res && res.data && res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('vapt_token', res.data.token || 'vapt_session_token');
        localStorage.setItem('vapt_user', JSON.stringify(res.data.user));
        return res.data;
      }
      return (res && res.data) || { success: false, message: 'Invalid credentials or access key.' };
    } catch (err) {
      console.warn('Network auth error, fallback to local clearance:', err);
      const fallbackRes = localStore.login(username, password, role, adminSecretKey);
      if (fallbackRes && fallbackRes.success) {
        setUser(fallbackRes.user);
        localStorage.setItem('vapt_token', fallbackRes.token || 'vapt_session_token');
        localStorage.setItem('vapt_user', JSON.stringify(fallbackRes.user));
      }
      return fallbackRes;
    }
  };

  const updateUser = (newUserData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newUserData };
      localStorage.setItem('vapt_user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res && res.data && res.data.success && res.data.user) {
        updateUser(res.data.user);
        return res.data.user;
      }
    } catch (_) {}
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vapt_token');
    localStorage.removeItem('vapt_user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, refreshUser, loading, isAdmin: user?.role === 'Admin' || user?.role === 'Super Admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
