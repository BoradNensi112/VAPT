import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckSquare,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  Calendar,
  Clock,
  Save,
  Copy,
  Download,
  Globe,
  User,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { VULNERABILITIES } from '../data/vulnerabilityData';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/checklist.css';

export default function Checklist() {
  const { user } = useAuth();

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

  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [targetUrl, setTargetUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [checkedMap, setCheckedMap] = useState({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PASSED, FAILED, REMAINING
  const [selectedSeverity, setSelectedSeverity] = useState('ALL'); // ALL, Critical, High, Medium, Low
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', ''
  const [historySessions, setHistorySessions] = useState([]);
  const [projectsList, setProjectsList] = useState([]);

  // Load session from backend & localStorage when selectedDate changes
  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      // 1. Check localStorage first for instant paint
      const localKey = `vapt_checklist_${selectedDate}`;
      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          setCheckedMap(parsed.checkedMap || {});
          setTargetUrl(parsed.targetUrl || '');
          setProjectName(parsed.projectName || '');
          setSessionNotes(parsed.notes || '');
        } catch (e) {
          console.error('Error parsing local checklist:', e);
        }
      } else {
        setCheckedMap({});
        setTargetUrl('');
        setProjectName('');
        setSessionNotes('');
      }

      // 2. Fetch official data from backend
      try {
        const res = await api.get(`/checklist?date=${selectedDate}`);
        if (res.data.success && res.data.session) {
          const s = res.data.session;
          if (s.checked_items && Object.keys(s.checked_items).length > 0) {
            setCheckedMap(s.checked_items);
            setTargetUrl(s.target_url || '');
            setProjectName(s.project_name || '');
            setSessionNotes(s.notes || '');
            // Update local storage cache
            localStorage.setItem(localKey, JSON.stringify({
              checkedMap: s.checked_items,
              targetUrl: s.target_url,
              projectName: s.project_name,
              notes: s.notes
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching backend session:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [selectedDate]);

  // Fetch recent projects and history sessions on mount
  useEffect(() => {
    api.get('/projects').then(res => setProjectsList(res.data.projects || [])).catch(() => {});
    api.get('/checklist/history').then(res => setHistorySessions(res.data.sessions || [])).catch(() => {});
  }, []);

  // Save session to backend and local storage
  const saveSessionData = async (newMap = checkedMap, currentTarget = targetUrl, currentProject = projectName, currentNotes = sessionNotes) => {
    const localKey = `vapt_checklist_${selectedDate}`;
    localStorage.setItem(localKey, JSON.stringify({
      checkedMap: newMap,
      targetUrl: currentTarget,
      projectName: currentProject,
      notes: currentNotes,
      updatedAt: new Date().toISOString()
    }));

    // Calculate metrics
    const tested = Object.values(newMap).filter(v => v.status === 'PASSED' || v.status === 'FAILED' || v.tested).length;

    try {
      setSaveStatus('saving');
      await api.post('/checklist', {
        sessionDate: selectedDate,
        targetUrl: currentTarget,
        projectName: currentProject,
        checkedItems: newMap,
        notes: currentNotes,
        testedCount: tested,
        totalCount: VULNERABILITIES.length
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2500);

      // Refresh history list
      api.get('/checklist/history').then(res => setHistorySessions(res.data.sessions || [])).catch(() => {});
    } catch (err) {
      console.error('Error saving checklist to backend:', err);
      setSaveStatus('');
    }
  };

  // Toggle or change status for a vulnerability
  const setItemStatus = (name, status) => {
    const updated = {
      ...checkedMap,
      [name]: {
        ...(checkedMap[name] || {}),
        tested: status !== 'REMAINING',
        status: status, // 'PASSED', 'FAILED', 'REMAINING'
        timestamp: new Date().toISOString()
      }
    };
    if (status === 'REMAINING') {
      delete updated[name];
    }
    setCheckedMap(updated);
    saveSessionData(updated, targetUrl, projectName, sessionNotes);
  };

  const updateItemNote = (name, note) => {
    const updated = {
      ...checkedMap,
      [name]: {
        ...(checkedMap[name] || {}),
        note: note
      }
    };
    setCheckedMap(updated);
  };

  // Carry forward / copy progress from yesterday or previous date
  const handleCopyFromPrevious = () => {
    const yesterday = getYesterdayLocal();
    const localKey = `vapt_checklist_${yesterday}`;
    let previousData = null;

    const saved = localStorage.getItem(localKey);
    if (saved) {
      try { previousData = JSON.parse(saved); } catch (e) {}
    }

    if (!previousData) {
      // Check from history sessions
      const prevSession = historySessions.find(s => s.sessionDate < selectedDate);
      if (prevSession) {
        if (window.confirm(`Copy tested checklist progress from previous session (${prevSession.sessionDate}) into today's test?`)) {
          api.get(`/checklist?date=${prevSession.sessionDate}`).then(res => {
            if (res.data.session?.checked_items) {
              const copied = res.data.session.checked_items;
              setCheckedMap(copied);
              setTargetUrl(res.data.session.target_url || targetUrl);
              setProjectName(res.data.session.project_name || projectName);
              saveSessionData(copied, res.data.session.target_url || targetUrl, res.data.session.project_name || projectName, sessionNotes);
            }
          });
          return;
        }
      } else {
        alert('No previous session found to copy from.');
        return;
      }
    } else {
      if (window.confirm(`Copy testing checklist from yesterday (${yesterday}) into today's session (${selectedDate})?`)) {
        setCheckedMap(previousData.checkedMap || {});
        setTargetUrl(previousData.targetUrl || targetUrl);
        setProjectName(previousData.projectName || projectName);
        saveSessionData(previousData.checkedMap || {}, previousData.targetUrl || targetUrl, previousData.projectName || projectName, sessionNotes);
      }
    }
  };

  // Reset current date's checklist
  const handleResetCurrentDate = () => {
    if (window.confirm(`Are you sure you want to reset all checked test items for date ${selectedDate}?`)) {
      setCheckedMap({});
      saveSessionData({}, targetUrl, projectName, sessionNotes);
    }
  };

  // Export daily checklist report as JSON
  const handleExportJson = () => {
    const data = {
      sessionDate: selectedDate,
      analyst: user?.username || 'Security Analyst',
      targetUrl,
      projectName,
      notes: sessionNotes,
      metrics: {
        totalItems: VULNERABILITIES.length,
        testedCount,
        passedCount,
        failedCount,
        remainingCount
      },
      auditItems: VULNERABILITIES.map(v => ({
        name: v.name,
        severity: v.severity,
        owasp: v.owasp,
        status: checkedMap[v.name]?.status || 'UNTESTED',
        note: checkedMap[v.name]?.note || '',
        testedAt: checkedMap[v.name]?.timestamp || null
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VAPT_Checklist_${selectedDate}_${(projectName || 'Engagement').replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculated Metrics
  const total = VULNERABILITIES.length;
  const passedCount = useMemo(() => {
    return Object.values(checkedMap).filter(v => v.status === 'PASSED').length;
  }, [checkedMap]);

  const failedCount = useMemo(() => {
    return Object.values(checkedMap).filter(v => v.status === 'FAILED').length;
  }, [checkedMap]);

  const testedCount = passedCount + failedCount;
  const remainingCount = total - testedCount;
  const progressPct = total > 0 ? (testedCount / total) * 100 : 0;

  // Filtered Vulnerabilities
  const filteredVulns = useMemo(() => {
    return VULNERABILITIES.filter(v => {
      const matchSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.severity.toLowerCase().includes(search.toLowerCase()) ||
        v.owasp.toLowerCase().includes(search.toLowerCase());

      const item = checkedMap[v.name];
      const itemStatus = item?.status || 'REMAINING';

      let matchStatus = true;
      if (filterStatus === 'PASSED') matchStatus = itemStatus === 'PASSED';
      if (filterStatus === 'FAILED') matchStatus = itemStatus === 'FAILED';
      if (filterStatus === 'REMAINING') matchStatus = itemStatus === 'REMAINING' || !item?.tested;

      let matchSeverity = true;
      if (selectedSeverity !== 'ALL') matchSeverity = v.severity === selectedSeverity;

      return matchSearch && matchStatus && matchSeverity;
    });
  }, [search, filterStatus, selectedSeverity, checkedMap]);

  const isToday = selectedDate === getTodayLocal();
  const isYesterday = selectedDate === getYesterdayLocal();

  return (
    <div className="page-wrapper checklist-page">
      {/* Header */}
      <div className="checklist-header-row">
        <div>
          <div className="checklist-badge-tag">
            <span className="navbar-status-dot" />
            <span>{isToday ? '🟢 LIVE TODAY\'S SECURITY ENGAGEMENT' : `📅 HISTORICAL SESSION (${selectedDate})`}</span>
          </div>
          <h1 className="checklist-page-title">VAPT Daily Testing Checklist</h1>
          <p className="checklist-page-sub">
            Execute, verify, and log vulnerability test items day-by-day. Every testing session is automatically tracked by date, stored in the database, and synced with the SOC Activity Timeline.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleExportJson} className="cyber-btn cyber-btn-secondary" title="Export JSON Report">
            <Download size={14} />
            <span>Export Summary</span>
          </button>
          <button onClick={handleResetCurrentDate} className="cyber-btn cyber-btn-danger" title="Reset date checklist">
            <RotateCcw size={14} />
            <span>Reset {selectedDate}</span>
          </button>
        </div>
      </div>

      {/* Date-Wise Navigation & Session Controls */}
      <div className="checklist-toolbar-card">
        <div className="checklist-date-row">
          {/* Date Picker & Quick Actions */}
          <div className="checklist-date-picker-group">
            <div className="checklist-date-label">
              <Calendar size={14} color="var(--accent-cyan)" />
              <span>Testing Date:</span>
            </div>

            <input
              type="date"
              className="checklist-date-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            <button
              className={`checklist-preset-btn ${isToday ? 'active-today' : ''}`}
              onClick={() => setSelectedDate(getTodayLocal())}
            >
              Today
            </button>

            <button
              className={`checklist-preset-btn ${isYesterday ? 'active-today' : ''}`}
              onClick={() => setSelectedDate(getYesterdayLocal())}
            >
              Yesterday
            </button>

            <button
              className="checklist-preset-btn"
              onClick={handleCopyFromPrevious}
              title="Carry forward tested items from previous session"
            >
              <Copy size={13} />
              <span>Copy Previous</span>
            </button>
          </div>

          {/* Sync & Auto-Save Feedback */}
          <div className="checklist-actions-group">
            {historySessions.length > 0 && (
              <select
                className="checklist-date-input"
                style={{ fontSize: '12px' }}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              >
                <option value={selectedDate}>Jump to Recorded Date...</option>
                {historySessions.map((s, i) => (
                  <option key={i} value={s.sessionDate}>
                    {s.sessionDate} • {s.testedCount}/{s.totalCount || 30} Tested ({s.username})
                  </option>
                ))}
              </select>
            )}

            <button
              className="cyber-btn cyber-btn-primary"
              onClick={() => saveSessionData()}
              disabled={loading || saveStatus === 'saving'}
              style={{ padding: '7px 14px', fontSize: '12px' }}
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw size={13} className="spin" />
                  <span>Syncing...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check size={13} />
                  <span>Synced to SOC!</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>Save & Sync SOC</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Target Scope Information Bar */}
      <div className="checklist-scope-card">
        <div className="scope-input-box">
          <label>Audit Target URL / Scope Endpoint</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="e.g. https://cyber.gov.in or APK Package"
              value={targetUrl}
              onChange={(e) => {
                setTargetUrl(e.target.value);
                saveSessionData(checkedMap, e.target.value, projectName, sessionNotes);
              }}
            />
            {projectsList.length > 0 && (
              <select
                style={{ maxWidth: '180px' }}
                onChange={(e) => {
                  const p = projectsList.find(x => x.id === parseInt(e.target.value, 10));
                  if (p) {
                    setTargetUrl(p.target_url);
                    setProjectName(p.project_name);
                    saveSessionData(checkedMap, p.target_url, p.project_name, sessionNotes);
                  }
                }}
              >
                <option value="">Link Project...</option>
                {projectsList.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="scope-input-box">
          <label>Testing Analyst</label>
          <input
            type="text"
            readOnly
            value={user?.username ? `${user.name || user.username} (${user.role})` : 'Security Analyst'}
            style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}
          />
        </div>

        <div className="scope-input-box">
          <label>Session Notes / Environment</label>
          <input
            type="text"
            placeholder="e.g. Staging build v2.4, internal VPN"
            value={sessionNotes}
            onChange={(e) => {
              setSessionNotes(e.target.value);
              saveSessionData(checkedMap, targetUrl, projectName, e.target.value);
            }}
          />
        </div>
      </div>

      {/* Daily Progress Metrics Grid */}
      <div className="checklist-metrics-grid">
        <div className="checklist-metric-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="metric-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="metric-data-wrap">
            <span className="metric-label-text">PASSED / SECURE</span>
            <div className="metric-number-text" style={{ color: '#10b981' }}>{passedCount}</div>
            <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Verified Clean</small>
          </div>
        </div>

        <div className="checklist-metric-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="metric-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <Flame size={22} />
          </div>
          <div className="metric-data-wrap">
            <span className="metric-label-text">VULNERABILITIES FOUND</span>
            <div className="metric-number-text" style={{ color: '#ef4444' }}>{failedCount}</div>
            <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Requires Mitigation</small>
          </div>
        </div>

        <div className="checklist-metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="metric-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <Clock size={22} />
          </div>
          <div className="metric-data-wrap">
            <span className="metric-label-text">REMAINING TO AUDIT</span>
            <div className="metric-number-text" style={{ color: '#f59e0b' }}>{remainingCount}</div>
            <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Of {total} Standard Rules</small>
          </div>
        </div>

        <div className="checklist-metric-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <div className="metric-icon-wrap" style={{ background: 'rgba(2, 132, 199, 0.12)', color: 'var(--accent-cyan)' }}>
            <ShieldCheck size={22} />
          </div>
          <div className="metric-data-wrap" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label-text">SESSION PROGRESS</span>
              <strong style={{ color: 'var(--accent-cyan)', fontSize: '14px' }}>{Math.round(progressPct)}%</strong>
            </div>
            <div style={{ background: 'var(--bg-pill)', borderRadius: '10px', height: '8px', overflow: 'hidden', marginTop: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{
                background: 'linear-gradient(90deg, var(--accent-cyan), #10b981)',
                width: `${progressPct}%`,
                height: '100%',
                borderRadius: '10px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <small style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {testedCount} of {total} items audited on {selectedDate}
            </small>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="checklist-search-filter-row">
        <div className="checklist-search-box">
          <Search size={16} color="var(--accent-cyan)" />
          <input
            type="text"
            placeholder="Search test rule, OWASP category (e.g. A01), CWE ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="checklist-tabs-group">
          {[
            { id: 'ALL', label: `All (${total})` },
            { id: 'PASSED', label: `Passed (${passedCount})` },
            { id: 'FAILED', label: `Vuln Found (${failedCount})` },
            { id: 'REMAINING', label: `Remaining (${remainingCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`checklist-tab-btn ${filterStatus === tab.id ? 'active' : ''}`}
              onClick={() => setFilterStatus(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Severity Filter Dropdown */}
        <select
          className="checklist-tab-btn"
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
        >
          <option value="ALL">All Severities</option>
          <option value="Critical">Critical Only</option>
          <option value="High">High Only</option>
          <option value="Medium">Medium Only</option>
          <option value="Low">Low Only</option>
        </select>
      </div>

      {/* Interactive Checklist Item Cards Grid */}
      <div className="checklist-cards-grid">
        {filteredVulns.map((v) => {
          const item = checkedMap[v.name];
          const status = item?.status || (item?.tested ? 'PASSED' : 'REMAINING');
          const isPassed = status === 'PASSED';
          const isFailed = status === 'FAILED';
          const cardStatusClass = isPassed ? 'status-passed' : isFailed ? 'status-failed' : 'status-pending';

          return (
            <div key={v.name} className={`checklist-vuln-card ${cardStatusClass}`}>
              <div>
                <div className="card-top-info">
                  <div className="card-title-text">{v.name}</div>
                </div>

                <div className="card-badges-row">
                  <span className={`badge-severity badge-${v.severity.toLowerCase()}`}>
                    {v.severity}
                  </span>
                  <span className="card-owasp-code">{v.owasp}</span>
                </div>

                {item?.timestamp && (
                  <div className="card-tested-time">
                    Tested on {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>

              {/* Note input when marked as vulnerable */}
              {isFailed && (
                <div>
                  <textarea
                    className="card-notes-field"
                    rows="2"
                    placeholder="Brief finding observation (URL endpoint, parameter, POC)..."
                    value={item?.note || ''}
                    onChange={(e) => updateItemNote(v.name, e.target.value)}
                    onBlur={() => saveSessionData(checkedMap, targetUrl, projectName, sessionNotes)}
                  />
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="card-status-toggles">
                <button
                  type="button"
                  className={`status-toggle-btn btn-pass ${isPassed ? 'selected' : ''}`}
                  onClick={() => setItemStatus(v.name, isPassed ? 'REMAINING' : 'PASSED')}
                  title="Mark as Secure / Passed"
                >
                  <CheckCircle2 size={13} />
                  <span>{isPassed ? 'Passed ✓' : 'Pass'}</span>
                </button>

                <button
                  type="button"
                  className={`status-toggle-btn btn-fail ${isFailed ? 'selected' : ''}`}
                  onClick={() => setItemStatus(v.name, isFailed ? 'REMAINING' : 'FAILED')}
                  title="Mark as Vulnerability Found"
                >
                  <Flame size={13} />
                  <span>{isFailed ? 'Vuln Found ⚠️' : 'Vuln'}</span>
                </button>

                {(isPassed || isFailed) && (
                  <button
                    type="button"
                    className="status-toggle-btn btn-clear"
                    onClick={() => setItemStatus(v.name, 'REMAINING')}
                    title="Clear item test status"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
