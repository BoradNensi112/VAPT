import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  User,
  Key,
  AlertCircle,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Shield,
  HelpCircle,
  X,
  FileCheck,
  Radio,
  Cpu,
  Sparkles,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CyberGlobe from '../components/CyberGlobe';
import '../styles/login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(username, password, role, adminSecretKey);
      if (res && res.success) {
        navigate('/dashboard');
      } else {
        setError((res && res.message) || 'Login failed. Please check credentials or secret key.');
      }
    } catch (err) {
      console.warn('Login catch block fallback:', err);
      setError(err?.response?.data?.message || err?.message || 'Authentication error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Top Bar with Live Node Health & Theme Switcher */}
      <div className="login-top-bar">
        <div className="login-health-badge">
          <span className="health-dot-pulse"></span>
          <Radio size={13} className="health-icon" />
          <span className="health-text">
            <strong>BISAG-N SEC-NODE:</strong> OPERATIONAL
          </span>
          <span className="health-divider">•</span>
          <span className="health-sub">TLS 256-BIT ENCRYPTED</span>
        </div>

        <div className="login-top-actions">
          <button
            type="button"
            className="login-help-top-btn"
            onClick={() => setShowHelpModal(true)}
            title="Helpdesk & Access Support"
          >
            <HelpCircle size={15} />
            <span>Support</span>
          </button>

          <button
            type="button"
            className="login-theme-btn"
            onClick={(e) => toggleTheme(e)}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun size={15} color="#FFB020" /> : <Moon size={15} color="#0284c7" />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>

      {/* Left side with 3D Cyber Globe & Command Center Branding */}
      <div className="login-left">
        <div className="login-canvas-container">
          <CyberGlobe />
        </div>

        <div className="login-branding">
          <div className="login-branding-badge">
            <Cpu size={14} />
            <span>MeitY & BISAG-N National Cybersecurity Platform</span>
          </div>

          <img
            src="/assets/bisag-logo.png"
            alt="BISAG-N MeitY Logo"
            className="login-branding-logo"
          />

          <div className="login-hero-text">
            <h1>
              Centralized <span>VAPT</span>
              <br />
              Security Command Center
            </h1>
            <p>
              Automating vulnerability assessment, live threat reconnaissance, smart KB suggestions, and standardized CERT-In & OWASP reporting for national cyber defense.
            </p>
          </div>
        </div>

        <div className="login-stats-strip">
          <div className="stat-pill">
            <div className="stat-pill-icon-wrap">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="stat-pill-num">OWASP Top 10</div>
              <div className="stat-pill-label">Standardized Mappings</div>
            </div>
          </div>

          <div className="stat-pill">
            <div className="stat-pill-icon-wrap">
              <FileCheck size={18} />
            </div>
            <div>
              <div className="stat-pill-num">CERT-In Aligned</div>
              <div className="stat-pill-label">Multi-Section Excel</div>
            </div>
          </div>

          <div className="stat-pill">
            <div className="stat-pill-icon-wrap">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="stat-pill-num">Smart Recon KB</div>
              <div className="stat-pill-label">Heuristic URL Engine</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side with 3D Glassmorphic Login Box */}
      <div className="login-right">
        <div className="login-box-3d">
          <div className="login-header-mini">
            <img
              src="/assets/bisag-logo.png"
              alt="BISAG-N Logo"
              className="login-form-logo"
            />
            <h2>Authorized Portal Login</h2>
            <p>Enter your official credentials and select your assigned role</p>
          </div>

          <div className="security-badge-note">
            <ShieldCheck size={16} />
            <span>Strict Access: Accounts provisioned by Security Admin only.</span>
          </div>

          {error && (
            <div className="login-error-box">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Role Field */}
            <div className="form-group">
              <label className="form-label">ASSIGNED SECURITY ROLE</label>
              <div className="input-with-icon-wrap">
                <Shield size={16} className="input-prefix-icon" />
                <select
                  className="form-select with-icon"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Admin">🛡️ Admin (Full Access & User Control)</option>
                  <option value="Security Analyst">🔍 Security Analyst (Testing & Reports)</option>
                  <option value="Project Manager">📊 Project Manager (Review & Tracking)</option>
                  <option value="CISO">🏛️ Additional Director / CISO (Executive)</option>
                </select>
              </div>
            </div>

            {/* Username Field */}
            <div className="form-group">
              <label className="form-label">USERNAME OR GOV EMAIL</label>
              <div className="input-with-icon-wrap">
                <User size={16} className="input-prefix-icon" />
                <input
                  type="text"
                  className="form-input with-icon"
                  placeholder="e.g. admin or official username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Eye */}
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label">AUTHENTICATION PASSWORD</label>
                <button
                  type="button"
                  className="password-toggle-text-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <>
                      <EyeOff size={13} />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye size={13} />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
              <div className="input-with-icon-wrap">
                <Lock size={16} className="input-prefix-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input with-icon with-suffix"
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-suffix-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Admin Master Secret Code (Visible & Required ONLY for Admin role) */}
            {role === 'Admin' && (
              <div className="form-group admin-secret-group">
                <div className="form-label-row">
                  <label className="form-label admin-secret-label">
                    <span className="admin-key-badge">⚡ ROOT PASSCODE</span>
                    ADMIN MASTER SECURITY KEY
                  </label>
                  <button
                    type="button"
                    className="password-toggle-text-btn admin-key-toggle-btn"
                    onClick={() => setShowAdminKey(!showAdminKey)}
                  >
                    {showAdminKey ? (
                      <>
                        <EyeOff size={13} />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye size={13} />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="input-with-icon-wrap">
                  <KeyRound size={16} className="input-prefix-icon admin-key-icon" />
                  <input
                    type={showAdminKey ? 'text' : 'password'}
                    className="form-input with-icon with-suffix admin-secret-input"
                    placeholder="Enter Admin Secret Code (e.g. BISAG-ADMIN-2026)"
                    value={adminSecretKey}
                    onChange={(e) => setAdminSecretKey(e.target.value)}
                    required
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="input-suffix-eye-btn"
                    onClick={() => setShowAdminKey(!showAdminKey)}
                    title={showAdminKey ? 'Hide key' : 'Show key'}
                  >
                    {showAdminKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="admin-key-hint">
                  🔒 Secret key required to unlock User Management & Root clearance.
                </div>
              </div>
            )}

            {/* Remember Me & Help Link */}
            <div className="login-options-row">
              <label className="custom-checkbox-wrap">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-label">Keep session active</span>
              </label>

              <button
                type="button"
                className="forgot-link-btn"
                onClick={() => setShowHelpModal(true)}
              >
                Need Access / Reset?
              </button>
            </div>

            <button
              type="submit"
              className="cyber-btn cyber-btn-primary login-submit-btn"
              disabled={loading}
            >
              <Key size={18} />
              <span>{loading ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE & ENTER'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Contact Admin & Support Modal */}
      {showHelpModal && (
        <div className="login-modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <ShieldCheck size={22} color="#00f0ff" />
                <h3>BISAG-N Security Operations Desk</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowHelpModal(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-intro">
                For national cybersecurity protocol adherence, accounts and permissions are strictly provisioned by the Central Security Administrator.
              </p>

              <div className="modal-info-box">
                <h4>📋 Account Access & Password Reset Procedure:</h4>
                <ul>
                  <li><strong>Security Analysts:</strong> Submit your request with your employee ID and division to your team lead.</li>
                  <li><strong>Project Managers:</strong> Request project tagging through the Admin Portal.</li>
                  <li><strong>Administrator Root Access:</strong> Requires valid username, password, and the authorized <code>ADMIN_SECRET_KEY</code> passcode.</li>
                </ul>
              </div>

              <div className="modal-contact-row">
                <div className="contact-item">
                  <span className="contact-label">SOC Helpdesk:</span>
                  <span className="contact-val">vapt-support@bisag.gov.in</span>
                </div>
                <div className="contact-item">
                  <span className="contact-label">Internal Helpline:</span>
                  <span className="contact-val">Ext. 4420 / 4421</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cyber-btn cyber-btn-primary"
                style={{ width: '100%' }}
                onClick={() => setShowHelpModal(false)}
              >
                Understood, Return to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
