import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ShieldAlert } from 'lucide-react';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import CyberBackground from './components/CyberBackground';
import CyberTelemetryBar from './components/CyberTelemetryBar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Projects from './pages/Projects';
import GenerateReport from './pages/GenerateReport';
import Checklist from './pages/Checklist';
import AnalyzeReport from './pages/AnalyzeReport';
import CompareReports from './pages/CompareReports';
import KnowledgeBase from './pages/KnowledgeBase';
import SecurityTools from './pages/SecurityTools';
import ActivityLogs from './pages/ActivityLogs';
import Profile from './pages/Profile';

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' }}>
        <div className="cyber-card" style={{ maxWidth: '520px', textAlign: 'center', padding: '44px 32px' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#ef4444'
          }}>
            <ShieldAlert size={36} />
          </div>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '8px', fontSize: '22px' }}>
            403 — Restricted Area
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            User Management & Security Provisioning is restricted to <strong>Central Administrators</strong> with verified root security clearance only. Your account is registered as <em>{user?.role || 'Non-Admin'}</em>.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="cyber-btn cyber-btn-primary"
            style={{ margin: '0 auto' }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  return children;
}

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg-main)',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent-cyan)',
        fontFamily: 'var(--font-cyber)',
        fontSize: '18px',
        fontWeight: 700
      }}>
        Initializing CyberShield VAPT Security Console...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <CyberBackground />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/generate-report" element={<GenerateReport />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/analyze-report" element={<AnalyzeReport />} />
          <Route path="/compare-reports" element={<CompareReports />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/security-tools" element={<SecurityTools />} />
          <Route path="/activity-logs" element={<ActivityLogs />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
