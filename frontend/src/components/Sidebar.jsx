import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GitBranch,
  FileSpreadsheet,
  CheckSquare,
  Search,
  GitCompare,
  BookOpen,
  Wrench,
  History,
  User,
  LogOut,
  X,
  Shield,
  ShieldCheck,
  Zap,
  Layers,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar-container ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header with CyberShield Logo */}
        <div className="sidebar-header">
          <div className="sidebar-brand-emblem">
            <ShieldCheck size={22} className="brand-shield-icon" />
          </div>
          <div className="sidebar-brand-text">
            <h2>CYBERSHIELD</h2>
            <span>BISAG-N • MeitY</span>
          </div>
          {isOpen && (
            <button className="sidebar-close-btn" onClick={onClose} title="Close navigation">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation matching exact hierarchy */}
        <nav className="sidebar-nav">
          {/* MAIN SECTION */}
          <div className="nav-section-title">COMMAND CENTER</div>

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <LayoutDashboard className="nav-link-icon" />
            <span>SOC Dashboard</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Users className="nav-link-icon" />
              <span>User & RBAC</span>
            </NavLink>
          )}

          <NavLink
            to="/projects"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Layers className="nav-link-icon" />
            <span>Saved Assessments</span>
          </NavLink>

          {/* REPORTS & TESTING SECTION */}
          <div className="nav-section-title">AUDITS & TESTING</div>

          <NavLink
            to="/generate-report"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <FileSpreadsheet className="nav-link-icon" />
            <span>Generate Report</span>
          </NavLink>

          <NavLink
            to="/checklist"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <CheckSquare className="nav-link-icon" />
            <span>Audit Checklist</span>
          </NavLink>

          <NavLink
            to="/analyze-report"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Search className="nav-link-icon" />
            <span>Analyze Report</span>
          </NavLink>

          <NavLink
            to="/compare-reports"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <GitCompare className="nav-link-icon" />
            <span>Cycle Comparison</span>
          </NavLink>

          {/* MORE SECTION */}
          <div className="nav-section-title">SECURITY ARSENAL</div>

          <NavLink
            to="/security-tools"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Wrench className="nav-link-icon" />
            <span>Security Tools</span>
          </NavLink>

          <NavLink
            to="/knowledge-base"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <BookOpen className="nav-link-icon" />
            <span>Knowledge Base</span>
          </NavLink>

          <NavLink
            to="/activity-logs"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Activity className="nav-link-icon" />
            <span>Activity Logs</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <User className="nav-link-icon" />
            <span>Analyst Profile</span>
          </NavLink>
        </nav>

        {/* Logout Footer */}
        <div className="sidebar-footer">
          <button onClick={logout} className="logout-btn">
            <LogOut size={16} />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}

