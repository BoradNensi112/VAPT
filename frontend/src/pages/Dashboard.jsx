import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Plus,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Activity,
  Terminal,
  Layers,
  Lock,
  Radio,
  FileSpreadsheet,
  RefreshCw,
  Cpu,
  Zap,
  Globe,
  Database,
  Calendar,
  ChevronRight,
  Filter,
  X,
  FileCode,
  Scan,
  CheckSquare,
  PieChart
} from 'lucide-react';
import HolographicShield from '../components/HolographicShield';
import api from '../services/api';
import { downloadVaptExcelReport } from '../services/excelExportService';
import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  // Filters & State
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTable, setSearchTable] = useState('');
  const [donutHover, setDonutHover] = useState(null);
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState('Just now');

  // Timeline Daily Date Filter State
  const [timelineDateFilter, setTimelineDateFilter] = useState('ALL');
  const [customDateInput, setCustomDateInput] = useState('');

  // New VAPT Assessment Modal State
  const [showNewAssessmentModal, setShowNewAssessmentModal] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    project_name: '',
    target_url: '',
    security_analysts: 'BISAG-N Security Analyst',
    project_managers: 'BISAG-N Project Lead',
    ciso_name: 'Additional Director / CISO',
    remarks: 'Automated VAPT Security Assessment Project'
  });

  // Dynamic Dashboard Data State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLiveScanning(true);
      const res = await api.get('/reports/analytics');
      if (res && res.data && res.data.success) {
        setAnalyticsData(res.data);
        setLastScanTime('Just now');
      }
    } catch (err) {
      console.error('Error fetching dynamic analytics:', err);
    } finally {
      setIsLiveScanning(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = analyticsData?.stats || {};
  const totalFindings = parseInt(stats.total_findings || 0, 10) || 0;
  const criticalCount = parseInt(stats.critical || 0, 10) || 0;
  const highCount = parseInt(stats.high || 0, 10) || 0;
  const mediumCount = parseInt(stats.medium || 0, 10) || 0;
  const lowCount = parseInt(stats.low || 0, 10) || 0;
  const openCount = parseInt(stats.open || 0, 10) || 0;
  const closedCount = parseInt(stats.closed || 0, 10) || 0;
  const totalProjects = parseInt(stats.total_projects || 0, 10) || 0;
  const fixRate = stats.fix_rate !== undefined ? String(stats.fix_rate) : '0.0';
  const threatScore = parseInt(analyticsData?.threatScore || 85, 10) || 85;
  const grade = String(analyticsData?.grade || 'A');
  const healthColor = threatScore >= 80 ? '#10b981' : threatScore >= 50 ? '#f59e0b' : '#ef4444';
  const healthStatusLabel = threatScore >= 80 ? 'Optimal Posture' : threatScore >= 50 ? 'Elevated Risk' : 'Critical Exposure';

  // Date Strings for Today & Yesterday
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const yesterdayDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const handleExportAssessmentExcel = async (a) => {
    try {
      const res = await api.get(`/projects/${a.projectId}`);
      const projData = res.data?.project || { project_name: a.name, target_url: a.target, security_analysts: a.analyst };
      const findings = res.data?.findings || [];
      await downloadVaptExcelReport({
        project: projData,
        findings,
        assessmentDate: projData.created_at
      });
    } catch (err) {
      console.error('Dashboard export error:', err);
      alert('Failed to export Excel report.');
    }
  };

  // Handle Creating New Assessment
  const handleCreateAssessment = async (e, nextAction = 'save') => {
    if (e) e.preventDefault();
    if (!newProjectForm.project_name.trim() || !newProjectForm.target_url.trim()) {
      alert('Please enter both Project Name and Target URL.');
      return;
    }

    try {
      setIsSubmittingProject(true);
      const res = await api.post('/projects', newProjectForm);
      if (res && res.data && res.data.success) {
        setShowNewAssessmentModal(false);
        const targetUrl = newProjectForm.target_url;
        setNewProjectForm({
          project_name: '',
          target_url: '',
          security_analysts: 'BISAG-N Security Analyst',
          project_managers: 'BISAG-N Project Lead',
          ciso_name: 'Additional Director / CISO',
          remarks: 'Automated VAPT Security Assessment Project'
        });
        await fetchDashboardData();

        if (nextAction === 'scan') {
          navigate('/security-tools');
        } else if (nextAction === 'checklist') {
          navigate('/checklist');
        } else if (nextAction === 'report') {
          navigate('/generate-report');
        }
      }
    } catch (err) {
      console.error('Error creating assessment:', err);
      alert(err.response?.data?.message || 'Failed to create assessment project.');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  // 4 Primary Dynamic KPI Cards (100% Calculated from Live Database)
  const primaryKpis = [
    {
      id: 'assessments',
      label: 'TOTAL ASSESSMENTS',
      val: String(totalProjects),
      trend: totalProjects > 0 ? `${totalProjects} Active Target(s)` : 'Awaiting Targets',
      trendIcon: TrendingUp,
      icon: Layers,
      color: '#3b82f6',
      subText: `${totalProjects} Targets Registered in Portal`,
      badge: 'Active'
    },
    {
      id: 'active_vulns',
      label: 'ACTIVE VULNERABILITIES',
      val: String(openCount),
      trend: criticalCount > 0 ? `${criticalCount} Critical Flaws` : 'Standard Posture',
      trendIcon: openCount > 0 ? AlertTriangle : CheckCircle2,
      icon: Flame,
      color: openCount > 0 ? '#ef4444' : '#10b981',
      subText: `${criticalCount} Crit • ${highCount} High • ${mediumCount} Med • ${lowCount} Low`,
      badge: openCount > 0 ? 'Requires Action' : 'Secure'
    },
    {
      id: 'remediation',
      label: 'REMEDIATION FIX RATE',
      val: `${fixRate}%`,
      trend: `${closedCount} Verified Patches`,
      trendIcon: TrendingUp,
      icon: CheckCircle2,
      color: '#10b981',
      subText: `${closedCount} of ${totalFindings} Total Findings Resolved`,
      badge: 'Performance'
    },
    {
      id: 'posture_score',
      label: 'OVERALL SECURITY SCORE',
      val: `${threatScore}%`,
      trend: `Grade ${grade} Hardened`,
      trendIcon: Award,
      icon: Award,
      color: '#6366f1',
      subText: 'MeitY / BISAG-N SOC Posture',
      badge: `DEFCON ${threatScore > 80 ? '4' : threatScore > 50 ? '3' : '2'}`
    }
  ];

  // Dynamic Severity Distribution
  const severityDist = useMemo(() => {
    const total = Math.max(totalFindings, 1);
    return [
      {
        id: 'critical',
        label: 'Critical',
        count: criticalCount,
        pct: ((criticalCount / total) * 100).toFixed(1),
        color: '#ef4444',
        cvss: 'CVSS 9.0–10.0',
        icon: Flame,
        badgeText: 'Urgent Patch'
      },
      {
        id: 'high',
        label: 'High',
        count: highCount,
        pct: ((highCount / total) * 100).toFixed(1),
        color: '#f97316',
        cvss: 'CVSS 7.0–8.9',
        icon: ShieldAlert,
        badgeText: 'Priority Fix'
      },
      {
        id: 'medium',
        label: 'Medium',
        count: mediumCount,
        pct: ((mediumCount / total) * 100).toFixed(1),
        color: '#f59e0b',
        cvss: 'CVSS 4.0–6.9',
        icon: AlertTriangle,
        badgeText: 'Standard Triage'
      },
      {
        id: 'low',
        label: 'Low',
        count: lowCount,
        pct: ((lowCount / total) * 100).toFixed(1),
        color: '#3b82f6',
        cvss: 'CVSS 0.1–3.9',
        icon: CheckCircle2,
        badgeText: 'Hardening'
      }
    ];
  }, [totalFindings, criticalCount, highCount, mediumCount, lowCount]);

  // Dynamic OWASP Top 10 telemetry from DB
  const owaspData = useMemo(() => {
    const list = analyticsData?.owaspBreakdown || [];
    const colors = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    if (!Array.isArray(list) || list.length === 0) {
      return [
        { code: 'A03:2021', name: 'Injection (XSS/SQLi)', count: 0, pct: 0, color: '#ef4444' },
        { code: 'A05:2021', name: 'Security Misconfiguration', count: 0, pct: 0, color: '#3b82f6' },
        { code: 'A01:2021', name: 'Broken Access Control', count: 0, pct: 0, color: '#f97316' }
      ];
    }
    return list.map((item, idx) => {
      const catStr = String(item.owasp_category || '');
      const code = catStr.split('–')[0].split('-')[0].trim() || `A0${idx + 1}:2021`;
      const count = parseInt(item.count || 0, 10) || 0;
      return {
        code,
        name: catStr || 'Vulnerability Flaw',
        count,
        pct: totalFindings > 0 ? (count / totalFindings) * 100 : 0,
        color: colors[idx % colors.length]
      };
    });
  }, [analyticsData, totalFindings]);

  // Dynamic CWE Categories from DB with enriched weakness details
  const cweData = useMemo(() => {
    const list = analyticsData?.cweBreakdown || [];
    const colors = ['#ef4444', '#f97316', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899'];
    const descriptions = {
      'CWE-319': { name: 'Cleartext Transmission of Sensitive Information', mitigation: 'Enforce HTTPS, TLS 1.3 & HSTS header', severity: 'High' },
      'CWE-942': { name: 'Permissive CORS Policy', mitigation: 'Restrict Access-Control-Allow-Origin to trusted domains', severity: 'Medium' },
      'CWE-79': { name: 'Cross-Site Scripting (XSS)', mitigation: 'Contextual Output Encoding & strict CSP headers', severity: 'High' },
      'CWE-89': { name: 'SQL Injection (SQLi)', mitigation: 'Parameterized queries & prepared statements', severity: 'Critical' },
      'CWE-1021': { name: 'Clickjacking (UI Redress)', mitigation: 'X-Frame-Options: DENY & frame-ancestors CSP', severity: 'Medium' },
      'CWE-352': { name: 'Cross-Site Request Forgery (CSRF)', mitigation: 'Anti-CSRF tokens & SameSite=Strict cookies', severity: 'High' },
      'CWE-200': { name: 'Exposure of Sensitive Information', mitigation: 'Strict access control & header obfuscation', severity: 'Medium' },
      'CWE-22': { name: 'Path Traversal / Arbitrary File Read', mitigation: 'Input validation & chroot path normalization', severity: 'High' },
      'CWE-639': { name: 'Insecure Direct Object References (IDOR)', mitigation: 'Enforce object-level access authorization', severity: 'High' },
      'CWE-522': { name: 'Insufficiently Protected Credentials', mitigation: 'Strong bcrypt hashing & secure secret management', severity: 'Critical' },
      'CWE-287': { name: 'Improper Authentication', mitigation: 'MFA enforcement & secure session validation', severity: 'High' },
      'CWE-384': { name: 'Session Fixation', mitigation: 'Regenerate session tokens on privilege change', severity: 'Medium' }
    };

    if (!Array.isArray(list) || list.length === 0) {
      return [
        { code: 'CWE-319', name: 'Cleartext Transmission of Sensitive Info', count: 0, pct: '0.0', color: '#ef4444', mitigation: 'Enforce HTTPS & TLS 1.3', severity: 'High' },
        { code: 'CWE-942', name: 'Permissive CORS Policy', count: 0, pct: '0.0', color: '#3b82f6', mitigation: 'Restrict Allowed Origins', severity: 'Medium' },
        { code: 'CWE-79', name: 'Cross-Site Scripting (XSS)', count: 0, pct: '0.0', color: '#f97316', mitigation: 'Contextual Output Encoding', severity: 'High' },
        { code: 'CWE-89', name: 'SQL Injection (SQLi)', count: 0, pct: '0.0', color: '#f59e0b', mitigation: 'Parameterized Queries', severity: 'Critical' }
      ];
    }
    return list.map((item, idx) => {
      const code = item.cwe_number || `CWE-${idx + 1}`;
      const count = parseInt(item.count || 0, 10) || 0;
      const meta = descriptions[code] || { name: item.name || code, mitigation: 'Review source code logic & apply sanitization', severity: 'Medium' };
      return {
        code,
        name: meta.name,
        count,
        pct: totalFindings > 0 ? ((count / totalFindings) * 100).toFixed(1) : '0.0',
        color: colors[idx % colors.length],
        mitigation: meta.mitigation,
        severity: meta.severity
      };
    });
  }, [analyticsData, totalFindings]);

  // Dynamic Recent Projects Table
  const rawAssessments = useMemo(() => {
    const list = analyticsData?.recentProjects || [];
    if (!Array.isArray(list)) return [];
    return list.map(p => {
      const totalF = parseInt(p.total_findings || 0, 10) || 0;
      const closedF = parseInt(p.closed_count || 0, 10) || 0;
      const targetStr = String(p.target_url || '');
      const nameStr = String(p.project_name || 'Assessment Project');
      const analystStr = String(p.security_analysts || 'Unassigned');
      const critF = parseInt(p.crit || 0, 10) || 0;
      const highF = parseInt(p.high || 0, 10) || 0;
      const medF = parseInt(p.med || 0, 10) || 0;
      const lowF = parseInt(p.low || 0, 10) || 0;

      return {
        id: `VAPT-2026-00${p.id || '1'}`,
        projectId: p.id,
        name: nameStr,
        client: 'BISAG-N / MeitY',
        dept: 'Software',
        target: targetStr || 'https://target.gov.in',
        type: targetStr.toLowerCase().endsWith('.apk') ? 'Android APK' : 'Web Application',
        analyst: analystStr,
        status: totalF === 0 ? 'Verified' : 'In Progress',
        crit: critF,
        high: highF,
        med: medF,
        low: lowF,
        progress: totalF > 0 ? Math.round((closedF / totalF) * 100) : 100
      };
    });
  }, [analyticsData]);

  // Filtered Table Data
  const filteredAssessments = useMemo(() => {
    const q = (searchTable || '').toLowerCase().trim();
    return rawAssessments.filter(item => {
      const matchDept = selectedDept === 'ALL' || item.dept === selectedDept;
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      const matchSearch =
        !q ||
        (item.name || '').toLowerCase().includes(q) ||
        (item.target || '').toLowerCase().includes(q) ||
        (item.analyst || '').toLowerCase().includes(q);

      return matchDept && matchStatus && matchSearch;
    });
  }, [selectedDept, selectedStatus, searchTable, rawAssessments]);

  // Date-Grouped & Daily-Filterable Timeline Events
  const groupedTimelineLogs = useMemo(() => {
    const rawList = analyticsData?.activityLogs || [];
    if (!Array.isArray(rawList) || rawList.length === 0) {
      return [{
        dateKey: 'Today',
        dateLabel: 'Today (Initial Node)',
        events: [{
          id: 'init-1',
          type: 'info',
          icon: ShieldCheck,
          title: 'System Initialized & Secured',
          target: 'BISAG-N PostgreSQL Node Active',
          time: 'Just now',
          color: '#10b981'
        }]
      }];
    }

    // Map each log
    const mapped = rawList.map((log, idx) => {
      let color = '#3b82f6';
      let Icon = Activity;
      const act = String(log.action || '');
      if (act.includes('Login')) { color = '#10b981'; Icon = ShieldCheck; }
      else if (act.includes('Checklist')) { color = '#8b5cf6'; Icon = CheckCircle2; }
      else if (act.includes('Finding')) { color = '#f97316'; Icon = Flame; }
      else if (act.includes('Headers') || act.includes('Scan') || act.includes('Recon') || act.includes('SSL') || act.includes('CORS') || act.includes('Probe') || act.includes('Port') || act.includes('DNS') || act.includes('Tool')) { color = '#06b6d4'; Icon = Terminal; }
      else if (act.includes('Report') || act.includes('Export') || act.includes('Comparison')) { color = '#f59e0b'; Icon = FileSpreadsheet; }
      else if (act.includes('Created') || act.includes('Registered') || act.includes('Project')) { color = '#3b82f6'; Icon = Layers; }
      else if (act.includes('Deleted')) { color = '#ef4444'; Icon = AlertTriangle; }
      else if (act.includes('Knowledge')) { color = '#ec4899'; Icon = Database; }
      else if (act.includes('User')) { color = '#a855f7'; Icon = Lock; }
      else if (act.includes('Analyst')) { color = '#0284c7'; Icon = Shield; }

      let dateKey = todayDateStr;
      let timeFormatted = 'Just now';

      if (log.timestamp) {
        try {
          const d = new Date(log.timestamp);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            dateKey = `${y}-${m}-${day}`;
            timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
        } catch (_) {}
      }

      return {
        id: log.id || `log-${idx}`,
        title: `${act} (${log.username || 'User'})`,
        target: log.details || 'System audit action executed',
        action: act,
        time: timeFormatted,
        dateKey,
        color,
        icon: Icon
      };
    });

    // Filter by selected date
    let filtered = mapped;
    if (timelineDateFilter === 'TODAY') {
      filtered = mapped.filter(e => e.dateKey === todayDateStr);
    } else if (timelineDateFilter === 'YESTERDAY') {
      filtered = mapped.filter(e => e.dateKey === yesterdayDateStr);
    } else if (timelineDateFilter !== 'ALL' && timelineDateFilter.includes('-')) {
      filtered = mapped.filter(e => e.dateKey === timelineDateFilter);
    }

    // Group by Date
    const groupsMap = new Map();
    filtered.forEach(item => {
      if (!groupsMap.has(item.dateKey)) {
        let label = item.dateKey;
        if (item.dateKey === todayDateStr) {
          label = `Today — ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        } else if (item.dateKey === yesterdayDateStr) {
          label = `Yesterday — ${new Date(Date.now() - 86400000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        } else {
          try {
            const parts = item.dateKey.split('-');
            const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
          } catch (_) {}
        }
        groupsMap.set(item.dateKey, { dateKey: item.dateKey, dateLabel: label, events: [] });
      }
      groupsMap.get(item.dateKey).events.push(item);
    });

    return Array.from(groupsMap.values());
  }, [analyticsData, timelineDateFilter, todayDateStr, yesterdayDateStr]);

  // Total count of filtered timeline logs
  const totalTimelineEventsCount = useMemo(() => {
    return groupedTimelineLogs.reduce((acc, g) => acc + g.events.length, 0);
  }, [groupedTimelineLogs]);

  return (
    <div className="page-wrapper soc-dashboard-canvas">
      {/* =========================================================
          1. HERO COMMAND HEADER (Clean & Executive Layout)
          ========================================================= */}
      <div className="soc-hero-panel">
        <div className="soc-hero-left">
          <h1 className="soc-hero-title">Security Posture Dashboard</h1>
          <p className="soc-hero-subtitle">
            Real-time vulnerability metrics, threat telemetry, and VAPT assessment monitoring.
          </p>
        </div>

        <div className="soc-hero-right">
          <button
            onClick={fetchDashboardData}
            className="soc-btn-outline"
            disabled={isLiveScanning}
            title="Refresh Live Telemetry from Database"
          >
            <RefreshCw size={14} className={isLiveScanning ? 'spin-anim' : ''} />
            <span>{isLiveScanning ? 'Syncing...' : 'Live Sync'}</span>
          </button>

          <button
            onClick={() => setShowNewAssessmentModal(true)}
            className="soc-btn-primary"
            title="Start New VAPT Assessment"
          >
            <Plus size={15} />
            <span>New VAPT Assessment</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          2. 4 PROMINENT & SPACIOUS KPI CARDS (Live Data & Cohesive Styling)
          ========================================================= */}
      <div className="soc-kpi-grid-4">
        {primaryKpis.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="soc-kpi-card-modern">
              <div className="kpi-modern-header">
                <span className="kpi-label-text">{item.label}</span>
                <div className="kpi-icon-pill" style={{ color: item.color, background: `${item.color}15` }}>
                  <Icon size={18} />
                </div>
              </div>

              <div className="kpi-value-row">
                <div className="kpi-value-text">{item.val}</div>
                <span className="kpi-trend-pill" style={{ color: item.color, background: `${item.color}12`, borderColor: `${item.color}35` }}>
                  {item.trend}
                </span>
              </div>

              <div className="kpi-subtext-footer">{item.subText}</div>
            </div>
          );
        })}
      </div>

      {/* =========================================================
          3. CENTERPIECE: 3D HOLOGRAPHIC SHIELD & THREAT INTELLIGENCE MATRIX
          ========================================================= */}
      <div className="soc-centerpiece-grid">
        {/* Left: Holographic 3D Security Posture Shield */}
        <div className="soc-panel shield-feature-panel">
          <div className="panel-header-simple">
            <div>
              <h3>Enterprise Security Posture Core</h3>
              <p>Continuous dynamic risk calculation & hardening telemetry.</p>
            </div>
            <div className="panel-badge-glow">{threatScore > 80 ? 'DEFCON 4 / OPTIMAL' : 'DEFCON 3 / ACTIVE'}</div>
          </div>

          <HolographicShield score={threatScore} grade={grade} assets={totalProjects} threatLevel={criticalCount > 0 ? 'CRITICAL' : 'SECURE'} />
        </div>

        {/* Right: Live Threat Intelligence & Assessment Status Matrix */}
        <div className="soc-panel threat-intel-panel">
          <div className="panel-header-simple">
            <div className="panel-header-title-wrap">
              <div className="panel-title-icon-wrap" style={{ color: healthColor, background: `${healthColor}15` }}>
                <Radio size={17} />
              </div>
              <div>
                <h3>Live Threat Intelligence & Telemetry</h3>
                <p>Active security signals monitored across government endpoints.</p>
              </div>
            </div>
            <div className="threat-health-tag" style={{ color: healthColor, background: `${healthColor}12`, borderColor: `${healthColor}35` }}>
              <span className="pulse-dot-dynamic" style={{ background: healthColor, boxShadow: `0 0 8px ${healthColor}` }} />
              <span>{threatScore}% Health • {healthStatusLabel}</span>
            </div>
          </div>

          {/* Threat Metric Counters Grid */}
          <div className="threat-matrix-grid">
            {/* Card 1: Active Threat Vectors */}
            <div className="threat-matrix-cell card-threat-vectors">
              <div className="matrix-cell-top">
                <span className="matrix-cell-label">ACTIVE THREAT VECTORS</span>
                <span className="matrix-status-chip chip-threat" style={{ color: openCount > 0 ? '#ef4444' : '#10b981', background: openCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)' }}>
                  {openCount > 0 ? 'Action Required' : 'Zero Threats'}
                </span>
              </div>
              <div className="matrix-cell-val" style={{ color: openCount > 0 ? '#ef4444' : '#10b981' }}>
                <div className="matrix-icon-badge" style={{ background: openCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: openCount > 0 ? '#ef4444' : '#10b981' }}>
                  <Flame size={18} />
                </div>
                <span>{String(openCount).padStart(2, '0')} DETECTED</span>
              </div>
              <div className="matrix-cell-breakdown">
                {criticalCount > 0 && <span className="crit-chip">{criticalCount} Crit</span>}
                {highCount > 0 && <span className="high-chip">{highCount} High</span>}
                {mediumCount > 0 && <span className="med-chip">{mediumCount} Med</span>}
                {lowCount > 0 && <span className="low-chip">{lowCount} Low</span>}
                {openCount === 0 && <span className="clean-chip">All Targets Hardened</span>}
              </div>
            </div>

            {/* Card 2: Monitored Targets */}
            <div className="threat-matrix-cell card-monitored-targets">
              <div className="matrix-cell-top">
                <span className="matrix-cell-label">MONITORED TARGETS</span>
                <span className="matrix-status-chip" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.12)' }}>
                  Active Scope
                </span>
              </div>
              <div className="matrix-cell-val" style={{ color: '#3b82f6' }}>
                <div className="matrix-icon-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                  <Globe size={18} />
                </div>
                <span>{String(totalProjects).padStart(2, '0')} SERVICES</span>
              </div>
              <div className="matrix-cell-breakdown">
                <span className="target-scope-tag">Web Apps & Mobile APKs</span>
              </div>
            </div>

            {/* Card 3: Total Findings Reported */}
            <div className="threat-matrix-cell card-findings-total">
              <div className="matrix-cell-top">
                <span className="matrix-cell-label">TOTAL FINDINGS REPORTED</span>
                <span className="matrix-status-chip" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)' }}>
                  Audit Scope
                </span>
              </div>
              <div className="matrix-cell-val" style={{ color: '#10b981' }}>
                <div className="matrix-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <Cpu size={18} />
                </div>
                <span>{String(totalFindings).padStart(2, '0')} AUDIT ITEMS</span>
              </div>
              <div className="matrix-cell-breakdown">
                <span className="patch-chip">{closedCount} Remediated</span>
                <span className="open-chip-sub">• {openCount} Pending</span>
              </div>
            </div>

            {/* Card 4: Last Scan Timestamp */}
            <div className="threat-matrix-cell card-telemetry-sync">
              <div className="matrix-cell-top">
                <span className="matrix-cell-label">LAST SCAN TIMESTAMP</span>
                <span className="matrix-status-chip" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}>
                  Live Sentinel
                </span>
              </div>
              <div className="matrix-cell-val" style={{ color: '#f59e0b' }}>
                <div className="matrix-icon-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  <Clock size={18} />
                </div>
                <span>{lastScanTime}</span>
              </div>
              <div className="matrix-cell-breakdown">
                <span className="node-live-tag">
                  <span className="tiny-green-beacon" />
                  PostgreSQL Live Node
                </span>
              </div>
            </div>
          </div>

          {/* Assessment Status Progress Pipeline */}
          <div className="assessment-status-radial-box">
            <div className="pipeline-header-row">
              <div className="radial-box-title">
                <Activity size={14} color="#3b82f6" />
                <span>ASSESSMENT REMEDIATION PIPELINE</span>
              </div>
              <span className="pipeline-fix-badge" style={{ color: parseFloat(fixRate) >= 50 ? '#10b981' : '#ef4444', background: parseFloat(fixRate) >= 50 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)' }}>
                {fixRate}% Remediated
              </span>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div className="pipeline-dual-track-wrap">
              <div className="pipeline-dual-track">
                <div
                  className="pipeline-fill-patched"
                  style={{ width: `${fixRate}%` }}
                  title={`Patched: ${fixRate}% (${closedCount} items)`}
                />
                <div
                  className="pipeline-fill-open"
                  style={{ width: `${totalFindings > 0 ? (openCount / totalFindings) * 100 : 0}%` }}
                  title={`Open: ${totalFindings > 0 ? ((openCount / totalFindings) * 100).toFixed(1) : 0}% (${openCount} items)`}
                />
              </div>
              <div className="pipeline-scale-markers">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Detailed 2-Column Status Readout */}
            <div className="pipeline-details-grid">
              <div className="pipeline-detail-card card-resolved">
                <div className="detail-card-head">
                  <div className="detail-dot dot-green" />
                  <span className="detail-title">Resolved & Patched</span>
                </div>
                <div className="detail-card-body">
                  <strong className="detail-pct green-text">{fixRate}%</strong>
                  <span className="detail-count">({closedCount} Findings)</span>
                </div>
              </div>

              <div className="pipeline-detail-card card-unresolved">
                <div className="detail-card-head">
                  <div className="detail-dot dot-red" />
                  <span className="detail-title">Open & Active Audit Issues</span>
                </div>
                <div className="detail-card-body">
                  <strong className="detail-pct red-text">
                    {totalFindings > 0 ? ((openCount / totalFindings) * 100).toFixed(1) : 0}%
                  </strong>
                  <span className="detail-count">({openCount} Findings)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          4. INTEGRATED ANALYTICS CHARTS (2X2 GRID)
          ========================================================= */}
      <div className="soc-charts-grid">
        {/* Chart 1: Donut Severity Distribution */}
        <div className="soc-panel severity-donut-panel">
          <div className="panel-header-simple">
            <div className="panel-header-title-wrap">
              <div className="panel-title-icon-wrap" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.12)' }}>
                <PieChart size={17} />
              </div>
              <div>
                <h3>Vulnerability Severity Distribution</h3>
                <p>Breakdown across total reported findings in database.</p>
              </div>
            </div>
            <div className="severity-total-badge">
              <span className="severity-dot-glow" />
              <span>4 Threat Tiers Active</span>
            </div>
          </div>

          <div className="donut-chart-wrapper">
            {/* Left: Glowing Modern SVG Donut */}
            <div className="donut-svg-container">
              <svg width="210" height="210" viewBox="0 0 210 210" className="donut-svg">
                {/* Background ambient ring */}
                <circle cx="105" cy="105" r="76" fill="none" stroke="var(--bg-pill)" strokeWidth="20" />

                {totalFindings === 0 ? (
                  <circle cx="105" cy="105" r="76" fill="none" stroke="#10b981" strokeWidth="20" strokeDasharray="477 0" />
                ) : (
                  <>
                    {/* Low */}
                    <circle
                      cx="105" cy="105" r="76" fill="none" stroke="#3b82f6"
                      strokeWidth={donutHover?.id === 'low' ? 24 : 20}
                      strokeDasharray={`${(lowCount / totalFindings) * 477} 477`} strokeDashoffset="0"
                      className="donut-segment segment-low"
                      onMouseEnter={() => setDonutHover({ id: 'low', text: `Low: ${lowCount} (${((lowCount / totalFindings) * 100).toFixed(1)}%)`, color: '#3b82f6', count: lowCount })}
                      onMouseLeave={() => setDonutHover(null)}
                    />
                    {/* Medium */}
                    <circle
                      cx="105" cy="105" r="76" fill="none" stroke="#f59e0b"
                      strokeWidth={donutHover?.id === 'medium' ? 24 : 20}
                      strokeDasharray={`${(mediumCount / totalFindings) * 477} 477`} strokeDashoffset={`-${(lowCount / totalFindings) * 477}`}
                      className="donut-segment segment-med"
                      onMouseEnter={() => setDonutHover({ id: 'medium', text: `Medium: ${mediumCount} (${((mediumCount / totalFindings) * 100).toFixed(1)}%)`, color: '#f59e0b', count: mediumCount })}
                      onMouseLeave={() => setDonutHover(null)}
                    />
                    {/* High */}
                    <circle
                      cx="105" cy="105" r="76" fill="none" stroke="#f97316"
                      strokeWidth={donutHover?.id === 'high' ? 24 : 20}
                      strokeDasharray={`${(highCount / totalFindings) * 477} 477`} strokeDashoffset={`-${((lowCount + mediumCount) / totalFindings) * 477}`}
                      className="donut-segment segment-high"
                      onMouseEnter={() => setDonutHover({ id: 'high', text: `High: ${highCount} (${((highCount / totalFindings) * 100).toFixed(1)}%)`, color: '#f97316', count: highCount })}
                      onMouseLeave={() => setDonutHover(null)}
                    />
                    {/* Critical */}
                    <circle
                      cx="105" cy="105" r="76" fill="none" stroke="#ef4444"
                      strokeWidth={donutHover?.id === 'critical' ? 24 : 20}
                      strokeDasharray={`${(criticalCount / totalFindings) * 477} 477`} strokeDashoffset={`-${((lowCount + mediumCount + highCount) / totalFindings) * 477}`}
                      className="donut-segment segment-crit"
                      onMouseEnter={() => setDonutHover({ id: 'critical', text: `Critical: ${criticalCount} (${((criticalCount / totalFindings) * 100).toFixed(1)}%)`, color: '#ef4444', count: criticalCount })}
                      onMouseLeave={() => setDonutHover(null)}
                    />
                  </>
                )}
              </svg>

              <div className="donut-center-info">
                <div className="donut-center-number" style={{ color: donutHover ? donutHover.color : 'var(--text-main)' }}>
                  {donutHover ? donutHover.count : totalFindings}
                </div>
                <div className="donut-center-label" style={{ color: donutHover ? donutHover.color : 'var(--text-muted)' }}>
                  {donutHover ? `${donutHover.id.toUpperCase()} FLAWS` : 'TOTAL FINDINGS'}
                </div>
              </div>
            </div>

            {/* Right: Interactive High-Tech Severity Cards */}
            <div className="donut-legend-grid">
              {severityDist.map((s) => {
                const Icon = s.icon;
                const isHovered = donutHover?.id === s.id;
                return (
                  <div
                    key={s.id}
                    className={`donut-severity-card ${isHovered ? 'hovered' : ''}`}
                    style={{
                      borderColor: isHovered ? s.color : 'var(--border-color)',
                      boxShadow: isHovered ? `0 4px 18px ${s.color}25` : 'none'
                    }}
                    onMouseEnter={() => setDonutHover({ id: s.id, text: `${s.label}: ${s.count} (${s.pct}%)`, color: s.color, count: s.count })}
                    onMouseLeave={() => setDonutHover(null)}
                  >
                    <div className="severity-card-left">
                      <div className="severity-icon-badge" style={{ color: s.color, background: `${s.color}15`, borderColor: `${s.color}35` }}>
                        <Icon size={16} />
                      </div>
                      <div className="severity-text-block">
                        <div className="severity-name-row">
                          <strong style={{ color: s.color }}>{s.label}</strong>
                          <span className="severity-cvss-tag">{s.cvss}</span>
                        </div>
                        {/* Mini percentage progress track */}
                        <div className="severity-mini-track">
                          <div
                            className="severity-mini-fill"
                            style={{ width: `${s.pct}%`, background: s.color }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="severity-card-right">
                      <strong className="severity-count-text">{s.count}</strong>
                      <span className="severity-pct-pill" style={{ color: s.color, background: `${s.color}12`, borderColor: `${s.color}35` }}>
                        {s.pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Severity Insight Strip */}
          <div className="severity-insight-strip">
            <span className="insight-icon">🛡️</span>
            <span>
              <strong>Posture Insight:</strong> {criticalCount > 0 ? `${criticalCount} Critical & ${highCount} High priority flaws require immediate patch remediation.` : 'Zero critical vulnerabilities detected in active assessment targets.'}
            </span>
          </div>
        </div>

        {/* Chart 2: OWASP Top 10 Telemetry (Now Prominently in Row 1!) */}
        <div className="soc-panel owasp-telemetry-panel">
          <div className="panel-header-simple">
            <div className="panel-header-title-wrap">
              <div className="panel-title-icon-wrap" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.12)' }}>
                <Shield size={17} />
              </div>
              <div>
                <h3>OWASP Top 10 Threat Telemetry</h3>
                <p>Category distribution frequency mapped to 2021/2026 standards.</p>
              </div>
            </div>
            <div className="owasp-count-header-badge">
              <span className="owasp-pulse-dot" />
              <span>{owaspData.length} OWASP Vectors</span>
            </div>
          </div>

          <div className="owasp-bars-list">
            {owaspData.map((item, idx) => (
              <div key={idx} className="owasp-bar-card">
                <div className="owasp-row-header">
                  <div className="owasp-title-wrap">
                    <span className="owasp-code-pill" style={{ color: item.color, borderColor: `${item.color}40`, background: `${item.color}15` }}>
                      {item.code}
                    </span>
                    <span className="owasp-name-text" title={item.name}>{item.name}</span>
                  </div>
                  <div className="owasp-stat-wrap">
                    <strong className="owasp-count-badge" style={{ color: item.color }}>{item.count} Flaws</strong>
                    <span className="owasp-pct-tag" style={{ color: item.color, background: `${item.color}12` }}>
                      {totalFindings > 0 ? ((item.count / totalFindings) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
                <div className="owasp-progress-track">
                  <div
                    className="owasp-progress-fill"
                    style={{
                      width: `${totalFindings > 0 ? (item.count / totalFindings) * 100 : 0}%`,
                      background: `linear-gradient(90deg, ${item.color}88, ${item.color})`,
                      boxShadow: `0 0 8px ${item.color}50`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="owasp-footer-note">
            <span>🛡️ Benchmark Alignment: Standardized against OWASP Top 10 Application Security Framework.</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          4.1 FULL-WIDTH TOP CWE CATEGORIES BAR GRAPH (REFINED & SLEEK)
          ========================================================= */}
      <div className="soc-panel cwe-showcase-panel">
        <div className="panel-header-simple">
          <div className="panel-header-title-wrap">
            <div className="panel-title-icon-wrap" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}>
              <Layers size={17} />
            </div>
            <div>
              <h3>Common Weakness Enumeration (CWE) Telemetry</h3>
              <p>Frequency distribution & weakness categorization across assessed targets.</p>
            </div>
          </div>
          <div className="cwe-header-meta-badge">
            <span className="cwe-pulse-dot" />
            <span>{cweData.length} CWE Types Active</span>
          </div>
        </div>

        {/* Clean, Sleek Vertical Bar Chart */}
        <div className="cwe-chart-canvas">
          {/* Subtle Horizontal Grid Guides */}
          <div className="cwe-chart-grid-guides">
            <div className="cwe-guide-line"><span className="cwe-guide-label">High</span><div className="cwe-guide-rule" /></div>
            <div className="cwe-guide-line"><span className="cwe-guide-label">Med</span><div className="cwe-guide-rule" /></div>
            <div className="cwe-guide-line"><span className="cwe-guide-label">Low</span><div className="cwe-guide-rule" /></div>
          </div>

          {/* Bar Columns Container */}
          <div className="cwe-bars-track-row">
            {cweData.map((item, idx) => {
              const maxCount = Math.max(...cweData.map(c => c.count), 1);
              const barHeightPct = item.count > 0
                ? Math.max(Math.round((item.count / maxCount) * 100), 14)
                : 8;

              return (
                <div key={idx} className="cwe-column-item">
                  {/* Floating Count Badge */}
                  <div
                    className="cwe-pill-count"
                    style={{
                      color: item.color,
                      borderColor: `${item.color}35`,
                      background: `${item.color}10`
                    }}
                  >
                    {item.count}
                  </div>

                  {/* Vertical Slim Track & Bar */}
                  <div className="cwe-track-tube">
                    <div
                      className="cwe-tube-fill"
                      style={{
                        height: `${barHeightPct}%`,
                        background: `linear-gradient(180deg, ${item.color}, ${item.color}88)`,
                        boxShadow: `0 0 10px ${item.color}30`
                      }}
                    />
                  </div>

                  {/* Labels Section */}
                  <div className="cwe-labels-block">
                    <span
                      className="cwe-badge-pill"
                      style={{
                        color: item.color,
                        background: `${item.color}12`,
                        borderColor: `${item.color}30`
                      }}
                    >
                      {item.code}
                    </span>
                    <span className="cwe-weakness-title" title={item.name}>
                      {item.name}
                    </span>
                    <span className="cwe-pct-label">
                      {item.pct}% share
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Refined Footer Strip */}
        <div className="cwe-footer-strip-refined">
          <span className="cwe-footer-icon">📊</span>
          <span>Mapped to MITRE Common Weakness Enumeration standard database.</span>
        </div>
      </div>

      {/* =========================================================
          5. UNIFIED QUICK ACTIONS & TOOLS HUB
          ========================================================= */}
      <div className="soc-section-heading">
        <Zap size={18} color="#3b82f6" />
        <h2>SOC Command Quick Launch Hub</h2>
      </div>

      <div className="soc-quick-actions-grid-clean">
        {[
          { title: 'Generate Report', desc: 'Form BISAG/SD/FR-207 R01', path: '/generate-report', icon: FileSpreadsheet, color: '#3b82f6' },
          { title: 'Audit Checklist', desc: 'Interactive live testing grid', path: '/checklist', icon: CheckCircle2, color: '#10b981' },
          { title: 'Analyze Report', desc: 'Ingest & parse legacy Excel', path: '/analyze-report', icon: Search, color: '#f59e0b' },
          { title: 'Cycle Comparison', desc: 'Delta tracking & analyst overlap', path: '/compare-reports', icon: Activity, color: '#6366f1' },
          { title: 'Security Tools', desc: 'shcheck, CORS, CSRF, AES intruder', path: '/security-tools', icon: Terminal, color: '#ef4444' },
          { title: 'Vulnerability DB', desc: '30+ standard OWASP & CWE rules', path: '/knowledge-base', icon: Database, color: '#ec4899' }
        ].map((act, i) => {
          const Icon = act.icon;
          return (
            <div key={i} className="soc-action-card-clean" onClick={() => navigate(act.path)} title={`${act.title} — ${act.desc}`}>
              <div className="action-clean-icon" style={{ color: act.color, background: `${act.color}15` }}>
                <Icon size={17} />
              </div>
              <div className="action-clean-info">
                <h4>{act.title}</h4>
                <p>{act.desc}</p>
              </div>
              <ChevronRight className="action-clean-arrow" size={13} />
            </div>
          );
        })}
      </div>

      {/* =========================================================
          6. FULL-WIDTH ENTERPRISE ASSESSMENTS DATA TABLE
          ========================================================= */}
      <div className="soc-panel assessments-table-panel full-width">
        <div className="panel-header-split">
          <div className="table-header-left">
            <div className="panel-title-icon-wrap" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.12)' }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3>Recent Security Assessments</h3>
              <p>Active VAPT audits stored in database ({filteredAssessments.length} total monitored services).</p>
            </div>
          </div>

          <div className="table-controls-group">
            <div className="table-search-box">
              <Search size={14} color="#3b82f6" />
              <input
                type="text"
                placeholder="Search assessment, URL, analyst..."
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
              />
            </div>

            <select
              className="table-filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Verified">Verified</option>
            </select>

            <button
              onClick={() => setShowNewAssessmentModal(true)}
              className="soc-btn-primary"
              style={{ padding: '8px 14px', fontSize: '12px' }}
              title="Add New Target"
            >
              <Plus size={14} />
              <span>New Assessment</span>
            </button>
          </div>
        </div>

        <div className="soc-table-wrapper">
          <table className="soc-data-table full-width-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Assessment Name</th>
                <th style={{ width: '14%' }}>Client / Division</th>
                <th style={{ width: '18%' }}>Target Scope</th>
                <th style={{ width: '20%' }}>Assigned Analysts</th>
                <th style={{ width: '9%' }}>Status</th>
                <th style={{ width: '10%' }}>Findings</th>
                <th style={{ width: '11%' }}>Progress</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
                    No assessment projects match the current filter.
                    <div style={{ marginTop: '12px' }}>
                      <button
                        type="button"
                        className="soc-btn-primary"
                        style={{ padding: '8px 16px', fontSize: '12.5px', margin: '0 auto' }}
                        onClick={() => setShowNewAssessmentModal(true)}
                      >
                        <Plus size={14} />
                        <span>Initiate New VAPT Assessment</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((a) => {
                  let statusClass = 'status-in-progress';
                  if (a.status === 'Completed' || a.status === 'Verified') statusClass = 'status-verified';
                  if (a.status === 'Pending Retest') statusClass = 'status-pending';

                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="table-primary-text">{a.name}</div>
                        <div className="table-secondary-code">{a.id} • {a.type}</div>
                      </td>
                      <td>
                        <div className="table-primary-text">{a.client}</div>
                        <div className="table-secondary-code">{a.dept} Division</div>
                      </td>
                      <td>
                        <a
                          href={a.target.startsWith('http') ? a.target : `https://${a.target}`}
                          target="_blank"
                          rel="noreferrer"
                          className="table-target-link"
                          title={`Open ${a.target}`}
                        >
                          <Globe size={13} className="target-link-icon" />
                          <span>{a.target}</span>
                        </a>
                      </td>
                      <td>
                        <div className="table-analysts-wrap">
                          {a.analyst ? (
                            a.analyst.split(',').map((name, nIdx) => (
                              <span key={nIdx} className="table-analyst-chip">
                                {name.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="table-analyst-chip unassigned">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`soc-status-badge ${statusClass}`}>{a.status}</span>
                      </td>
                      <td>
                        <div className="table-findings-pills">
                          {a.crit > 0 && <span className="pill-crit">{a.crit}C</span>}
                          {a.high > 0 && <span className="pill-high">{a.high}H</span>}
                          {a.med > 0 && <span className="pill-med">{a.med}M</span>}
                          {a.low > 0 && <span className="pill-low">{a.low}L</span>}
                          {a.crit === 0 && a.high === 0 && a.med === 0 && a.low === 0 && (
                            <span className="pill-clean">Clean</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="table-progress-wrap">
                          <div className="table-progress-track">
                            <div className="table-progress-fill" style={{ width: `${a.progress}%` }} />
                          </div>
                          <span className="table-progress-pct">{a.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-actions-cell" style={{ justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleExportAssessmentExcel(a)}
                            className="table-action-btn"
                            title="Download Official Report"
                          >
                            <FileSpreadsheet size={13} />
                          </button>
                          <button
                            onClick={() => navigate('/compare-reports')}
                            className="table-action-btn"
                            title="Compare Cycles"
                          >
                            <Activity size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          7. FULL-WIDTH SOC ACTIVITY TIMELINE & LOGS FEED
          ========================================================= */}
      <div className="soc-panel timeline-panel full-width">
        <div className="timeline-header-block">
          <div className="panel-header-simple">
            <div className="panel-header-title-wrap">
              <div className="panel-title-icon-wrap" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)' }}>
                <Clock size={17} />
              </div>
              <div>
                <h3>SOC Activity & Audit Timeline</h3>
                <p>Live chronological audit trail across security scans, compliance actions, and user events.</p>
              </div>
            </div>

            <div className="timeline-header-right-controls">
              {/* Daily Date Filter Selector Bar */}
              <div className="timeline-date-filter-bar">
                <div className="date-filter-pills-row">
                  <button
                    type="button"
                    className={`date-filter-pill ${timelineDateFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => { setTimelineDateFilter('ALL'); setCustomDateInput(''); }}
                  >
                    All Days
                  </button>
                  <button
                    type="button"
                    className={`date-filter-pill ${timelineDateFilter === 'TODAY' ? 'active' : ''}`}
                    onClick={() => { setTimelineDateFilter('TODAY'); setCustomDateInput(''); }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={`date-filter-pill ${timelineDateFilter === 'YESTERDAY' ? 'active' : ''}`}
                    onClick={() => { setTimelineDateFilter('YESTERDAY'); setCustomDateInput(''); }}
                  >
                    Yesterday
                  </button>
                </div>

                {/* Custom Date Picker Input */}
                <div className="timeline-date-picker-box">
                  <Calendar size={13} className="date-picker-icon" />
                  <input
                    type="date"
                    value={customDateInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomDateInput(val);
                      if (val) {
                        setTimelineDateFilter(val);
                      } else {
                        setTimelineDateFilter('ALL');
                      }
                    }}
                    title="Pick a specific date to view daily logs"
                  />
                  {customDateInput && (
                    <button
                      type="button"
                      className="date-picker-clear-btn"
                      onClick={() => { setCustomDateInput(''); setTimelineDateFilter('ALL'); }}
                      title="Clear date filter"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate('/activity-logs')}
                className="timeline-view-all-link"
                title="View Full Logs Portal"
              >
                <span>Full Logs</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Timeline List Grouped by Day */}
        <div className="soc-timeline-scroll-container">
          {groupedTimelineLogs.length === 0 || (groupedTimelineLogs.length === 1 && groupedTimelineLogs[0].events.length === 0) ? (
            <div className="timeline-empty-state">
              <Clock size={24} color="var(--text-muted)" />
              <p>No SOC activity recorded for the selected date.</p>
              <button
                type="button"
                className="soc-btn-outline"
                style={{ padding: '6px 14px', fontSize: '12px', margin: '0 auto' }}
                onClick={() => { setTimelineDateFilter('ALL'); setCustomDateInput(''); }}
              >
                View All Days
              </button>
            </div>
          ) : (
            groupedTimelineLogs.map((group) => (
              <div key={group.dateKey} className="timeline-date-group">
                <div className="timeline-date-badge-divider">
                  <Calendar size={12} />
                  <span>{group.dateLabel}</span>
                  <span className="date-event-count">({group.events.length})</span>
                </div>

                <div className="soc-timeline-list full-width-timeline-grid">
                  {group.events.map((evt) => {
                    const Icon = evt.icon;
                    return (
                      <div key={evt.id} className="timeline-item">
                        <div className="timeline-node" style={{ borderColor: evt.color, color: evt.color }}>
                          <Icon size={13} />
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-title-row">
                            <strong style={{ color: evt.color }}>{evt.title}</strong>
                            <span className="timeline-time">{evt.time}</span>
                          </div>
                          <div className="timeline-target-desc">{evt.target}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =========================================================
          7. INITIATE NEW VAPT ASSESSMENT MODAL
          ========================================================= */}
      {showNewAssessmentModal && (
        <div className="vapt-modal-overlay" onClick={() => setShowNewAssessmentModal(false)}>
          <div className="vapt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="vapt-modal-header">
              <div className="modal-header-brand">
                <div className="modal-shield-icon">
                  <ShieldCheck size={22} color="#3b82f6" />
                </div>
                <div>
                  <h3>Initiate New VAPT Assessment</h3>
                  <p>Register target scope & select audit execution workflow.</p>
                </div>
              </div>
              <button
                type="button"
                className="vapt-modal-close-btn"
                onClick={() => setShowNewAssessmentModal(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => handleCreateAssessment(e, 'save')} className="vapt-modal-body">
              <div className="modal-form-grid">
                {/* Project Name */}
                <div className="modal-form-group full-width">
                  <label>PROJECT / APPLICATION NAME *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., National Cybersecurity Portal (NCP)"
                    value={newProjectForm.project_name}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, project_name: e.target.value })}
                  />
                </div>

                {/* Target Scope URL */}
                <div className="modal-form-group full-width">
                  <label>TARGET SCOPE / URL OR APK NAME *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., https://cyber.gov.in or app-release.apk"
                    value={newProjectForm.target_url}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, target_url: e.target.value })}
                  />
                </div>

                {/* Lead Security Analyst */}
                <div className="modal-form-group">
                  <label>ASSIGNED SECURITY ANALYST</label>
                  <input
                    type="text"
                    placeholder="e.g., HarpalSinh Rathod"
                    value={newProjectForm.security_analysts}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, security_analysts: e.target.value })}
                  />
                </div>

                {/* Project Manager / Division */}
                <div className="modal-form-group">
                  <label>PROJECT MANAGER / DIVISION</label>
                  <input
                    type="text"
                    placeholder="e.g., BISAG-N Software Division"
                    value={newProjectForm.project_managers}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, project_managers: e.target.value })}
                  />
                </div>
              </div>

              {/* Assessment Workflow Choice Grid */}
              <div className="modal-workflow-heading">SELECT ASSESSMENT EXECUTION ACTION:</div>
              <div className="vapt-modal-actions-grid">
                <button
                  type="button"
                  className="modal-action-choice-btn btn-scan"
                  disabled={isSubmittingProject}
                  onClick={(e) => handleCreateAssessment(e, 'scan')}
                >
                  <Terminal size={18} />
                  <div className="action-text-block">
                    <strong>Launch Security Tools Scan</strong>
                    <small>Run shcheck, CORS, CSRF & Recon</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="modal-action-choice-btn btn-checklist"
                  disabled={isSubmittingProject}
                  onClick={(e) => handleCreateAssessment(e, 'checklist')}
                >
                  <CheckSquare size={18} />
                  <div className="action-text-block">
                    <strong>Open Audit Checklist</strong>
                    <small>Interactive live 31-point test grid</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="modal-action-choice-btn btn-report"
                  disabled={isSubmittingProject}
                  onClick={(e) => handleCreateAssessment(e, 'report')}
                >
                  <FileSpreadsheet size={18} />
                  <div className="action-text-block">
                    <strong>Open Report Generator</strong>
                    <small>Fill Form BISAG/SD/FR-207 R01</small>
                  </div>
                </button>
              </div>

              <div className="vapt-modal-footer">
                <button
                  type="button"
                  className="soc-btn-outline"
                  onClick={() => setShowNewAssessmentModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="soc-btn-primary"
                  disabled={isSubmittingProject}
                >
                  {isSubmittingProject ? 'Registering...' : 'Save Assessment to Dashboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
