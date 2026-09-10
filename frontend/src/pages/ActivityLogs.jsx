import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Calendar,
  Search,
  RefreshCw,
  Clock,
  User,
  Activity,
  FileSpreadsheet,
  AlertTriangle,
  Flame,
  Filter,
  CheckCircle2,
  Download,
  Shield,
  Layers,
  Sparkles,
  Lock,
  Terminal,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/activityLogs.css';

export default function ActivityLogs() {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Date helper functions
  const getTodayLocal = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getYesterdayLocal = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatLocalDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Defaults to ALL so full history is visible immediately
  const [selectedDate, setSelectedDate] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');

  const fetchLogs = async () => {
    try {
      setIsRefreshing(true);
      const startTime = Date.now();
      const res = await api.get(`/activity-logs?t=${Date.now()}`);
      setLogs(res.data.logs || []);

      const elapsed = Date.now() - startTime;
      if (elapsed < 400) {
        await new Promise(r => setTimeout(r, 400 - elapsed));
      }

      setRefreshMsg('Refreshed! ✓');
      setTimeout(() => setRefreshMsg(''), 2000);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Compute KPI Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const logins = logs.filter(l => (l.action || '').includes('Login')).length;
    const checklistUpdates = logs.filter(l => (l.action || '').includes('Checklist') || (l.action || '').includes('Finding') || (l.action || '').includes('Project')).length;
    const uniqueUsers = new Set(logs.map(l => l.username).filter(Boolean)).size;
    return { total, logins, checklistUpdates, uniqueUsers };
  }, [logs]);

  // Filter logs by selected date, search text, role, and action
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Date filter
      if (selectedDate && selectedDate !== 'ALL') {
        const logDateStr = formatLocalDate(log.timestamp);
        if (logDateStr !== selectedDate) return false;
      }

      // Role filter
      if (roleFilter !== 'ALL') {
        if (roleFilter === 'Admin') {
          if (log.role !== 'Admin' && log.role !== 'Super Admin') return false;
        } else if (log.role !== roleFilter) {
          return false;
        }
      }

      // Action type filter
      if (actionFilter !== 'ALL') {
        const a = log.action || '';
        if (actionFilter === 'LOGIN' && !a.includes('Login')) return false;
        if (actionFilter === 'TOOL' && !a.includes('Audit') && !a.includes('Scan') && !a.includes('Recon') && !a.includes('Inspection') && !a.includes('Probe') && !a.includes('Tool') && !a.includes('Headers')) return false;
        if (actionFilter === 'REPORT' && !a.includes('Report') && !a.includes('Comparison')) return false;
        if (actionFilter === 'CHECKLIST' && !a.includes('Checklist')) return false;
        if (actionFilter === 'FINDING' && !a.includes('Finding')) return false;
        if (actionFilter === 'PROJECT' && !a.includes('Project')) return false;
        if (actionFilter === 'KB' && !a.includes('Knowledge')) return false;
        if (actionFilter === 'USER' && !a.includes('User') && !a.includes('Analyst')) return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchUser = (log.username || '').toLowerCase().includes(query);
        const matchAction = (log.action || '').toLowerCase().includes(query);
        const matchDetails = (log.details || '').toLowerCase().includes(query);
        const matchRole = (log.role || '').toLowerCase().includes(query);
        if (!matchUser && !matchAction && !matchDetails && !matchRole) return false;
      }

      return true;
    });
  }, [logs, selectedDate, roleFilter, actionFilter, searchTerm]);

  // Export to CSV
  const handleExportCsv = () => {
    if (!filteredLogs.length) return;
    const headers = ['ID', 'Timestamp', 'User Account', 'Action Executed', 'Audit Details'];
    const rows = filteredLogs.map(l => [
      l.id || '',
      l.timestamp ? new Date(l.timestamp).toISOString() : '',
      `"${(l.username || '').replace(/"/g, '""')}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vapt_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeClass = (action = '') => {
    if (action.includes('Login')) return 'activity-action-login';
    if (action.includes('Checklist')) return 'activity-action-checklist';
    if (action.includes('Finding')) return 'activity-action-finding';
    if (action.includes('Headers') || action.includes('Scan') || action.includes('Recon') || action.includes('SSL') || action.includes('CORS') || action.includes('Probe') || action.includes('Port') || action.includes('DNS') || action.includes('Tool')) return 'activity-action-tool';
    if (action.includes('Report') || action.includes('Export') || action.includes('Comparison')) return 'activity-action-report';
    if (action.includes('Knowledge')) return 'activity-action-kb';
    if (action.includes('Created') || action.includes('Registered') || action.includes('Project')) return 'activity-action-create';
    if (action.includes('Deleted')) return 'activity-action-delete';
    return 'activity-action-default';
  };

  const getActionIcon = (action = '') => {
    if (action.includes('Login')) return Lock;
    if (action.includes('Checklist')) return CheckCircle2;
    if (action.includes('Finding')) return Flame;
    if (action.includes('Headers') || action.includes('Scan') || action.includes('Recon') || action.includes('SSL') || action.includes('CORS') || action.includes('Probe') || action.includes('Port') || action.includes('DNS') || action.includes('Tool')) return Terminal;
    if (action.includes('Report') || action.includes('Export') || action.includes('Comparison')) return FileSpreadsheet;
    if (action.includes('Knowledge')) return Database;
    if (action.includes('Created') || action.includes('Registered') || action.includes('Project')) return Layers;
    if (action.includes('Deleted')) return AlertTriangle;
    return Activity;
  };

  return (
    <div className="page-wrapper activity-logs-page">
      {/* 1. TOP HEADER BANNER */}
      <div className="activity-header-panel">
        <div className="activity-title-group">
          <div className="activity-badge-tag">
            <ShieldCheck size={14} />
            <span>{isAdmin || user?.role === 'CISO' ? 'CENTRAL SOC AUDIT STREAM' : 'PERSONAL SESSION AUDIT TRAIL'}</span>
          </div>
          <h1 className="activity-page-title">Security Activity & Audit Trail</h1>
          <p className="activity-page-sub">
            {isAdmin || user?.role === 'CISO'
              ? 'Complete immutable audit trail across analyst logins, checklist operations, report generation, and security test executions.'
              : 'Your personal security audit stream of session authentication, report modifications, and testing workflows.'}
          </p>
        </div>

        <div className="activity-header-actions">
          <button
            type="button"
            className="activity-action-btn secondary"
            onClick={handleExportCsv}
            title="Export filtered logs to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="activity-action-btn primary"
            onClick={fetchLogs}
            disabled={isRefreshing}
            title="Refresh live audit stream"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : refreshMsg || 'Refresh Stream'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS */}
      <div className="activity-kpi-grid">
        <div className="activity-kpi-card">
          <div className="kpi-icon-box blue">
            <Clock size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value">{stats.total}</span>
            <span className="kpi-label">Total Audit Events</span>
          </div>
        </div>

        <div className="activity-kpi-card">
          <div className="kpi-icon-box green">
            <Lock size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value green">{stats.logins}</span>
            <span className="kpi-label">Auth & Logins</span>
          </div>
        </div>

        <div className="activity-kpi-card">
          <div className="kpi-icon-box orange">
            <FileSpreadsheet size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value orange">{stats.checklistUpdates}</span>
            <span className="kpi-label">Checklists & Scope</span>
          </div>
        </div>

        <div className="activity-kpi-card">
          <div className="kpi-icon-box purple">
            <User size={20} />
          </div>
          <div className="kpi-data">
            <span className="kpi-value purple">{stats.uniqueUsers}</span>
            <span className="kpi-label">Active Analysts</span>
          </div>
        </div>
      </div>

      {/* 3. FILTER & SEARCH TOOLBAR */}
      <div className="activity-filter-card">
        <div className="activity-filter-top-row">
          {/* Date Picker Controls */}
          <div className="activity-date-controls">
            <div className="activity-date-label">
              <Calendar size={15} />
              <span>Filter Date:</span>
            </div>

            <button
              type="button"
              className={`date-preset-btn ${selectedDate === 'ALL' || !selectedDate ? 'active' : ''}`}
              onClick={() => setSelectedDate('ALL')}
            >
              All History
            </button>

            <button
              type="button"
              className={`date-preset-btn ${selectedDate === getTodayLocal() ? 'active' : ''}`}
              onClick={() => setSelectedDate(getTodayLocal())}
            >
              Today
            </button>

            <button
              type="button"
              className={`date-preset-btn ${selectedDate === getYesterdayLocal() ? 'active' : ''}`}
              onClick={() => setSelectedDate(getYesterdayLocal())}
            >
              Yesterday
            </button>

            <input
              type="date"
              className="activity-date-input"
              value={selectedDate === 'ALL' ? '' : selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || 'ALL')}
              title="Select custom date"
            />
          </div>

          {/* Search & Role Filter */}
          <div className="activity-search-group">
            <div className="activity-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search action, user, details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button type="button" className="clear-search-btn" onClick={() => setSearchTerm('')}>✕</button>
              )}
            </div>

            {(isAdmin || user?.role === 'CISO') && (
              <select
                className="activity-filter-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Security Analyst">Security Analyst</option>
                <option value="CISO">CISO</option>
              </select>
            )}

            <select
              className="activity-filter-select"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">Auth & Logins</option>
              <option value="TOOL">Security Tools & Scans</option>
              <option value="REPORT">Reports & Downloads</option>
              <option value="CHECKLIST">Daily Checklist</option>
              <option value="FINDING">Vulnerability Findings</option>
              <option value="PROJECT">Projects & Scope</option>
              <option value="KB">Knowledge Base</option>
              <option value="USER">User & Analyst Admin</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Banner */}
        <div className="activity-summary-banner">
          <div className="summary-left">
            <span>Showing <strong>{filteredLogs.length}</strong> event{filteredLogs.length !== 1 ? 's' : ''}</span>
            <span className="summary-dot">•</span>
            <span className="filter-indicator-badge">
              <Clock size={12} />
              {selectedDate === 'ALL' || !selectedDate
                ? 'All Recorded History'
                : selectedDate === getTodayLocal()
                ? `Today (${selectedDate})`
                : selectedDate === getYesterdayLocal()
                ? `Yesterday (${selectedDate})`
                : `Date: ${selectedDate}`}
            </span>
          </div>

          {searchTerm && (
            <span className="search-tag-indicator">
              Matching search: <em>"{searchTerm}"</em>
            </span>
          )}
        </div>
      </div>

      {/* 4. MAIN LOGS TABLE CARD */}
      <div className="activity-table-card">
        <div className="activity-table-container">
          <table className="activity-data-table">
            <thead>
              <tr>
                <th style={{ width: '190px' }}>TIMESTAMP</th>
                <th style={{ width: '180px' }}>USER ACCOUNT</th>
                <th style={{ width: '230px' }}>ACTION EXECUTED</th>
                <th>AUDIT DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4">
                    <div className="activity-loading-state">
                      <RefreshCw size={24} className="spin" />
                      <span>Loading Live Audit Stream...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="activity-empty-state">
                      <Clock size={40} className="empty-clock-icon" />
                      <h4>No Activity Logs Found</h4>
                      <p>
                        No audit events match your selected date or search filter.
                      </p>
                      <div className="empty-actions-row">
                        <button
                          type="button"
                          className="activity-action-btn secondary"
                          onClick={() => {
                            setSelectedDate('ALL');
                            setSearchTerm('');
                            setRoleFilter('ALL');
                            setActionFilter('ALL');
                          }}
                        >
                          View All Historical Logs
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action);
                  const badgeClass = getActionBadgeClass(log.action);
                  const logDate = log.timestamp ? new Date(log.timestamp) : new Date();

                  return (
                    <tr key={log.id}>
                      {/* Timestamp */}
                      <td className="activity-time-cell">
                        <div className="time-date-part">
                          {logDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="time-clock-part">
                          {logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* User Account */}
                      <td>
                        <div className="activity-user-pill">
                          <div className="user-avatar-mini">
                            {(log.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="user-name-text">{log.username || 'System User'}</span>
                        </div>
                      </td>

                      {/* Action Executed */}
                      <td>
                        <span className={`activity-action-tag ${badgeClass}`}>
                          <ActionIcon size={13} />
                          <span>{log.action}</span>
                        </span>
                      </td>

                      {/* Audit Details */}
                      <td>
                        <div className="activity-details-text">{log.details}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
