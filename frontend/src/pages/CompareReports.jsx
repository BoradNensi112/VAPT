import React, { useState, useEffect, useMemo } from 'react';
import {
  GitCompare,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Users,
  Shield,
  Layers,
  Sparkles,
  Search,
  Calendar,
  Building2,
  Flame,
  FileSpreadsheet,
  Globe,
  Activity,
  Check,
  Zap,
  Sliders
} from 'lucide-react';
import api from '../services/api';
import '../styles/compareReports.css';

export default function CompareReports() {
  const [activeTab, setActiveTab] = useState('cycles');

  // Live Data State
  const [projects, setProjects] = useState([]);
  const [analystsList, setAnalystsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cycle Comparison State
  const [baseProjectId, setBaseProjectId] = useState('');
  const [compareProjectId, setCompareProjectId] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  // Analyst Intelligence State
  const [primaryAnalyst, setPrimaryAnalyst] = useState('');
  const [compareAnalyst, setCompareAnalyst] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // 1. Initial Load: Projects & Analysts from Live DB
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projRes, analystRes] = await Promise.all([
          api.get('/projects'),
          api.get('/analysts')
        ]);

        const pList = projRes.data?.projects || [];
        setProjects(pList);

        const aList = analystRes.data?.analysts || [];
        setAnalystsList(aList);

        if (pList.length > 0) {
          setBaseProjectId(String(pList[0].id));
          if (pList.length > 1) {
            setCompareProjectId(String(pList[1].id));
          } else {
            setCompareProjectId(String(pList[0].id));
          }
        }

        if (aList.length > 0) {
          setPrimaryAnalyst(aList[0].name);
          setCompareAnalyst(aList.length > 1 ? aList[1].name : aList[0].name);
        }
      } catch (err) {
        console.error('Error loading comparison data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Fetch Comparison Result when base or compare project changes
  useEffect(() => {
    if (!baseProjectId || !compareProjectId) return;

    const runComparison = async () => {
      setComparing(true);
      try {
        const res = await api.get(`/reports/compare?baseProjectId=${baseProjectId}&compareProjectId=${compareProjectId}`);
        if (res.data.success) {
          setComparisonResult(res.data);
        }
      } catch (err) {
        console.error('Error fetching project comparison:', err);
      } finally {
        setComparing(false);
      }
    };

    runComparison();
  }, [baseProjectId, compareProjectId]);

  // Dynamic Delta Calculations
  const deltaMetrics = useMemo(() => {
    if (!comparisonResult) {
      return {
        remediatedCount: 0,
        recurringCount: 0,
        newCount: 0,
        netReduction: '0%',
        isImprovement: true
      };
    }

    const { remediated, recurring, newFindings, summary } = comparisonResult;
    const remCount = remediated?.length || 0;
    const recCount = recurring?.length || 0;
    const nCount = newFindings?.length || 0;
    const totalInitial = summary?.totalInitial || 1;
    const totalCurrent = summary?.totalCurrent || 0;

    let netReductionPct = 0;
    if (totalInitial > 0) {
      netReductionPct = Math.round(((totalInitial - totalCurrent) / totalInitial) * 100);
    }

    return {
      remediatedCount: remCount,
      recurringCount: recCount,
      newCount: nCount,
      netReduction: `${netReductionPct > 0 ? '-' : '+'}${Math.abs(netReductionPct)}%`,
      isImprovement: netReductionPct >= 0
    };
  }, [comparisonResult]);

  // Dynamic Analyst Engagement History from actual Database Projects
  const analystHistory = useMemo(() => {
    return projects.map((p, idx) => {
      const analystsInProject = (p.security_analysts || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      return {
        projectId: p.id,
        project: p.project_name,
        target: p.target_url,
        dept: p.target_url?.toLowerCase().endsWith('.apk') ? 'Mobile Security' : 'Software',
        cycle: `Cycle 0${idx + 1}`,
        date: new Date(p.created_at).toLocaleDateString('en-GB'),
        status: parseInt(p.total_findings || 0, 10) === 0 ? 'Verified' : 'In Progress',
        sharedWith: analystsInProject
      };
    });
  }, [projects]);

  // Filtered Analyst Projects
  const filteredAnalystProjects = useMemo(() => {
    if (!primaryAnalyst) return [];
    return analystHistory.filter(h => {
      const matchAnalyst = h.sharedWith.some(a => a.toLowerCase() === primaryAnalyst.toLowerCase());
      const matchDept = deptFilter === 'ALL' || h.dept === deptFilter;
      return matchAnalyst && matchDept;
    });
  }, [analystHistory, primaryAnalyst, deptFilter]);

  // Co-audited Projects Count
  const sharedEngagements = useMemo(() => {
    if (!primaryAnalyst || !compareAnalyst) return 0;
    return analystHistory.filter(h => {
      const hasA = h.sharedWith.some(a => a.toLowerCase() === primaryAnalyst.toLowerCase());
      const hasB = h.sharedWith.some(a => a.toLowerCase() === compareAnalyst.toLowerCase());
      return hasA && hasB;
    }).length;
  }, [analystHistory, primaryAnalyst, compareAnalyst]);

  return (
    <div className="page-wrapper compare-container">
      {/* 1. TOP HEADER PANEL */}
      <div className="compare-header-panel">
        <div className="compare-title-group">
          <h1>
            <GitCompare color="#00E5FF" size={28} />
            VAPT Delta Comparison & Team Analytics
          </h1>
          <p>Multi-cycle regression tracking, remediation verification & security auditor collaboration intelligence.</p>
        </div>

        <div className="compare-tab-buttons">
          <button
            onClick={() => setActiveTab('cycles')}
            className={`compare-tab-btn ${activeTab === 'cycles' ? 'active' : ''}`}
          >
            <GitCompare size={15} />
            <span>Cycle-to-Cycle Delta</span>
          </button>
          <button
            onClick={() => setActiveTab('analysts')}
            className={`compare-tab-btn ${activeTab === 'analysts' ? 'active' : ''}`}
          >
            <Users size={15} />
            <span>Analyst Overlap Intelligence</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CYCLE-TO-CYCLE DELTA COMPARISON */}
      {activeTab === 'cycles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Selector Card */}
          <div className="compare-selector-card">
            <div className="selector-grid">
              <div className="selector-group">
                <label className="selector-label">
                  <Globe size={13} color="#00E5FF" /> BASELINE PROJECT (BEFORE AUDIT)
                </label>
                <select
                  className="compare-select"
                  value={baseProjectId}
                  onChange={(e) => setBaseProjectId(e.target.value)}
                >
                  {projects.map(p => (
                    <option key={p.id} value={String(p.id)}>
                      VAPT-2026-00{p.id}: {p.project_name} ({p.target_url})
                    </option>
                  ))}
                </select>
              </div>

              <div className="selector-group">
                <label className="selector-label">
                  <CheckCircle2 size={13} color="#14F195" /> COMPARISON / RETEST CYCLE (CURRENT AUDIT)
                </label>
                <select
                  className="compare-select"
                  value={compareProjectId}
                  onChange={(e) => setCompareProjectId(e.target.value)}
                >
                  {projects.map(p => (
                    <option key={p.id} value={String(p.id)}>
                      VAPT-2026-00{p.id}: {p.project_name} ({p.target_url})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Delta Metrics KPI Strip */}
          <div className="compare-kpi-grid">
            <div className="compare-kpi-card" style={{ borderLeft: '4px solid #14F195' }}>
              <div className="compare-kpi-header">
                <span className="compare-kpi-title">Remediated & Patched</span>
                <CheckCircle2 size={18} color="#14F195" />
              </div>
              <div className="compare-kpi-val" style={{ color: '#14F195' }}>
                {deltaMetrics.remediatedCount}
              </div>
              <p className="compare-kpi-sub">Vulnerabilities verified as resolved in re-test cycle.</p>
            </div>

            <div className="compare-kpi-card" style={{ borderLeft: '4px solid #FFB020' }}>
              <div className="compare-kpi-header">
                <span className="compare-kpi-title">Recurring (Still Open)</span>
                <AlertTriangle size={18} color="#FFB020" />
              </div>
              <div className="compare-kpi-val" style={{ color: '#FFB020' }}>
                {deltaMetrics.recurringCount}
              </div>
              <p className="compare-kpi-sub">Flaws persisting across cycles requiring developer action.</p>
            </div>

            <div className="compare-kpi-card" style={{ borderLeft: '4px solid #FF4D6D' }}>
              <div className="compare-kpi-header">
                <span className="compare-kpi-title">Newly Introduced</span>
                <Flame size={18} color="#FF4D6D" />
              </div>
              <div className="compare-kpi-val" style={{ color: '#FF4D6D' }}>
                {deltaMetrics.newCount}
              </div>
              <p className="compare-kpi-sub">New vulnerabilities detected during recent re-test.</p>
            </div>

            <div className="compare-kpi-card" style={{ borderLeft: '4px solid #00E5FF' }}>
              <div className="compare-kpi-header">
                <span className="compare-kpi-title">Net Risk Reduction</span>
                {deltaMetrics.isImprovement ? <TrendingDown size={18} color="#14F195" /> : <TrendingUp size={18} color="#FF4D6D" />}
              </div>
              <div className="compare-kpi-val" style={{ color: '#00E5FF' }}>
                {deltaMetrics.netReduction}
              </div>
              <p className="compare-kpi-sub" style={{ color: deltaMetrics.isImprovement ? '#14F195' : '#FF4D6D', fontWeight: 600 }}>
                {deltaMetrics.isImprovement ? '✅ Positive Hardening Velocity' : '⚠️ Risk Surface Increased'}
              </p>
            </div>
          </div>

          {/* Breakdown Comparison Panels */}
          <div className="comparison-tables-grid">
            {/* Panel 1: Remediated Findings */}
            <div className="delta-panel">
              <div className="delta-panel-header">
                <h3>
                  <CheckCircle2 size={18} color="#14F195" />
                  Remediated Vulnerabilities ({comparisonResult?.remediated?.length || 0})
                </h3>
              </div>

              <div className="delta-items-list">
                {(!comparisonResult?.remediated || comparisonResult.remediated.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No remediated findings between the selected projects.
                  </div>
                ) : (
                  comparisonResult.remediated.map((f, i) => (
                    <div key={i} className="delta-item-row">
                      <div className="delta-item-info">
                        <span className="delta-item-title">{f.vulnerability_name}</span>
                        <div className="delta-item-meta">
                          <span style={{ color: '#14F195', fontWeight: 700 }}>✓ Verified Resolved</span>
                          <span>•</span>
                          <span>{f.owasp_category || 'OWASP'}</span>
                        </div>
                      </div>
                      <span className="delta-item-badge" style={{ background: 'rgba(20, 241, 149, 0.15)', color: '#14F195', border: '1px solid rgba(20, 241, 149, 0.3)' }}>
                        {f.severity}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Panel 2: Recurring & New Findings */}
            <div className="delta-panel">
              <div className="delta-panel-header">
                <h3>
                  <AlertTriangle size={18} color="#FFB020" />
                  Recurring & Regression Findings ({(comparisonResult?.recurring?.length || 0) + (comparisonResult?.newFindings?.length || 0)})
                </h3>
              </div>

              <div className="delta-items-list">
                {/* Recurring */}
                {comparisonResult?.recurring?.map((item, i) => {
                  const f = item.current || item.initial || item;
                  return (
                    <div key={`rec-${i}`} className="delta-item-row" style={{ borderLeft: '3px solid #FFB020' }}>
                      <div className="delta-item-info">
                        <span className="delta-item-title">{f.vulnerability_name}</span>
                        <div className="delta-item-meta">
                          <span style={{ color: '#FFB020', fontWeight: 700 }}>⚠️ Persisting Flaw (Still Open)</span>
                          <span>•</span>
                          <span>{f.cwe_number || 'CWE'}</span>
                        </div>
                      </div>
                      <span className="delta-item-badge" style={{ background: 'rgba(255, 176, 32, 0.15)', color: '#FFB020', border: '1px solid rgba(255, 176, 32, 0.3)' }}>
                        {f.severity}
                      </span>
                    </div>
                  );
                })}

                {/* New Findings */}
                {comparisonResult?.newFindings?.map((f, i) => (
                  <div key={`new-${i}`} className="delta-item-row" style={{ borderLeft: '3px solid #FF4D6D' }}>
                    <div className="delta-item-info">
                      <span className="delta-item-title">{f.vulnerability_name}</span>
                      <div className="delta-item-meta">
                        <span style={{ color: '#FF4D6D', fontWeight: 700 }}>🚨 Newly Introduced Issue</span>
                        <span>•</span>
                        <span>{f.cwe_number || 'CWE'}</span>
                      </div>
                    </div>
                    <span className="delta-item-badge" style={{ background: 'rgba(255, 77, 109, 0.15)', color: '#FF4D6D', border: '1px solid rgba(255, 77, 109, 0.3)' }}>
                      {f.severity}
                    </span>
                  </div>
                ))}

                {(!comparisonResult?.recurring?.length && !comparisonResult?.newFindings?.length) && (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No recurring or newly introduced vulnerabilities found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYST OVERLAP & TEAM INTELLIGENCE */}
      {activeTab === 'analysts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Selectors */}
          <div className="compare-selector-card">
            <div className="selector-grid">
              <div className="selector-group">
                <label className="selector-label">
                  <Users size={13} color="#00E5FF" /> PRIMARY SECURITY AUDITOR A
                </label>
                <select
                  className="compare-select"
                  value={primaryAnalyst}
                  onChange={(e) => setPrimaryAnalyst(e.target.value)}
                >
                  {analystsList.map(a => (
                    <option key={a.id} value={a.name}>
                      {a.name} ({a.department} Division)
                    </option>
                  ))}
                </select>
              </div>

              <div className="selector-group">
                <label className="selector-label">
                  <Users size={13} color="#14F195" /> COMPARISON AUDITOR B
                </label>
                <select
                  className="compare-select"
                  value={compareAnalyst}
                  onChange={(e) => setCompareAnalyst(e.target.value)}
                >
                  {analystsList.map(a => (
                    <option key={a.id} value={a.name}>
                      {a.name} ({a.department} Division)
                    </option>
                  ))}
                </select>
              </div>

              <div className="selector-group">
                <label className="selector-label">
                  <Sliders size={13} color="#FFB020" /> FILTER DIVISION / DOMAIN
                </label>
                <select
                  className="compare-select"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="ALL">All Divisions</option>
                  <option value="Software">Software</option>
                  <option value="Mobile Security">Mobile Security</option>
                  <option value="Defence">Defence</option>
                  <option value="SATCOM">SATCOM</option>
                  <option value="GIS">GIS</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
              </div>
            </div>
          </div>

          {/* Overlap Summary Banner */}
          <div className="analyst-overlap-banner">
            <div className="analyst-overlap-left">
              <span style={{ fontSize: '11px', color: '#00E5FF', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.8px' }}>
                AUDITOR COLLABORATION MATRIX
              </span>
              <h2>
                {primaryAnalyst} ⚡ {compareAnalyst}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                Co-assigned on <strong>{sharedEngagements}</strong> VAPT security audit project(s) across government applications.
              </p>
            </div>

            <div className="analyst-overlap-count-box">
              <div className="analyst-overlap-count-num">{sharedEngagements}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Shared Engagements
              </div>
            </div>
          </div>

          {/* Real Project Engagements for Selected Primary Analyst */}
          <div className="delta-panel">
            <div className="delta-panel-header">
              <h3>
                <Building2 size={18} color="#00E5FF" />
                Active Engagement Portfolio: {primaryAnalyst} ({filteredAnalystProjects.length})
              </h3>
            </div>

            <div className="engagements-grid">
              {filteredAnalystProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                  No active projects found for {primaryAnalyst} under the selected division.
                </div>
              ) : (
                filteredAnalystProjects.map((h, idx) => (
                  <div key={idx} className="engagement-card">
                    <div className="engagement-top">
                      <span className="engagement-dept-tag">{h.dept}</span>
                      <span className="engagement-status-tag" style={{ background: h.status === 'Verified' ? 'rgba(20, 241, 149, 0.15)' : 'rgba(0, 229, 255, 0.15)', color: h.status === 'Verified' ? '#14F195' : '#00E5FF' }}>
                        {h.status}
                      </span>
                    </div>

                    <div className="engagement-title">{h.project}</div>

                    <div className="engagement-meta">
                      <span><strong>Target:</strong> {h.target}</span>
                      <span><strong>Co-Auditors:</strong> {h.sharedWith.join(', ') || 'Solo'}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Audit Date: {h.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
