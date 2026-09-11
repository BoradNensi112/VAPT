import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ShieldAlert } from 'lucide-react';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import CyberBackground from './components/CyberBackground';
import CyberTelemetryBar from './components/CyberTelemetryBar';

/**
 * ============================================================================
 * LAZY-LOADED ROUTE MODULES (CODE-SPLITTING FOR OPTIMAL PERFORMANCE)
 * ============================================================================
 * Loads page chunks on-demand to keep the initial application bundle lightweight,
 * fast, and responsive across desktop and mobile devices.
 */
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const Projects = lazy(() => import('./pages/Projects'));
const GenerateReport = lazy(() => import('./pages/GenerateReport'));
const Checklist = lazy(() => import('./pages/Checklist'));
const AnalyzeReport = lazy(() => import('./pages/AnalyzeReport'));
const CompareReports = lazy(() => import('./pages/CompareReports'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const SecurityTools = lazy(() => import('./pages/SecurityTools'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs'));
const Profile = lazy(() => import('./pages/Profile'));

/**
 * Smooth CyberShield Page Transition Fallback
 */
function ModuleLoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '55vh',
      gap: '14px',
      color: 'var(--accent-cyan)',
      fontFamily: 'var(--font-cyber)'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid rgba(0, 240, 255, 0.15)',
        borderTopColor: 'var(--accent-cyan)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.8 }}>
        Loading Security Module...
      </span>
    </div>
  );
}

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
        <Suspense fallback={<ModuleLoadingFallback />}>
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
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<ModuleLoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
