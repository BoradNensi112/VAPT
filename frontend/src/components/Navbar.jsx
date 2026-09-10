import React from 'react';
import { Shield, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth();
  const { theme, toggleTheme, isDark, isLight } = useTheme();

  return (
    <header className="navbar-container">
      {/* Left Brand Badge */}
      <div className="navbar-left-section">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="navbar-brand-badge">
          <div className="navbar-shield-icon-wrapper">
            <Shield size={19} className="navbar-shield-icon" />
          </div>
          <div className="navbar-brand-text-group">
            <span className="navbar-brand-title">
              CYBERSHIELD
            </span>
            <span className="navbar-brand-sub">
              BISAG-N • MeitY • CYBER DEFENSE OPERATIONS
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="navbar-right-section">
        {/* System Status Pill */}
        <div className="navbar-status-pill">
          <span className="navbar-status-dot-pulse" />
          <span className="status-label">SYSTEM ONLINE</span>
        </div>

        {/* Modern 2-Mode (Light / Dark) Toggle Pill */}
        <button
          type="button"
          onClick={toggleTheme}
          className="navbar-theme-pill-toggle"
          title={isDark ? 'Switch to Light Mode (☀️)' : 'Switch to Dark Mode (🌙)'}
          aria-label="Toggle light and dark mode"
        >
          <span className={`theme-toggle-segment ${isDark ? 'active' : ''}`}>
            <Moon size={13} className="theme-toggle-icon" />
            <span>Dark</span>
          </span>
          <span className={`theme-toggle-segment ${isLight ? 'active' : ''}`}>
            <Sun size={13} className="theme-toggle-icon" />
            <span>Light</span>
          </span>
        </button>

        {/* User Info Avatar Card Pill */}
        <div className="navbar-user-profile">
          <div className="navbar-user-text">
            <div className="navbar-user-name">
              {user?.name || user?.username || 'BISAG-N Admin'}
            </div>
            <div className="navbar-user-role-badge">
              {user?.role || 'Admin'}
            </div>
          </div>
          <div className="navbar-avatar-icon">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}
