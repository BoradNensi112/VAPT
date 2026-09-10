import React, { useState, useEffect, useMemo } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  Shield,
  Check,
  X,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  Lock,
  Sparkles,
  Building2,
  Mail,
  User,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Terminal,
  Activity,
  Award,
  Layers,
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  SlidersHorizontal
} from 'lucide-react';
import api from '../services/api';
import '../styles/users.css';

const DEPARTMENTS = ['Software', 'Defence', 'SATCOM', 'GIS', 'General'];

const ROLE_TIER_INFO = {
  Admin: {
    tier: 'Tier-1 Root',
    label: 'Root Administrator',
    badgeClass: 'role-admin',
    avatarClass: 'admin',
    icon: ShieldCheck,
    color: '#f59e0b',
    description: 'Unrestricted master governance across RBAC, project deletion, scanning engines, and executive telemetry.'
  },
  'Security Analyst': {
    tier: 'Tier-2 VAPT',
    label: 'Security Analyst',
    badgeClass: 'role-securityanalyst',
    avatarClass: 'security-analyst',
    icon: Terminal,
    color: '#0ea5e9',
    description: 'Offensive & defensive security testing, automated recon, CVE knowledge base, and vulnerability verification.'
  },
  'Project Manager': {
    tier: 'Tier-3 Governance',
    label: 'Project Manager',
    badgeClass: 'role-projectmanager',
    avatarClass: 'project-manager',
    icon: Activity,
    color: '#10b981',
    description: 'Audit progress monitoring, report generation, team telemetry, checklist verification, and comparative analytics.'
  },
  CISO: {
    tier: 'Tier-1 Executive',
    label: 'Additional Director / CISO',
    badgeClass: 'role-ciso',
    avatarClass: 'ciso',
    icon: Award,
    color: '#a855f7',
    description: 'Executive threat telemetry, organization-wide posture audits, compliance sign-offs, and risk benchmarking.'
  }
};

const ROLE_PERMISSIONS_MAP = {
  Admin: [
    'User Management & RBAC Governance',
    'Full VAPT Security Suite',
    'Recon & Knowledge Base',
    'CERT-In Report Generation',
    'Audit Checklist & Verification',
    'Scanner & Web Engine Access',
    'Project & Finding Deletion',
    'Executive Threat Telemetry'
  ],
  'Security Analyst': [
    'Full VAPT Security Suite',
    'Recon & Knowledge Base',
    'CERT-In Report Generation',
    'Audit Checklist & Verification',
    'Scanner & Web Engine Access'
  ],
  'Project Manager': [
    'View Assigned Projects',
    'CERT-In Report Generation',
    'Audit Checklist Review',
    'Comparative Analytics',
    'Activity Logs Telemetry'
  ],
  CISO: [
    'Executive Threat Telemetry',
    'Comparative Analytics',
    'Audit Sign-Off & Review',
    'Activity Logs Telemetry',
    'Knowledge Base Reference'
  ]
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showMatrixGuide, setShowMatrixGuide] = useState(false);
  const [selectedUserPerms, setSelectedUserPerms] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [copiedEmailId, setCopiedEmailId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'Security Analyst',
    department: 'Software',
    status: 'Active',
    permissions: ROLE_PERMISSIONS_MAP['Security Analyst']
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [copiedPass, setCopiedPass] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error loading users list');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    const updated = { ...formData, name: val };

    if (!editingUser && val.trim()) {
      const suggestedUsername = val.toLowerCase().trim().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
      if (!formData.username || formData.username.includes('.')) {
        updated.username = suggestedUsername;
      }
      if (!formData.email || formData.email.endsWith('@bisag.gov.in')) {
        updated.email = `${suggestedUsername}@bisag.gov.in`;
      }
    }
    setFormData(updated);
  };

  const handleRoleChange = (newRole) => {
    setFormData({
      ...formData,
      role: newRole,
      permissions: ROLE_PERMISSIONS_MAP[newRole] || []
    });
  };

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = 'Cyber@';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: pass });
    setCopiedPass(false);
  };

  const copyPasswordToClipboard = () => {
    if (!formData.password) return;
    navigator.clipboard.writeText(formData.password);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const copyEmailToClipboard = (email, id) => {
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setError('');
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'Security Analyst',
      department: 'Software',
      status: 'Active',
      permissions: ROLE_PERMISSIONS_MAP['Security Analyst']
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setError('');
    setFormData({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      password: '',
      role: user.role || 'Security Analyst',
      department: user.department || 'Software',
      status: user.status || 'Active',
      permissions: ROLE_PERMISSIONS_MAP[user.role] || []
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingUser) {
        const res = await api.put(`/users/${editingUser.id}`, {
          name: formData.name,
          role: formData.role,
          status: formData.status,
          department: formData.department
        });
        if (res.data.success) {
          setShowModal(false);
          fetchUsers();
        }
      } else {
        const res = await api.post('/users', formData);
        if (res.data.success) {
          setShowModal(false);
          fetchUsers();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed. Please verify fields.');
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.username === 'admin') {
      alert('Cannot suspend root administrator account.');
      return;
    }
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await api.put(`/users/${user.id}`, { status: newStatus });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error toggling user status');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.username === 'admin') {
      alert('Cannot delete primary root administrator account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to revoke clearance for '${user.username}' (${user.name})?`)) {
      return;
    }
    try {
      await api.delete(`/users/${user.id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting user');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('ALL');
    setDepartmentFilter('ALL');
    setStatusFilter('ALL');
  };

  const hasActiveFilters = search || roleFilter !== 'ALL' || departmentFilter !== 'ALL' || statusFilter !== 'ALL';

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q));

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchDept = departmentFilter === 'ALL' || u.department === departmentFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;

      return matchSearch && matchRole && matchDept && matchStatus;
    });
  }, [users, search, roleFilter, departmentFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'Admin').length;
    const analysts = users.filter((u) => u.role === 'Security Analyst').length;
    const managers = users.filter((u) => u.role === 'Project Manager' || u.role === 'CISO').length;
    const active = users.filter((u) => u.status === 'Active').length;
    const suspended = total - active;

    return { total, admins, analysts, managers, active, suspended };
  }, [users]);

  return (
    <div className="page-wrapper users-page-wrapper">
      {/* 1. Glass Header Banner */}
      <div className="users-hero-header">
        <div className="users-hero-left">
          <div className="users-neo-badge">
            <span className="neo-badge-pulse" />
            <ShieldCheck size={13} />
            <span>RBAC ACCESS GOVERNANCE</span>
          </div>
          <h1 className="users-hero-title">Personnel & Access Control</h1>
          <p className="users-hero-subtitle">
            Manage operational security clearance, multi-tier RBAC privileges, and credentials for BISAG-N MeitY cyber personnel.
          </p>
        </div>

        <div className="users-hero-actions">
          <button
            type="button"
            onClick={() => setShowMatrixGuide(true)}
            className="neo-glass-btn secondary"
          >
            <Layers size={15} />
            <span>Clearance Matrix</span>
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="neo-glass-btn primary"
          >
            <UserPlus size={16} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* 2. Neo-Glass Metric KPI Cards */}
      <div className="users-kpi-grid">
        {/* Metric 1 */}
        <div className="neo-kpi-card blue">
          <div className="kpi-top-row">
            <span className="kpi-label">Total Personnel</span>
            <div className="kpi-icon-pill blue">
              <UsersIcon size={18} />
            </div>
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-value">{stats.total}</span>
            <div className="kpi-tag-badge active">
              <span className="kpi-dot green" />
              <span>{stats.active} Active</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="neo-kpi-card amber">
          <div className="kpi-top-row">
            <span className="kpi-label">Root Admins</span>
            <div className="kpi-icon-pill amber">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-value">{stats.admins}</span>
            <div className="kpi-tag-badge amber">
              <span>Tier-1 Root</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="neo-kpi-card cyan">
          <div className="kpi-top-row">
            <span className="kpi-label">Security Analysts</span>
            <div className="kpi-icon-pill cyan">
              <Terminal size={18} />
            </div>
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-value">{stats.analysts}</span>
            <div className="kpi-tag-badge cyan">
              <span>Tier-2 VAPT</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="neo-kpi-card purple">
          <div className="kpi-top-row">
            <span className="kpi-label">Governance & CISOs</span>
            <div className="kpi-icon-pill purple">
              <Award size={18} />
            </div>
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-value">{stats.managers}</span>
            <div className="kpi-tag-badge purple">
              <span>Tier-3 Audit</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Glassy Search & Filter Console Bar */}
      <div className="users-filter-console">
        <div className="filter-console-search">
          <Search size={17} className="search-field-icon" />
          <input
            type="text"
            placeholder="Search by name, @username, official email, or division..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-search-input"
          />
          {search && (
            <button
              type="button"
              className="filter-clear-btn"
              onClick={() => setSearch('')}
              title="Clear Search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-console-dropdowns">
          <div className="neo-select-wrap">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="neo-select-input"
            >
              <option value="ALL">All Roles</option>
              <option value="Admin">Admin (Root)</option>
              <option value="Security Analyst">Security Analyst</option>
              <option value="Project Manager">Project Manager</option>
              <option value="CISO">CISO / Director</option>
            </select>
          </div>

          <div className="neo-select-wrap">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="neo-select-input"
            >
              <option value="ALL">All Divisions</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d} Division
                </option>
              ))}
            </select>
          </div>

          <div className="neo-select-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neo-select-input"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Suspended">Suspended Only</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="neo-reset-btn"
              title="Reset All Filters"
            >
              <RefreshCw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Glass Table Card */}
      <div className="users-table-glass-card">
        <div className="table-glass-header">
          <div className="table-header-title-wrap">
            <h2 className="table-header-heading">Verified Personnel Directory</h2>
            <span className="table-count-pill">
              {filteredUsers.length} of {users.length} verified
            </span>
          </div>

          {hasActiveFilters && (
            <div className="table-active-filters">
              {search && <span className="active-chip">Query: "{search}"</span>}
              {roleFilter !== 'ALL' && <span className="active-chip">Role: {roleFilter}</span>}
              {departmentFilter !== 'ALL' && <span className="active-chip">Div: {departmentFilter}</span>}
              {statusFilter !== 'ALL' && <span className="active-chip">Status: {statusFilter}</span>}
            </div>
          )}
        </div>

        {loading ? (
          <div className="table-loading-state">
            <RefreshCw size={28} className="spin-icon" />
            <p>Authenticating & Loading Personnel Directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-state-icon">
              <UsersIcon size={34} />
            </div>
            <h3>No Members Found</h3>
            <p>Try adjusting your search query or role filters.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="neo-glass-btn secondary"
                style={{ marginTop: '14px' }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="neo-glass-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>MEMBER</th>
                  <th style={{ width: '26%' }}>OFFICIAL CONTACT</th>
                  <th style={{ width: '22%' }}>CLEARANCE LEVEL</th>
                  <th style={{ width: '12%' }}>STATUS</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const tierInfo = ROLE_TIER_INFO[u.role] || ROLE_TIER_INFO['Security Analyst'];
                  const rolePerms = ROLE_PERMISSIONS_MAP[u.role] || [];
                  const initials = (u.name || u.username || 'U')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  const RoleIcon = tierInfo.icon;
                  const isCopied = copiedEmailId === u.id;

                  return (
                    <tr key={u.id} className="neo-table-row">
                      {/* Column 1: Member */}
                      <td>
                        <div className="member-flex-cell">
                          <div className={`member-neo-avatar ${tierInfo.avatarClass}`}>
                            <span>{initials}</span>
                            <span className={`avatar-status-dot ${u.status === 'Active' ? 'online' : 'offline'}`} />
                          </div>
                          <div className="member-meta-stack">
                            <div className="member-name-heading">
                              <span className="name-bold">{u.name}</span>
                              {u.username === 'admin' && (
                                <span className="root-pill">ROOT</span>
                              )}
                            </div>
                            <span className="username-mono">@{u.username}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Official Contact */}
                      <td>
                        <div className="contact-meta-stack">
                          <div className="email-copy-container">
                            <span className="email-value">{u.email}</span>
                            <button
                              type="button"
                              onClick={() => copyEmailToClipboard(u.email, u.id)}
                              className="email-copy-icon-btn"
                              title={isCopied ? 'Copied to clipboard!' : 'Copy Email'}
                            >
                              {isCopied ? (
                                <Check size={13} color="#10b981" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                          <div className="dept-badge-pill">
                            <Building2 size={11} />
                            <span>{u.department || 'Software'} Division</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Clearance Level */}
                      <td>
                        <div className="clearance-meta-stack">
                          <div className={`role-badge-neo ${tierInfo.badgeClass}`}>
                            <RoleIcon size={13} />
                            <span>{u.role}</span>
                          </div>
                          <button
                            type="button"
                            className="capabilities-link-btn"
                            onClick={() =>
                              setSelectedUserPerms({ user: u, perms: rolePerms })
                            }
                          >
                            <span>{rolePerms.length} Capabilities</span>
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Column 4: Status */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`status-toggle-pill ${
                            u.status === 'Active' ? 'active' : 'suspended'
                          }`}
                          title={`Click to ${
                            u.status === 'Active' ? 'Suspend' : 'Activate'
                          }`}
                        >
                          <span className="status-glow-dot" />
                          <span>{u.status}</span>
                        </button>
                      </td>

                      {/* Column 5: Actions */}
                      <td>
                        <div className="table-actions-flex">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="neo-action-icon edit"
                            title="Edit Member"
                          >
                            <Edit size={14} />
                          </button>

                          {u.username !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="neo-action-icon delete"
                              title="Delete Member"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions Detail Modal */}
      {selectedUserPerms && (
        <div
          className="users-modal-overlay"
          onClick={() => setSelectedUserPerms(null)}
        >
          <div
            className="users-modal-glass-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-glass-header">
              <div className="modal-header-left">
                <div className="modal-icon-wrap blue">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Assigned Capabilities</h3>
                  <span className="modal-subtitle">
                    {selectedUserPerms.user.name} (@{selectedUserPerms.user.username}) · {selectedUserPerms.user.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserPerms(null)}
                className="modal-close-icon-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-glass-body">
              <div className="capabilities-stack">
                {selectedUserPerms.perms.map((p, idx) => (
                  <div key={idx} className="capability-glass-item">
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-glass-footer">
              <button
                type="button"
                onClick={() => setSelectedUserPerms(null)}
                className="neo-glass-btn secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedUserPerms.user;
                  setSelectedUserPerms(null);
                  openEditModal(target);
                }}
                className="neo-glass-btn primary"
              >
                <Edit size={14} />
                <span>Modify Role</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clearance Matrix Guide Modal */}
      {showMatrixGuide && (
        <div
          className="users-modal-overlay"
          onClick={() => setShowMatrixGuide(false)}
        >
          <div
            className="users-modal-glass-card large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-glass-header">
              <div className="modal-header-left">
                <div className="modal-icon-wrap purple">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="modal-title">RBAC Clearance Hierarchy</h3>
                  <span className="modal-subtitle">
                    Official Security Matrix for BISAG-N Cyber Operations
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrixGuide(false)}
                className="modal-close-icon-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-glass-body">
              <div className="matrix-deck-grid">
                {Object.entries(ROLE_TIER_INFO).map(([roleKey, info]) => {
                  const perms = ROLE_PERMISSIONS_MAP[roleKey] || [];
                  const RoleIcon = info.icon;
                  return (
                    <div key={roleKey} className="matrix-tier-card">
                      <div className="tier-card-head">
                        <div
                          className="tier-icon-box"
                          style={{
                            color: info.color,
                            background: `${info.color}15`,
                            border: `1px solid ${info.color}35`
                          }}
                        >
                          <RoleIcon size={16} />
                        </div>
                        <div>
                          <h4 className="tier-name">{info.label}</h4>
                          <span className="tier-level-tag">{info.tier}</span>
                        </div>
                      </div>
                      <p className="tier-description">{info.description}</p>
                      <div className="tier-perms-list">
                        {perms.map((p, idx) => (
                          <div key={idx} className="tier-perm-row">
                            <Check size={12} color={info.color} />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-glass-footer">
              <button
                type="button"
                onClick={() => setShowMatrixGuide(false)}
                className="neo-glass-btn primary"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provision / Edit User Modal */}
      {showModal && (
        <div
          className="users-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="users-modal-glass-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-glass-header">
              <div className="modal-header-left">
                <div className="modal-icon-wrap blue">
                  {editingUser ? <Edit size={20} /> : <UserPlus size={20} />}
                </div>
                <div>
                  <h3 className="modal-title">
                    {editingUser
                      ? `Edit ${editingUser.name}`
                      : 'Provision New Member'}
                  </h3>
                  <span className="modal-subtitle">
                    {editingUser
                      ? 'Update division and clearance role'
                      : 'Generate secure credentials and assign RBAC clearance level'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="modal-close-icon-btn"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="modal-error-banner">
                <AlertTriangle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="modal-glass-body">
                <div className="form-glass-grid">
                  {/* Name */}
                  <div className="glass-form-group">
                    <label className="glass-form-label">Full Legal Name</label>
                    <div className="glass-input-wrapper">
                      <User size={15} className="glass-input-icon" />
                      <input
                        type="text"
                        placeholder="e.g. Commander Jai Mehta"
                        value={formData.name}
                        onChange={handleNameChange}
                        required
                        className="glass-input-field"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div className="glass-form-group">
                    <label className="glass-form-label">System Username</label>
                    <div className="glass-input-wrapper">
                      <span className="glass-input-at">@</span>
                      <input
                        type="text"
                        placeholder="jaimehta"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        required
                        disabled={!!editingUser}
                        className="glass-input-field mono"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="glass-form-group">
                    <label className="glass-form-label">Official Email</label>
                    <div className="glass-input-wrapper">
                      <Mail size={15} className="glass-input-icon" />
                      <input
                        type="email"
                        placeholder="jaimehta@bisag.gov.in"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                        disabled={!!editingUser}
                        className="glass-input-field"
                      />
                    </div>
                  </div>

                  {/* Division */}
                  <div className="glass-form-group">
                    <label className="glass-form-label">Assigned Division</label>
                    <div className="glass-input-wrapper">
                      <Building2 size={15} className="glass-input-icon" />
                      <select
                        className="glass-input-field"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value
                          })
                        }
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept} Division
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="glass-form-group">
                    <label className="glass-form-label">Security Role</label>
                    <div className="glass-input-wrapper">
                      <Shield size={15} className="glass-input-icon" />
                      <select
                        className="glass-input-field"
                        value={formData.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                      >
                        <option value="Admin">Admin (Tier-1 Root)</option>
                        <option value="Security Analyst">
                          Security Analyst (Tier-2 VAPT)
                        </option>
                        <option value="Project Manager">
                          Project Manager (Tier-3 Audit)
                        </option>
                        <option value="CISO">
                          CISO / Director (Tier-1 Executive)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="glass-form-group">
                    <label className="glass-form-label">Clearance Status</label>
                    <div className="glass-input-wrapper">
                      <select
                        className="glass-input-field"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                      >
                        <option value="Active">Active (Permitted)</option>
                        <option value="Suspended">Suspended (Blocked)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password generator for new member */}
                {!editingUser && (
                  <div className="glass-password-section">
                    <div className="password-section-header">
                      <label className="glass-form-label">Temporary Password</label>
                      <button
                        type="button"
                        onClick={generateStrongPassword}
                        className="neo-auto-gen-btn"
                      >
                        <Sparkles size={13} />
                        <span>Auto-Generate Secure Password</span>
                      </button>
                    </div>
                    <div className="glass-input-wrapper">
                      <Lock size={15} className="glass-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter or generate password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required
                        className="glass-input-field mono"
                      />
                      <div className="password-actions-group">
                        {formData.password && (
                          <button
                            type="button"
                            onClick={copyPasswordToClipboard}
                            className="neo-pass-btn"
                            title="Copy Password"
                          >
                            {copiedPass ? (
                              <Check size={14} color="#10b981" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="neo-pass-btn"
                          title={showPassword ? 'Hide' : 'Show'}
                        >
                          {showPassword ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-glass-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="neo-glass-btn secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="neo-glass-btn primary">
                  {editingUser ? 'Save Clearance Changes' : 'Provision Member Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
