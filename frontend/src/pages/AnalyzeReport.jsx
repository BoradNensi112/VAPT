import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Bug,
  Award,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
  Activity,
  Layers,
  FileSpreadsheet,
  RefreshCw,
  Globe,
  ExternalLink,
  ChevronDown,
  Lock,
  FileText,
  Sliders,
  Check,
  Zap,
  Cpu,
  ChevronRight,
  Copy,
  X,
  Download,
  BarChart3
} from 'lucide-react';
import api from '../services/api';
import { generateVaptPdfReport } from '../services/pdfExportService';
import '../styles/analyzeReport.css';

export default function AnalyzeReport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('projectId') || 'ALL');
  const [activeProject, setActiveProject] = useState(null);
  const [projectFindings, setProjectFindings] = useState([]);
  const [globalAnalytics, setGlobalAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Filter & Search State for Findings Explorer
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [expandedFindingId, setExpandedFindingId] = useState(null);

  // 1. Initial Load: Fetch Projects & Global Analytics
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [projRes, analyticsRes] = await Promise.all([
          api.get('/projects'),
          api.get('/reports/analytics')
        ]);

        if (projRes.data.success) {
          const list = projRes.data.projects || [];
          setProjects(list);
          const paramId = searchParams.get('projectId');
          if (paramId && list.some(p => String(p.id) === String(paramId))) {
            setSelectedProjectId(paramId);
          } else if (list.length > 0 && selectedProjectId === 'ALL') {
            setSelectedProjectId(String(list[0].id));
          }
        }

        if (analyticsRes.data.success) {
          setGlobalAnalytics(analyticsRes.data);
        }
      } catch (err) {
        console.error('Error loading analyzer data:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // 2. Load Selected Project Details when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId === 'ALL') {
      setActiveProject(null);
      return;
    }

    const loadProjectDetails = async () => {
      try {
        const res = await api.get(`/projects/${selectedProjectId}`);
        if (res.data.success) {
          setActiveProject(res.data.project);
          setProjectFindings(res.data.findings || []);
          if (res.data.findings && res.data.findings.length > 0) {
            setExpandedFindingId(res.data.findings[0].id);
          } else {
            setExpandedFindingId(null);
          }
        }
      } catch (err) {
        console.error('Error fetching project details:', err);
      }
    };

    loadProjectDetails();
  }, [selectedProjectId]);

  // Project Switch Handler
  const handleProjectSelect = (e) => {
    const val = e.target.value;
    setSelectedProjectId(val);
    if (val !== 'ALL') {
      setSearchParams({ projectId: val });
    } else {
      setSearchParams({});
    }
  };

  const copyTargetUrl = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleExportPdf = () => {
    if (!activeProject && selectedProjectId === 'ALL') {
      alert('Please select a specific project to export PDF.');
      return;
    }
    generateVaptPdfReport({
      project: activeProject || { project_name: 'Aggregated VAPT Portfolio' },
      findings: projectFindings,
      scopeType: 'Web Application VAPT',
      analysts: activeProject?.security_analysts ? activeProject.security_analysts.split(',').map(s => s.trim()) : []
    });
  };

  // 3. Computed Statistics
  const stats = useMemo(() => {
    if (selectedProjectId !== 'ALL' && activeProject) {
      const total = projectFindings.length;
      const crit = projectFindings.filter(f => f.severity === 'Critical').length;
      const high = projectFindings.filter(f => f.severity === 'High').length;
      const med = projectFindings.filter(f => f.severity === 'Medium').length;
      const low = projectFindings.filter(f => f.severity === 'Low').length;
      const open = projectFindings.filter(f => f.status === 'Open').length;
      const closed = projectFindings.filter(f => f.status === 'Closed').length;

      const penalty = crit * 25 + high * 15 + med * 5 + low * 2;
      let score = Math.max(10, 100 - penalty);
      if (total === 0) score = 98;

      let grade = 'A';
      if (score < 70) grade = 'B';
      if (score < 50) grade = 'C';
      if (score < 30) grade = 'F';

      let cvss = 0.0;
      if (crit > 0) cvss = Math.min(9.8, 8.5 + (crit - 1) * 0.4 + high * 0.2);
      else if (high > 0) cvss = Math.min(8.4, 7.0 + (high - 1) * 0.3 + med * 0.1);
      else if (med > 0) cvss = Math.min(6.5, 4.0 + (med - 1) * 0.2 + low * 0.1);
      else if (low > 0) cvss = 2.5;

      const complianceScore = Math.max(20, Math.min(100, 100 - open * 6));

      return {
        total,
        crit,
        high,
        med,
        low,
        open,
        closed,
        score,
        grade,
        cvss: cvss.toFixed(1),
        complianceScore,
        fixRate: total > 0 ? ((closed / total) * 100).toFixed(1) : '100.0'
      };
    }

    const gStats = globalAnalytics?.stats || {};
    const total = parseInt(gStats.total_findings || 0, 10);
    const crit = parseInt(gStats.critical || 0, 10);
    const high = parseInt(gStats.high || 0, 10);
    const med = parseInt(gStats.medium || 0, 10);
    const low = parseInt(gStats.low || 0, 10);
    const open = parseInt(gStats.open_findings || 0, 10);
    const closed = parseInt(gStats.closed_findings || 0, 10);

    const penalty = crit * 25 + high * 15 + med * 5 + low * 2;
    let score = Math.max(10, 100 - penalty);
    if (total === 0) score = 95;

    let grade = 'A';
    if (score < 70) grade = 'B';
    if (score < 50) grade = 'C';
    if (score < 30) grade = 'F';

    let cvss = 0.0;
    if (crit > 0) cvss = Math.min(9.8, 8.5 + (crit - 1) * 0.4 + high * 0.2);
    else if (high > 0) cvss = Math.min(8.4, 7.0 + (high - 1) * 0.3 + med * 0.1);
    else if (med > 0) cvss = Math.min(6.5, 4.0 + (med - 1) * 0.2 + low * 0.1);
    else if (low > 0) cvss = 2.5;

    return {
      total,
      crit,
      high,
      med,
      low,
      open,
      closed,
      score,
      grade,
      cvss: cvss.toFixed(1),
      complianceScore: 85,
      fixRate: total > 0 ? ((closed / total) * 100).toFixed(1) : '100.0'
    };
  }, [selectedProjectId, activeProject, projectFindings, globalAnalytics]);

  // OWASP Top 10 Distribution Stats
  const owaspStats = useMemo(() => {
    const list = [
      { id: 'A01', label: 'A01: Broken Access Control', count: 0, color: '#ef4444' },
      { id: 'A02', label: 'A02: Cryptographic Failures', count: 0, color: '#f97316' },
      { id: 'A03', label: 'A03: Injection (SQLi/XSS)', count: 0, color: '#e11d48' },
      { id: 'A04', label: 'A04: Insecure Design', count: 0, color: '#a855f7' },
      { id: 'A05', label: 'A05: Security Misconfiguration', count: 0, color: '#3b82f6' },
      { id: 'A06', label: 'A06: Vulnerable Components', count: 0, color: '#eab308' },
      { id: 'A07', label: 'A07: Identification & Auth', count: 0, color: '#06b6d4' },
      { id: 'A08', label: 'A08: Software/Data Integrity', count: 0, color: '#10b981' },
      { id: 'A09', label: 'A09: Logging & Monitoring', count: 0, color: '#64748b' },
      { id: 'A10', label: 'A10: SSRF Request Forgery', count: 0, color: '#d946ef' }
    ];

    projectFindings.forEach(f => {
      const cat = (f.owasp_category || f.owaspCategory || '').toUpperCase();
      const match = list.find(l => cat.includes(l.id));
      if (match) match.count++;
      else list[4].count++; // default to Misconfig
    });

    const maxCount = Math.max(1, ...list.map(l => l.count));
    return { list, maxCount };
  }, [projectFindings]);

  // Filtered Findings
  const filteredFindings = useMemo(() => {
    return projectFindings.filter((f) => {
      const matchSeverity =
        severityFilter === 'ALL' ||
        (severityFilter === 'OPEN' && f.status === 'Open') ||
        (severityFilter === 'CLOSED' && f.status === 'Closed') ||
        f.severity?.toUpperCase() === severityFilter;

      const q = searchQuery.toLowerCase();
      const matchQuery =
        !searchQuery ||
        f.vulnerability_name?.toLowerCase().includes(q) ||
        f.cwe_number?.toLowerCase().includes(q) ||
        f.owasp_category?.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.remediation?.toLowerCase().includes(q);

      return matchSeverity && matchQuery;
    });
  }, [projectFindings, severityFilter, searchQuery]);

  // Production Verdict
  const clearanceVerdict = useMemo(() => {
    if (stats.crit > 0) {
      return {
        label: 'BLOCK PRODUCTION',
        type: 'danger',
        desc: 'Critical security flaws identified. Immediate remediation required before release.'
      };
    }
    if (stats.high > 2) {
      return {
        label: 'BLOCK PRODUCTION',
        type: 'danger',
        desc: 'Multiple High-severity issues present. Deployment blocked by policy.'
      };
    }
    if (stats.high > 0 || stats.med > 3) {
      return {
        label: 'CONDITIONAL PASS',
        type: 'warning',
        desc: 'High/Medium issues found. Requires security team sign-off.'
      };
    }
    if (stats.open > 0) {
      return {
        label: 'ACCEPTABLE RISK',
        type: 'caution',
        desc: 'Medium/Low issues flagged. Staging deployment eligible.'
      };
    }
    return {
      label: 'CLEAR FOR PRODUCTION',
      type: 'success',
      desc: 'All security vulnerabilities resolved. Security compliance met.'
    };
  }, [stats]);

  return (
    <div className="page-wrapper analyze-page-wrapper">
      {/* 1. Header with Target Switcher */}
      <div className="analyze-hero-header">
        <div className="analyze-hero-left">
          <div className="analyze-neo-badge">
            <span className="neo-badge-pulse" />
            <ShieldCheck size={13} />
            <span>VAPT THREAT INTELLIGENCE & AUDIT ANALYZER</span>
          </div>
          <h1 className="analyze-hero-title">Security Posture & Threat Analytics</h1>
          <p className="analyze-hero-subtitle">
            Comprehensive posture telemetry, risk scoring, vulnerability mitigation roadmap, and CERT-In compliance verification.
          </p>
        </div>

        <div className="analyze-hero-actions">
          <div className="analyze-project-picker">
            <span className="picker-label">Target Audit Project</span>
            <div className="picker-select-wrapper">
              <Shield size={14} className="picker-icon" />
              <select
                className="picker-select-input"
                value={selectedProjectId}
                onChange={handleProjectSelect}
              >
                {projects.length === 0 && <option value="ALL">Loading Projects...</option>}
                {projects.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    VAPT-00{p.id}: {p.project_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedProjectId !== 'ALL' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportPdf}
                className="neo-glass-btn secondary"
                style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                title="Download Executive PDF VAPT Report"
              >
                <FileText size={15} />
                <span>Executive PDF</span>
              </button>

              <a
                href={`http://localhost:5000/api/reports/export/${selectedProjectId}`}
                className="neo-glass-btn primary"
                title="Download official Excel audit report"
              >
                <FileSpreadsheet size={15} />
                <span>Export Excel</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 2. 4 Clean KPI Metric Tiles */}
      <div className="analyze-kpi-grid">
        {/* Card 1: Overall Security Score */}
        <div className="analyze-kpi-card blue">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Security Posture Score</span>
            <div className="kpi-card-icon blue">
              <Award size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-large-value">{stats.score}%</span>
            <span className="kpi-badge-tag blue">Grade {stats.grade} Hardened</span>
          </div>
        </div>

        {/* Card 2: Peak CVSS Threat Vector */}
        <div className="analyze-kpi-card amber">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Peak CVSS Threat</span>
            <div className="kpi-card-icon amber">
              <Flame size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-large-value">
              {stats.cvss} <small className="kpi-sub-scale">/ 10</small>
            </span>
            <span className={`kpi-badge-tag ${stats.crit > 0 ? 'red' : 'amber'}`}>
              {stats.crit > 0 ? `${stats.crit} Critical` : stats.high > 0 ? `${stats.high} High` : 'Low Risk'}
            </span>
          </div>
        </div>

        {/* Card 3: Production Clearance Verdict */}
        <div className={`analyze-kpi-card ${clearanceVerdict.type === 'danger' ? 'red' : clearanceVerdict.type === 'success' ? 'green' : 'amber'}`}>
          <div className="kpi-card-header">
            <span className="kpi-card-label">Production Verdict</span>
            <div className={`kpi-card-icon ${clearanceVerdict.type === 'danger' ? 'red' : clearanceVerdict.type === 'success' ? 'green' : 'amber'}`}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-verdict-text">{clearanceVerdict.label}</span>
            <span className={`kpi-badge-tag ${clearanceVerdict.type === 'danger' ? 'red' : clearanceVerdict.type === 'success' ? 'green' : 'amber'}`}>
              {stats.open} Open Issues
            </span>
          </div>
        </div>

        {/* Card 4: Remediation Progress */}
        <div className="analyze-kpi-card green">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Remediation Rate</span>
            <div className="kpi-card-icon green">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-large-value">{stats.fixRate}%</span>
            <span className="kpi-badge-tag green">{stats.closed} of {stats.total} Closed</span>
          </div>
        </div>
      </div>

      {/* 3. Streamlined 2-Column Overview: Severity Distribution & Target Governance */}
      <div className="analyze-overview-split">
        {/* Left: Severity Breakdown */}
        <div className="analyze-overview-card">
          <div className="overview-card-header">
            <div className="header-title-flex">
              <Sliders size={16} className="title-icon cyan" />
              <h3>Vulnerability Severity Breakdown</h3>
            </div>
            <span className="overview-sub-count">{stats.total} Total Identified</span>
          </div>

          <div className="severity-stacked-bars">
            {/* Critical */}
            <div className="sev-row">
              <div className="sev-row-meta">
                <span className="sev-name crit">Critical Severity</span>
                <span className="sev-count">{stats.crit} ({stats.total > 0 ? ((stats.crit / stats.total) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="sev-track-bar">
                <div className="sev-fill-bar crit" style={{ width: `${stats.total > 0 ? (stats.crit / stats.total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* High */}
            <div className="sev-row">
              <div className="sev-row-meta">
                <span className="sev-name high">High Severity</span>
                <span className="sev-count">{stats.high} ({stats.total > 0 ? ((stats.high / stats.total) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="sev-track-bar">
                <div className="sev-fill-bar high" style={{ width: `${stats.total > 0 ? (stats.high / stats.total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Medium */}
            <div className="sev-row">
              <div className="sev-row-meta">
                <span className="sev-name med">Medium Severity</span>
                <span className="sev-count">{stats.med} ({stats.total > 0 ? ((stats.med / stats.total) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="sev-track-bar">
                <div className="sev-fill-bar med" style={{ width: `${stats.total > 0 ? (stats.med / stats.total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Low */}
            <div className="sev-row">
              <div className="sev-row-meta">
                <span className="sev-name low">Low Severity</span>
                <span className="sev-count">{stats.low} ({stats.total > 0 ? ((stats.low / stats.total) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="sev-track-bar">
                <div className="sev-fill-bar low" style={{ width: `${stats.total > 0 ? (stats.low / stats.total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Target Governance & Compliance Details */}
        <div className="analyze-overview-card">
          <div className="overview-card-header">
            <div className="header-title-flex">
              <ShieldCheck size={16} className="title-icon green" />
              <h3>Target Governance & Scope</h3>
            </div>
            <span className="overview-badge-standard">Form BISAG-SD/FR-207</span>
          </div>

          <div className="governance-details-list">
            {/* Target URL */}
            <div className="gov-item">
              <span className="gov-label">Target Endpoint</span>
              <div className="gov-url-line">
                <Globe size={13} className="gov-globe" />
                <span className="gov-url mono" title={activeProject?.target_url || 'All Targets'}>
                  {activeProject?.target_url || 'All Registered Audit Targets'}
                </span>
                {activeProject?.target_url && (
                  <button
                    type="button"
                    onClick={() => copyTargetUrl(activeProject.target_url)}
                    className="gov-copy-btn"
                    title={copiedUrl ? 'Copied!' : 'Copy URL'}
                  >
                    {copiedUrl ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>

            {/* Personnel & CISO */}
            <div className="gov-grid-meta">
              <div className="gov-meta-cell">
                <span className="gov-label">Lead Analysts</span>
                <span className="gov-val">{activeProject?.security_analysts || 'Unassigned'}</span>
              </div>
              <div className="gov-meta-cell">
                <span className="gov-label">Division / PM</span>
                <span className="gov-val">{activeProject?.project_managers || 'Software Division'}</span>
              </div>
            </div>

            {/* Compliance Matrix Strip */}
            <div className="compliance-chips-strip">
              <div className="comp-badge-item">
                <span className="comp-dot green" />
                <span>CERT-In Guidelines: <strong>{stats.crit === 0 ? 'Aligned' : 'Action Required'}</strong></span>
              </div>
              <div className="comp-badge-item">
                <span className="comp-dot cyan" />
                <span>OWASP ASVS: <strong>{stats.complianceScore}% Compliant</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. OWASP TOP 10 ATTACK SURFACE DISTRIBUTION */}
      <div className="analyze-overview-card" style={{ marginTop: '20px' }}>
        <div className="overview-card-header">
          <div className="header-title-flex">
            <BarChart3 size={16} className="title-icon cyan" />
            <h3>OWASP Top 10 Attack Surface Distribution</h3>
          </div>
          <span className="overview-sub-count">OWASP 2021 Benchmark</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '10px' }}>
          {owaspStats.list.map(cat => (
            <div key={cat.id} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{cat.label}</span>
                <span style={{ fontWeight: 800, color: cat.count > 0 ? cat.color : 'var(--text-muted)' }}>
                  {cat.count} finding(s)
                </span>
              </div>
              <div style={{ height: '5px', background: 'var(--bg-pill)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(cat.count / owaspStats.maxCount) * 100}%`,
                  background: cat.color,
                  borderRadius: '3px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Streamlined Vulnerability Findings Explorer */}
      <div className="findings-explorer-card" style={{ marginTop: '20px' }}>
        <div className="explorer-top-bar">
          <div className="explorer-title-area">
            <h2 className="explorer-main-title">Detailed Vulnerability Findings</h2>
            <span className="explorer-count-badge">
              {filteredFindings.length} of {projectFindings.length} Findings
            </span>
          </div>

          {/* Search and Severity Filter Pills */}
          <div className="explorer-filter-controls">
            <div className="explorer-search-box">
              <Search size={15} className="explorer-search-icon" />
              <input
                type="text"
                placeholder="Search by vulnerability, CWE, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="explorer-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="search-clear-mini-btn"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="explorer-filter-chips-row">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'OPEN', 'CLOSED'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`explorer-pill-btn ${severityFilter === f ? 'active' : ''}`}
                  onClick={() => setSeverityFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Findings Accordion List */}
        <div className="findings-accordion-deck">
          {loading ? (
            <div className="findings-empty-notice">
              <RefreshCw size={24} className="spin-icon" />
              <span>Loading vulnerability telemetry...</span>
            </div>
          ) : filteredFindings.length === 0 ? (
            <div className="findings-empty-notice">
              <ShieldCheck size={32} />
              <h4>No Vulnerability Findings Found</h4>
              <p>No issues matched your selected severity filter or search keyword.</p>
            </div>
          ) : (
            filteredFindings.map((f, idx) => {
              const isOpen = expandedFindingId === f.id;
              const sev = f.severity?.toLowerCase() || 'low';

              return (
                <div key={f.id || idx} className={`finding-glass-row ${isOpen ? 'expanded' : ''}`}>
                  {/* Collapsed Header */}
                  <div
                    className="finding-row-header"
                    onClick={() => setExpandedFindingId(isOpen ? null : f.id)}
                  >
                    <div className="finding-header-left">
                      <span className="finding-num-tag">#{String(idx + 1).padStart(2, '0')}</span>
                      <span className={`finding-sev-pill ${sev}`}>{f.severity}</span>
                      <div className="finding-title-group">
                        <span className="finding-vuln-name">{f.vulnerability_name}</span>
                        <div className="finding-tags-inline">
                          <span>{f.owasp_category || 'OWASP Top 10'}</span>
                          <span className="dot-sep">•</span>
                          <span className="cwe-pill">{f.cwe_number || 'CWE'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="finding-header-right">
                      <span className={`status-pill ${f.status === 'Closed' ? 'closed' : 'open'}`}>
                        {f.status || 'Open'}
                      </span>
                      <ChevronDown size={17} className={`expand-chevron ${isOpen ? 'rotated' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Body Details */}
                  {isOpen && (
                    <div className="finding-expanded-content">
                      <div className="finding-details-grid">
                        {/* 1. Description */}
                        <div className="detail-section-block">
                          <span className="section-label">
                            <FileText size={13} /> Vulnerability Impact & Description
                          </span>
                          <div className="section-text-box">
                            {f.description || 'No detailed description available.'}
                          </div>
                        </div>

                        {/* 2. Steps to Reproduce */}
                        <div className="detail-section-block">
                          <span className="section-label amber">
                            <Zap size={13} /> Proof of Concept (PoC Reproduction)
                          </span>
                          <div className="section-text-box mono">
                            {f.steps_to_reproduce || '1. Intercept target request in security proxy.\n2. Replay with test payload.'}
                          </div>
                        </div>

                        {/* 3. Developer Remediation */}
                        <div className="detail-section-block full-col">
                          <span className="section-label green">
                            <CheckCircle2 size={13} /> Recommended Developer Remediation
                          </span>
                          <div className="section-text-box remediation">
                            {f.remediation || '1. Enforce strict input validation & output encoding.\n2. Apply defense-in-depth security controls.'}
                          </div>
                        </div>
                      </div>

                      {/* Footer Advisory Links */}
                      <div className="finding-footer-links">
                        <span className="reference-text">
                          Ref: <strong>{f.reference || f.vulnerability_name}</strong>
                        </span>
                        <div className="advisory-btn-links">
                          {f.cwe_url && (
                            <a
                              href={f.cwe_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="advisory-link-pill"
                            >
                              MITRE {f.cwe_number || 'CWE'} <ExternalLink size={11} />
                            </a>
                          )}
                          <a
                            href="https://owasp.org/www-project-top-ten/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="advisory-link-pill"
                          >
                            OWASP Top 10 <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. Bottom Navigation Actions */}
      <div className="analyze-footer-actions">
        <button
          type="button"
          onClick={() => navigate('/compare-reports')}
          className="neo-glass-btn secondary"
        >
          <Activity size={15} />
          <span>Compare Audit Cycles</span>
        </button>

        {selectedProjectId !== 'ALL' && (
          <button
            type="button"
            onClick={() => navigate(`/generate-report?projectId=${selectedProjectId}`)}
            className="neo-glass-btn secondary"
          >
            <Sliders size={15} />
            <span>Edit in Generator</span>
          </button>
        )}
      </div>
    </div>
  );
}
