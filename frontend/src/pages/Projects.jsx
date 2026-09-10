import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Plus,
  ExternalLink,
  FileSpreadsheet,
  Trash2,
  Edit,
  Search,
  Check,
  Copy,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  X,
  LayoutGrid,
  List,
  Building2,
  Users as UsersIcon,
  Globe,
  Sparkles,
  Award,
  ChevronRight,
  Shield,
  FileText
} from 'lucide-react';
import api from '../services/api';
import '../styles/projects.css';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [copiedId, setCopiedId] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    project_name: '',
    target_url: '',
    security_analysts: '',
    project_managers: '',
    ciso_name: '',
    remarks: 'Standard VAPT Assessment under BISAG-N MeitY Security Directive.'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      if (res.data.success) {
        setProjects(res.data.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/projects', formData);
      if (res.data.success) {
        setShowModal(false);
        setFormData({
          project_name: '',
          target_url: '',
          security_analysts: '',
          project_managers: '',
          ciso_name: '',
          remarks: 'Standard VAPT Assessment under BISAG-N MeitY Security Directive.'
        });
        fetchProjects();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating project');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete '${name || 'this project'}' and all its findings?`)) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting project');
    }
  };

  const copyUrlToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.project_name && p.project_name.toLowerCase().includes(q)) ||
        (p.target_url && p.target_url.toLowerCase().includes(q)) ||
        (p.security_analysts && p.security_analysts.toLowerCase().includes(q)) ||
        (p.project_managers && p.project_managers.toLowerCase().includes(q));

      let matchRisk = true;
      const crit = p.critical_count || 0;
      const high = p.high_count || 0;
      const med = p.medium_count || 0;
      const low = p.low_count || 0;
      const total = crit + high + med + low;

      if (riskFilter === 'CRITICAL_HIGH') matchRisk = crit > 0 || high > 0;
      else if (riskFilter === 'MEDIUM') matchRisk = med > 0;
      else if (riskFilter === 'LOW') matchRisk = low > 0;
      else if (riskFilter === 'CLEAN') matchRisk = total === 0;

      return matchSearch && matchRisk;
    });
  }, [projects, search, riskFilter]);

  const stats = useMemo(() => {
    const total = projects.length;
    const criticalTargets = projects.filter((p) => (p.critical_count || 0) > 0 || (p.high_count || 0) > 0).length;
    const cleanTargets = projects.filter((p) => ((p.critical_count || 0) + (p.high_count || 0) + (p.medium_count || 0) + (p.low_count || 0)) === 0).length;
    const totalFlaws = projects.reduce((acc, p) => acc + (p.open_count || 0), 0);

    return { total, criticalTargets, cleanTargets, totalFlaws };
  }, [projects]);

  return (
    <div className="page-wrapper projects-page-wrapper">
      {/* 1. Hero Header Banner */}
      <div className="projects-hero-header">
        <div className="projects-hero-left">
          <div className="projects-neo-badge">
            <span className="neo-badge-pulse" />
            <ShieldCheck size={13} />
            <span>CYBERSHIELD TARGET INVENTORY</span>
          </div>
          <h1 className="projects-hero-title">Saved VAPT Reports & Target Assessments</h1>
          <p className="projects-hero-subtitle">
            Central repository of all official VAPT security audit assessments, vulnerability registries, and exported CERT-In compliance workbooks across critical government targets.
          </p>
        </div>

        <div className="projects-hero-actions">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="neo-glass-btn primary"
          >
            <Plus size={16} />
            <span>Provision New Target</span>
          </button>
        </div>
      </div>

      {/* 2. Neo-Glass Metric KPI Cards */}
      <div className="projects-kpi-grid">
        {/* Metric 1 */}
        <div className="neo-kpi-card blue">
          <div className="kpi-top-row">
            <span className="kpi-label">Total Audited Projects</span>
            <div className="kpi-icon-pill blue">
              <Layers size={18} />
            </div>
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-value">{stats.total}</span>
            <div className="kpi-tag-badge active">
              <span className="kpi-dot green" />
              <span>{stats.total} Targets</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="neo-kpi-card amber">
          <div className="kpi-top-row">
            <span className="kpi-label">High / Critical Risk Targets</span>
            <div className="kpi-icon-pill amber">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-value">{stats.criticalTargets}</span>
            <div className="kpi-tag-badge amber">
              <span>Requires Action</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="neo-kpi-card green">
          <div className="kpi-top-row">
            <span className="kpi-label">Zero-Vulnerability Targets</span>
            <div className="kpi-icon-pill green">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-value">{stats.cleanTargets}</span>
            <div className="kpi-tag-badge green">
              <span>Hardened</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="neo-kpi-card purple">
          <div className="kpi-top-row">
            <span className="kpi-label">Total Documented Vulnerabilities</span>
            <div className="kpi-icon-pill purple">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="kpi-bottom-row">
            <span className="kpi-value">{stats.totalFlaws}</span>
            <div className="kpi-tag-badge purple">
              <span>Cumulative</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Glassy Search, Filter & View Controls */}
      <div className="projects-filter-console">
        <div className="filter-console-search">
          <Search size={17} className="search-field-icon" />
          <input
            type="text"
            placeholder="Search target by project name, URL, assigned security analysts..."
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
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="neo-select-input"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL_HIGH">🔴 Critical / High Risk</option>
              <option value="MEDIUM">🟡 Medium Risk</option>
              <option value="LOW">🔵 Low Risk</option>
              <option value="CLEAN">🟢 Clean / Hardened</option>
            </select>
          </div>

          <div className="neo-view-toggle-wrap">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid Card View"
            >
              <LayoutGrid size={15} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Dense Data Table View"
            >
              <List size={15} />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Content: Grid vs Table View */}
      {loading ? (
        <div className="projects-loading-state">
          <RefreshCw size={28} className="spin-icon" />
          <p>Loading Saved VAPT Assessment Registry...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="projects-empty-state">
          <div className="empty-state-icon">
            <FileSpreadsheet size={34} />
          </div>
          <h3>No Assessment Projects Found</h3>
          <p>Try clearing search keywords or changing risk filter options.</p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="neo-glass-btn primary"
            style={{ marginTop: '14px' }}
          >
            <Plus size={15} />
            <span>Provision New Target</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="projects-cards-grid">
          {filteredProjects.map((p) => {
            const crit = p.critical_count || 0;
            const high = p.high_count || 0;
            const med = p.medium_count || 0;
            const low = p.low_count || 0;
            const isCopied = copiedId === p.id;

            let riskClass = 'clean';
            if (crit > 0) riskClass = 'critical';
            else if (high > 0) riskClass = 'high';
            else if (med > 0) riskClass = 'medium';

            return (
              <div key={p.id} className={`project-glass-card risk-${riskClass}`}>
                <div className={`card-risk-top-stripe ${riskClass}`} />

                <div className="project-card-inner">
                  <div className="project-card-header-line">
                    <h3 className="project-card-title">{p.project_name}</h3>
                    <span className={`project-open-pill ${crit > 0 ? 'crit' : high > 0 ? 'high' : 'clean'}`}>
                      {p.open_count || 0} OPEN
                    </span>
                  </div>

                  {/* Target URL Pill */}
                  <div className="project-url-glass-pill">
                    <Globe size={13} className="url-globe-icon" />
                    <a
                      href={p.target_url.startsWith('http') ? p.target_url : `https://${p.target_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="url-anchor-text mono"
                    >
                      {p.target_url}
                    </a>
                    <div className="url-actions-right">
                      <button
                        type="button"
                        onClick={() => copyUrlToClipboard(p.target_url, p.id)}
                        className="url-mini-btn"
                        title={isCopied ? 'Copied URL!' : 'Copy Target URL'}
                      >
                        {isCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      </button>
                      <a
                        href={p.target_url.startsWith('http') ? p.target_url : `https://${p.target_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="url-mini-btn"
                        title="Open in new tab"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  {/* Meta Details */}
                  <div className="project-meta-list">
                    <div className="meta-line">
                      <span className="meta-label">Analysts:</span>
                      <span className="meta-value">{p.security_analysts || 'Unassigned'}</span>
                    </div>
                    <div className="meta-line">
                      <span className="meta-label">PM / Lead:</span>
                      <span className="meta-value">{p.project_managers || 'N/A'}</span>
                    </div>
                    <div className="meta-line">
                      <span className="meta-label">CISO / Dir:</span>
                      <span className="meta-value">{p.ciso_name || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Severity Breakdown Pills */}
                  <div className="project-sev-chips-row">
                    <span className={`sev-chip crit ${crit > 0 ? 'active' : ''}`}>{crit} CRIT</span>
                    <span className={`sev-chip high ${high > 0 ? 'active' : ''}`}>{high} HIGH</span>
                    <span className={`sev-chip med ${med > 0 ? 'active' : ''}`}>{med} MED</span>
                    <span className={`sev-chip low ${low > 0 ? 'active' : ''}`}>{low} LOW</span>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="project-card-footer">
                    <Link
                      to={`/generate-report?projectId=${p.id}`}
                      className="project-manage-btn"
                    >
                      <span>Manage Findings</span>
                      <ChevronRight size={14} />
                    </Link>

                    <a
                      href={`http://localhost:5000/api/reports/export/${p.id}`}
                      className="project-icon-action-btn excel"
                      title="Export Official Excel Workbook"
                    >
                      <FileSpreadsheet size={15} color="#10b981" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.project_name)}
                      className="project-icon-action-btn delete"
                      title="Delete Assessment & Findings"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="projects-table-glass-card">
          <div className="table-responsive-wrapper">
            <table className="neo-glass-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>TARGET PROJECT</th>
                  <th style={{ width: '25%' }}>ENDPOINT URL</th>
                  <th style={{ width: '22%' }}>GOVERNANCE TEAM</th>
                  <th style={{ width: '18%' }}>SEVERITY BREAKDOWN</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => {
                  const crit = p.critical_count || 0;
                  const high = p.high_count || 0;
                  const med = p.medium_count || 0;
                  const low = p.low_count || 0;
                  const isCopied = copiedId === p.id;

                  return (
                    <tr key={p.id} className="neo-table-row">
                      <td>
                        <div className="table-project-name-cell">
                          <span className="table-p-name">{p.project_name}</span>
                          <span className="table-p-date">
                            Created {new Date(p.created_at || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="table-url-cell">
                          <span className="mono table-url-text">{p.target_url}</span>
                          <button
                            type="button"
                            onClick={() => copyUrlToClipboard(p.target_url, p.id)}
                            className="url-mini-btn"
                            title="Copy URL"
                          >
                            {isCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      <td>
                        <div className="table-team-cell">
                          <span>👤 {p.security_analysts || 'Unassigned'}</span>
                          <span className="text-sub">PM: {p.project_managers || 'N/A'}</span>
                        </div>
                      </td>

                      <td>
                        <div className="table-sev-chips">
                          <span className={`sev-chip crit ${crit > 0 ? 'active' : ''}`}>{crit}C</span>
                          <span className={`sev-chip high ${high > 0 ? 'active' : ''}`}>{high}H</span>
                          <span className={`sev-chip med ${med > 0 ? 'active' : ''}`}>{med}M</span>
                          <span className={`sev-chip low ${low > 0 ? 'active' : ''}`}>{low}L</span>
                        </div>
                      </td>

                      <td>
                        <div className="table-actions-flex">
                          <Link
                            to={`/generate-report?projectId=${p.id}`}
                            className="neo-action-icon edit"
                            title="Manage Findings"
                          >
                            <ChevronRight size={14} />
                          </Link>
                          <a
                            href={`http://localhost:5000/api/reports/export/${p.id}`}
                            className="neo-action-icon"
                            title="Export Excel"
                          >
                            <FileSpreadsheet size={14} color="#10b981" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.project_name)}
                            className="neo-action-icon delete"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Provision New Target Assessment */}
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
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Provision New Target Assessment</h3>
                  <span className="modal-subtitle">
                    Register a new web application, portal, or API target for VAPT auditing
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

            <form onSubmit={handleCreate}>
              <div className="modal-glass-body">
                <div className="form-glass-grid">
                  <div className="glass-form-group full-width">
                    <label className="glass-form-label">Target Application / Project Name</label>
                    <div className="glass-input-wrapper">
                      <Shield size={15} className="glass-input-icon" />
                      <input
                        type="text"
                        placeholder="e.g. BISAG-N National GIS Portal"
                        value={formData.project_name}
                        onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                        required
                        className="glass-input-field"
                      />
                    </div>
                  </div>

                  <div className="glass-form-group full-width">
                    <label className="glass-form-label">Target Endpoint / URL</label>
                    <div className="glass-input-wrapper">
                      <Globe size={15} className="glass-input-icon" />
                      <input
                        type="text"
                        placeholder="e.g. https://portal.bisag.gov.in"
                        value={formData.target_url}
                        onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                        required
                        className="glass-input-field mono"
                      />
                    </div>
                  </div>

                  <div className="glass-form-group">
                    <label className="glass-form-label">Assigned Security Analysts</label>
                    <div className="glass-input-wrapper">
                      <UsersIcon size={15} className="glass-input-icon" />
                      <input
                        type="text"
                        placeholder="e.g. Nensi Borad, Ankit Nandaniya"
                        value={formData.security_analysts}
                        onChange={(e) => setFormData({ ...formData, security_analysts: e.target.value })}
                        className="glass-input-field"
                      />
                    </div>
                  </div>

                  <div className="glass-form-group">
                    <label className="glass-form-label">Concern Project Manager / Lead</label>
                    <div className="glass-input-wrapper">
                      <Building2 size={15} className="glass-input-icon" />
                      <input
                        type="text"
                        placeholder="e.g. Shri Rajesh Sharma"
                        value={formData.project_managers}
                        onChange={(e) => setFormData({ ...formData, project_managers: e.target.value })}
                        className="glass-input-field"
                      />
                    </div>
                  </div>

                  <div className="glass-form-group full-width">
                    <label className="glass-form-label">Additional Director / CISO Sponsor</label>
                    <div className="glass-input-wrapper">
                      <Award size={15} className="glass-input-icon" />
                      <input
                        type="text"
                        placeholder="e.g. Shri Krunal Patel (Additional Director)"
                        value={formData.ciso_name}
                        onChange={(e) => setFormData({ ...formData, ciso_name: e.target.value })}
                        className="glass-input-field"
                      />
                    </div>
                  </div>
                </div>
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
                  <span>Register & Initialize Assessment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
