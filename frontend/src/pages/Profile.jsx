import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Mail,
  Key,
  Shield,
  Award,
  CheckCircle2,
  Lock,
  Flame,
  Layers,
  Clock,
  Activity,
  Terminal,
  Eye,
  EyeOff,
  Save,
  Sparkles,
  Building2,
  Phone,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Cpu,
  Zap,
  CheckSquare,
  ArrowRight,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/profile.css';

export default function Profile() {
  const { user, updateUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || 'Software',
    phone: user?.phone || '+91 (079) 2321-XXXX',
    bio: user?.bio || 'Senior Cybersecurity Analyst specializing in Web Application VAPT and Defensive Hardening.',
    specialization: user?.specialization || 'OWASP Top 10, CWE Testing, SSL/TLS Ciphers, Android APK Reverse Engineering'
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status & Telemetry State
  const [telemetry, setTelemetry] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileToast, setProfileToast] = useState({ type: '', msg: '' });
  const [passwordToast, setPasswordToast] = useState({ type: '', msg: '' });

  // Sync user details on mount or user change
  useEffect(() => {
    if (user) {
      setProfileForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        department: user.department || prev.department,
        phone: user.phone !== undefined ? user.phone : prev.phone,
        bio: user.bio !== undefined ? user.bio : prev.bio,
        specialization: user.specialization !== undefined ? user.specialization : prev.specialization
      }));
    }
  }, [user]);

  // Fetch Personal Telemetry & Stats
  const fetchTelemetry = async () => {
    try {
      setLoadingTelemetry(true);
      const res = await api.get('/auth/profile-stats');
      if (res && res.data && res.data.success) {
        setTelemetry(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching profile telemetry:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    if (refreshUser) refreshUser();
    fetchTelemetry();
  }, []);

  // Compute Live Password Strength
  const passwordStrength = useMemo(() => {
    const pwd = passwordForm.newPassword || '';
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd)
    };

    if (checks.length) score += 25;
    if (checks.uppercase && checks.lowercase) score += 25;
    if (checks.number) score += 25;
    if (checks.special) score += 25;

    let label = 'Enter password';
    let color = '#64748b';
    if (pwd.length > 0) {
      if (score <= 25) { label = 'Weak Entropy'; color = '#ef4444'; }
      else if (score <= 50) { label = 'Moderate'; color = '#f59e0b'; }
      else if (score <= 75) { label = 'Strong Defense'; color = '#3b82f6'; }
      else { label = 'Hardened Posture'; color = '#10b981'; }
    }

    return { score, label, color, checks };
  }, [passwordForm.newPassword]);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileToast({ type: '', msg: '' });

    try {
      setIsSavingProfile(true);
      const res = await api.put('/auth/profile', profileForm);
      if (res && res.data && res.data.success) {
        setProfileToast({ type: 'success', msg: 'Profile details saved and updated successfully!' });
        if (updateUser && res.data.user) {
          updateUser(res.data.user);
        }
        setTimeout(() => setProfileToast({ type: '', msg: '' }), 4000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileToast({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to update profile details.'
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordToast({ type: '', msg: '' });

    if (!passwordForm.currentPassword) {
      setPasswordToast({ type: 'error', msg: 'Please enter your current password.' });
      return;
    }

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordToast({ type: 'error', msg: 'New password must be at least 6 characters.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordToast({ type: 'error', msg: 'New password and confirmation do not match.' });
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res && res.data && res.data.success) {
        setPasswordToast({
          type: 'success',
          msg: 'Password updated successfully! Re-encrypted with bcrypt salt.'
        });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordToast({ type: '', msg: '' }), 5000);
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordToast({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to change password. Verify your current password.'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const isRoleAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';
  const isRoleCiso = user?.role === 'CISO';

  // System Permissions Matrix
  const permissionsList = [
    {
      title: 'VAPT Report Generation (Form 207)',
      desc: 'Export official BISAG/SD/FR-207 R01 Excel audit certificates',
      granted: true,
      icon: FileSpreadsheet
    },
    {
      title: 'Interactive 31-Point Audit Checklist',
      desc: 'Conduct and store daily dynamic compliance test sessions',
      granted: true,
      icon: CheckSquare
    },
    {
      title: 'Security Suite & Recon Tools',
      desc: 'Run shcheck, CORS audits, SSL cipher tests, and port scans',
      granted: true,
      icon: Terminal
    },
    {
      title: 'Knowledge Base Vulnerability Rules',
      desc: 'Create, update, and search standardized OWASP/CWE definitions',
      granted: true,
      icon: Database
    },
    {
      title: 'Central SOC Activity Logs Stream',
      desc: 'Inspect enterprise-wide immutable security audit logs',
      granted: isRoleAdmin || isRoleCiso,
      icon: Activity
    },
    {
      title: 'User Management & Clearance Controls',
      desc: 'Register analysts, assign credentials, and alter access roles',
      granted: isRoleAdmin,
      icon: Lock
    }
  ];

  return (
    <div className="page-wrapper profile-page-canvas">
      {/* =========================================================
          1. HERO OPERATOR BANNER
          ========================================================= */}
      <div className="profile-hero-card">
        <div className="profile-hero-identity">
          <div className="profile-avatar-box">
            <div className="profile-avatar-disc">
              {profileForm.name ? profileForm.name.charAt(0).toUpperCase() : (user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="avatar-online-beacon" title="Session Node Online & Verified" />
          </div>

          <div className="profile-hero-titles">
            <div className="profile-hero-name-row">
              <h1 className="profile-operator-name">{profileForm.name || user?.name || user?.username}</h1>
              <span className={`profile-role-badge ${isRoleAdmin ? 'admin' : isRoleCiso ? 'ciso' : 'analyst'}`}>
                <ShieldCheck size={13} />
                <span>{user?.role || 'Security Analyst'}</span>
              </span>
            </div>

            <div className="profile-org-line">
              <span>Bhaskaracharya National Institute for Space Applications & Geo-informatics (BISAG-N)</span>
              <span className="profile-org-dot">•</span>
              <span>Ministry of Electronics & Information Technology (MeitY)</span>
              <span className="profile-org-dot">•</span>
              <span className="profile-clearance-pill">
                <Award size={12} />
                <span>{telemetry?.clearanceLevel || 'Level-3 Classified'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="profile-hero-meta">
          <div className="profile-live-status-card">
            <span className="live-beacon-pulse" />
            <div className="status-text-block">
              <span className="status-label">SENTINEL ACCESS</span>
              <span className="status-val">Active SOC Node</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          2. PERSONAL TELEMETRY STATS GRID
          ========================================================= */}
      <div className="profile-stats-grid">
        <div className="profile-kpi-card">
          <div className="profile-kpi-head">
            <span className="kpi-head-label">ASSESSMENTS AUDITED</span>
            <div className="kpi-icon-badge blue">
              <Layers size={17} />
            </div>
          </div>
          <div className="profile-kpi-val">{telemetry?.totalAssessments ?? '—'}</div>
          <div className="profile-kpi-footer">Active Targets Registered</div>
        </div>

        <div className="profile-kpi-card">
          <div className="profile-kpi-head">
            <span className="kpi-head-label">FLAWS IDENTIFIED</span>
            <div className="kpi-icon-badge orange">
              <Flame size={17} />
            </div>
          </div>
          <div className="profile-kpi-val">{telemetry?.totalFindingsReported ?? '—'}</div>
          <div className="profile-kpi-footer">{telemetry?.criticalFound || 0} Critical • {telemetry?.highFound || 0} High</div>
        </div>

        <div className="profile-kpi-card">
          <div className="profile-kpi-head">
            <span className="kpi-head-label">CHECKLIST PROGRESS</span>
            <div className="kpi-icon-badge green">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="profile-kpi-val">{telemetry?.checklistItemsTested ?? 31} Points</div>
          <div className="profile-kpi-footer">Daily Testing Rigor</div>
        </div>

        <div className="profile-kpi-card">
          <div className="profile-kpi-head">
            <span className="kpi-head-label">AUDIT RELIABILITY</span>
            <div className="kpi-icon-badge purple">
              <Award size={17} />
            </div>
          </div>
          <div className="profile-kpi-val">{telemetry?.auditReliabilityScore || '98.8%'}</div>
          <div className="profile-kpi-footer">{telemetry?.fixRate || '100%'} Verified Resolution</div>
        </div>
      </div>

      {/* =========================================================
          3. MAIN CONTENT: 2-COLUMN SPLIT
          ========================================================= */}
      <div className="profile-main-grid">
        {/* Left Column: Personal Information Editor */}
        <div className="profile-section-card">
          <div className="profile-card-header">
            <div className="card-header-left">
              <div className="card-header-icon cyan">
                <User size={18} />
              </div>
              <div className="card-header-titles">
                <h3>Operator Identity & Credentials</h3>
                <p>Personal profile metadata, wing assignment, and domain specializations.</p>
              </div>
            </div>
          </div>

          {profileToast.msg && (
            <div className={`profile-toast-banner ${profileToast.type}`}>
              {profileToast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{profileToast.msg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="profile-form-grid">
            {/* Full Name */}
            <div className="profile-form-group">
              <label>FULL LEGAL NAME *</label>
              <input
                type="text"
                required
                className="profile-form-input"
                placeholder="e.g., HarpalSinh Rathod"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </div>

            {/* Username (Locked) */}
            <div className="profile-form-group">
              <label>USER ACCOUNT IDENTIFIER (LOCKED)</label>
              <input
                type="text"
                disabled
                className="profile-form-input disabled"
                value={user?.username || 'admin'}
                title="Account username cannot be modified once provisioned."
              />
            </div>

            {/* Email Address */}
            <div className="profile-form-group">
              <label>GOVERNMENT EMAIL ADDRESS *</label>
              <input
                type="email"
                required
                className="profile-form-input"
                placeholder="analyst@bisag.gov.in"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </div>

            {/* Department */}
            <div className="profile-form-group">
              <label>DEPARTMENT / DIVISION</label>
              <select
                className="profile-form-input"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
              >
                <option value="Software">Software Division</option>
                <option value="Defence">Defence Division</option>
                <option value="SATCOM">SATCOM & Networks</option>
                <option value="GIS">GIS & Space Applications</option>
                <option value="Infrastructure">Infrastructure & Security Ops</option>
              </select>
            </div>

            {/* Phone Number */}
            <div className="profile-form-group full-width">
              <label>CONTACT / INTERCOM EXTENSION</label>
              <input
                type="text"
                className="profile-form-input"
                placeholder="+91 (079) 2321-XXXX"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>

            {/* Specialization Tags */}
            <div className="profile-form-group full-width">
              <label>TECHNICAL SPECIALIZATION & CERTIFICATIONS</label>
              <input
                type="text"
                className="profile-form-input"
                placeholder="e.g., OWASP Top 10, CWE Testing, SSL/TLS, Burp Suite, Android Reverse Engineering"
                value={profileForm.specialization}
                onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
              />
              <div className="profile-specialization-pills">
                {profileForm.specialization.split(',').map((spec, sIdx) => {
                  const tag = spec.trim();
                  if (!tag) return null;
                  return <span key={sIdx} className="spec-pill">{tag}</span>;
                })}
              </div>
            </div>

            {/* Bio */}
            <div className="profile-form-group full-width">
              <label>PROFESSIONAL BIO & BRIEF</label>
              <textarea
                rows="3"
                className="profile-form-input"
                placeholder="Write a brief description of your cybersecurity background and responsibilities..."
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="profile-form-group full-width profile-form-actions">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="profile-save-btn"
              >
                <Save size={15} />
                <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Details'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Password & Credentials Studio */}
        <div className="profile-section-card">
          <div className="profile-card-header">
            <div className="card-header-left">
              <div className="card-header-icon purple">
                <Lock size={18} />
              </div>
              <div className="card-header-titles">
                <h3>Credentials & Password Studio</h3>
                <p>Update password hash, entropy validation, and cryptographic keys.</p>
              </div>
            </div>
          </div>

          {passwordToast.msg && (
            <div className={`profile-toast-banner ${passwordToast.type}`}>
              {passwordToast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{passwordToast.msg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="password-studio-form">
            {/* Current Password */}
            <div className="profile-form-group">
              <label>CURRENT PASSWORD *</label>
              <div className="password-input-wrap">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  placeholder="Enter existing password"
                  className="profile-form-input"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowCurrent(!showCurrent)}
                  title={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="profile-form-group">
              <label>NEW PASSWORD *</label>
              <div className="password-input-wrap">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  placeholder="Enter strong new password"
                  className="profile-form-input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNew(!showNew)}
                  title={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Password Strength Meter */}
            <div className="password-strength-box">
              <div className="strength-bar-header">
                <span className="strength-label-text">ENTROPY RATING:</span>
                <span className="strength-val-text" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label} ({passwordStrength.score}%)
                </span>
              </div>
              <div className="strength-track">
                <div
                  className="strength-fill"
                  style={{
                    width: `${passwordStrength.score}%`,
                    background: passwordStrength.color
                  }}
                />
              </div>

              {/* Requirement Checklist */}
              <div className="password-checklist">
                <div className={`pwd-check-item ${passwordStrength.checks.length ? 'passed' : ''}`}>
                  <CheckCircle2 size={12} />
                  <span>8+ Characters</span>
                </div>
                <div className={`pwd-check-item ${passwordStrength.checks.uppercase && passwordStrength.checks.lowercase ? 'passed' : ''}`}>
                  <CheckCircle2 size={12} />
                  <span>Uppercase & Lowercase</span>
                </div>
                <div className={`pwd-check-item ${passwordStrength.checks.number ? 'passed' : ''}`}>
                  <CheckCircle2 size={12} />
                  <span>At least 1 Number</span>
                </div>
                <div className={`pwd-check-item ${passwordStrength.checks.special ? 'passed' : ''}`}>
                  <CheckCircle2 size={12} />
                  <span>Special Symbol (!@#$)</span>
                </div>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="profile-form-group">
              <label>CONFIRM NEW PASSWORD *</label>
              <div className="password-input-wrap">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="Re-type new password"
                  className="profile-form-input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  title={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Change Password Button */}
            <div className="password-actions-row">
              <button
                type="submit"
                disabled={isChangingPassword || !passwordForm.newPassword}
                className="password-change-btn"
              >
                <Key size={15} />
                <span>{isChangingPassword ? 'Updating Hash...' : 'Update Password Hash'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* =========================================================
          4. ROLE PERMISSIONS MATRIX & RECENT AUDIT LOGS
          ========================================================= */}
      <div className="profile-main-grid">
        {/* Left: Role Permissions Matrix */}
        <div className="profile-section-card">
          <div className="profile-card-header">
            <div className="card-header-left">
              <div className="card-header-icon cyan">
                <ShieldCheck size={18} />
              </div>
              <div className="card-header-titles">
                <h3>Assigned Role Permissions Matrix</h3>
                <p>Security capabilities granted under role clearance '{user?.role || 'Security Analyst'}'.</p>
              </div>
            </div>
          </div>

          <div className="permissions-matrix-grid">
            {permissionsList.map((perm, pIdx) => {
              const Icon = perm.icon;
              return (
                <div key={pIdx} className={`permission-pill-card ${perm.granted ? 'granted' : 'restricted'}`}>
                  <div className={`perm-icon-wrap ${perm.granted ? 'granted' : 'restricted'}`}>
                    <Icon size={14} />
                  </div>
                  <div className="perm-info-block">
                    <span className="perm-title">{perm.title}</span>
                    <span className="perm-desc">{perm.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Personal Activity Feed */}
        <div className="profile-section-card">
          <div className="profile-card-header">
            <div className="card-header-left">
              <div className="card-header-icon amber">
                <Clock size={18} />
              </div>
              <div className="card-header-titles">
                <h3>My Recent Activity Log</h3>
                <p>Personal audit actions executed during active sessions.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/activity-logs')}
              className="soc-btn-outline"
              style={{ padding: '6px 12px', fontSize: '11.5px' }}
            >
              <span>Full Audit Logs</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="personal-audit-list">
            {(!telemetry?.recentLogs || telemetry.recentLogs.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No recent activity records found for this account.
              </div>
            ) : (
              telemetry.recentLogs.map((log, lIdx) => (
                <div key={log.id || lIdx} className="personal-log-row">
                  <div className="log-left-part">
                    <div className="log-icon-mini" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                      <Activity size={14} />
                    </div>
                    <div>
                      <div className="log-action-tag">{log.action}</div>
                      <div className="log-desc-text" title={log.details}>{log.details}</div>
                    </div>
                  </div>
                  <span className="log-time-tag">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
