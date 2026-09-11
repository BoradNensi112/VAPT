import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  ExternalLink,
  ShieldCheck,
  Plus,
  X,
  Sparkles,
  Flame,
  Bug,
  Award,
  Layers,
  CheckCircle2,
  Copy,
  Check,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Zap,
  Filter,
  Eye,
  Globe,
  ArrowRight,
  RefreshCw,
  Cpu,
  AlertTriangle,
  Calculator,
  Download,
  Shield,
  FileText
} from 'lucide-react';
import { SEVERITY_OPTIONS, OWASP_OPTIONS } from '../data/vulnerabilityData';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/knowledgeBase.css';

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // KB State
  const [kbList, setKbList] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Smart URL Recon State
  const [reconUrl, setReconUrl] = useState('');
  const [reconResults, setReconResults] = useState(null);
  const [filterToSuggested, setFilterToSuggested] = useState(false);

  // Modal & Edit State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedPocId, setCopiedPocId] = useState(null);

  // CVSS Calculator State
  const [showCvssModal, setShowCvssModal] = useState(false);
  const [cvssMetrics, setCvssMetrics] = useState({
    av: 'N', // N, A, L, P
    ac: 'L', // L, H
    pr: 'N', // N, L, H
    ui: 'N', // N, R
    s: 'U',  // U, C
    c: 'H',  // N, L, H
    i: 'H',  // N, L, H
    a: 'N'   // N, L, H
  });

  const [formData, setFormData] = useState({
    vulnerability_name: '',
    severity: 'High',
    owasp_category: 'A03:2021-Injection',
    cwe_number: 'CWE-79',
    cwe_url: 'https://cwe.mitre.org/data/definitions/79.html',
    cvss_score: '7.5',
    cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N',
    description: '',
    steps_to_reproduce: '1. Navigate to target endpoint.\n2. Execute proof-of-concept payload.\n3. Verify security flaw in response.',
    remediation: '1. Filter input on arrival.\n2. Encode data on output.\n3. Enforce secure configuration.'
  });

  // Calculate CVSS v3.1 Base Score
  const calculatedCvss = useMemo(() => {
    const avWeights = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
    const acWeights = { L: 0.77, H: 0.44 };
    const uiWeights = { N: 0.85, R: 0.62 };
    const cWeights = { N: 0, L: 0.22, H: 0.56 };
    const iWeights = { N: 0, L: 0.22, H: 0.56 };
    const aWeights = { N: 0, L: 0.22, H: 0.56 };
    
    let prWeight = 0.85;
    if (cvssMetrics.s === 'U') {
      prWeight = cvssMetrics.pr === 'N' ? 0.85 : cvssMetrics.pr === 'L' ? 0.62 : 0.27;
    } else {
      prWeight = cvssMetrics.pr === 'N' ? 0.85 : cvssMetrics.pr === 'L' ? 0.68 : 0.50;
    }

    const iss = 1 - ((1 - cWeights[cvssMetrics.c]) * (1 - iWeights[cvssMetrics.i]) * (1 - aWeights[cvssMetrics.a]));
    let impact = 0;
    if (cvssMetrics.s === 'U') {
      impact = 6.42 * iss;
    } else {
      impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
    }

    const exploitability = 8.22 * avWeights[cvssMetrics.av] * acWeights[cvssMetrics.ac] * prWeight * uiWeights[cvssMetrics.ui];
    
    let baseScore = 0;
    if (impact > 0) {
      if (cvssMetrics.s === 'U') {
        baseScore = Math.min(10, Math.ceil(Math.min(impact + exploitability, 10) * 10) / 10);
      } else {
        baseScore = Math.min(10, Math.ceil(Math.min(1.08 * (impact + exploitability), 10) * 10) / 10);
      }
    }

    const vector = `CVSS:3.1/AV:${cvssMetrics.av}/AC:${cvssMetrics.ac}/PR:${cvssMetrics.pr}/UI:${cvssMetrics.ui}/S:${cvssMetrics.s}/C:${cvssMetrics.c}/I:${cvssMetrics.i}/A:${cvssMetrics.a}`;
    const severity = baseScore >= 9.0 ? 'Critical' : baseScore >= 7.0 ? 'High' : baseScore >= 4.0 ? 'Medium' : baseScore > 0 ? 'Low' : 'Low';

    return { baseScore: baseScore.toFixed(1), vector, severity };
  }, [cvssMetrics]);

  const applyCvssToForm = () => {
    setFormData(prev => ({
      ...prev,
      severity: calculatedCvss.severity,
      cvss_score: calculatedCvss.baseScore,
      cvss_vector: calculatedCvss.vector
    }));
    setShowCvssModal(false);
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(kbList, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VAPT_KnowledgeBase_Catalog_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchKB = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/kb?search=${encodeURIComponent(search)}&severity=${selectedSeverity}`);
      if (res.data.success) {
        setKbList(res.data.items || res.data.knowledgeBase || []);
      }
    } catch (err) {
      console.error('Error fetching KB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKB();
  }, [search, selectedSeverity]);

  // Smart URL Recon Engine
  const runSmartRecon = (urlToAnalyze) => {
    const target = (urlToAnalyze || reconUrl || '').trim().toLowerCase();
    if (!target) {
      setReconResults(null);
      setFilterToSuggested(false);
      return;
    }

    const suggestions = [];
    if (target.startsWith('http://') || !target.startsWith('https://')) {
      suggestions.push({
        matchKey: 'hsts',
        name: 'Missing Strict-Transport-Security (HSTS) Header',
        reason: 'Target is served over cleartext HTTP or lacks HSTS enforcement.',
        confidence: 'HIGH'
      });
      suggestions.push({
        matchKey: 'cleartext',
        name: 'Cleartext Transmission of Sensitive Information',
        reason: 'Unencrypted communication channels exposed to MitM interception.',
        confidence: 'CRITICAL'
      });
    }

    if (target.includes('login') || target.includes('auth') || target.includes('signin') || target.includes('admin')) {
      suggestions.push({
        matchKey: 'brute',
        name: 'Insufficient Rate Limiting on Authentication Endpoint',
        reason: 'Login/Auth interface detected. Verify lockouts, CAPTCHAs, and brute-force defenses.',
        confidence: 'HIGH'
      });
      suggestions.push({
        matchKey: 'csrf',
        name: 'Cross-Site Request Forgery (CSRF)',
        reason: 'Authentication endpoint may accept forged requests without anti-CSRF token.',
        confidence: 'HIGH'
      });
    }

    if (target.includes('api') || target.includes('/v1') || target.includes('/v2') || target.includes('graphql') || target.includes('.json')) {
      suggestions.push({
        matchKey: 'bopla',
        name: 'Broken Object Property Level Authorization (BOPLA)',
        reason: 'REST / GraphQL API endpoint detected. Check for unauthorized object property updates.',
        confidence: 'CRITICAL'
      });
      suggestions.push({
        matchKey: 'cors',
        name: 'Cross-Origin Resource Sharing (CORS) Misconfiguration',
        reason: 'APIs often reflect arbitrary origins with Access-Control-Allow-Credentials: true.',
        confidence: 'HIGH'
      });
    }

    if (target.includes('upload') || target.includes('file') || target.includes('attach') || target.includes('media')) {
      suggestions.push({
        matchKey: 'upload',
        name: 'Unrestricted File Upload (Remote Code Execution)',
        reason: 'File upload handler detected. Verify extension whitelisting, MIME types, and storage location.',
        confidence: 'CRITICAL'
      });
    }

    setReconResults({
      analyzedTarget: target,
      suggestionsCount: suggestions.length,
      suggestions
    });
  };

  const handleClearRecon = () => {
    setReconUrl('');
    setReconResults(null);
    setFilterToSuggested(false);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      vulnerability_name: '',
      severity: 'High',
      owasp_category: 'A03:2021-Injection',
      cwe_number: 'CWE-79',
      cwe_url: 'https://cwe.mitre.org/data/definitions/79.html',
      cvss_score: '7.5',
      cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N',
      description: '',
      steps_to_reproduce: '1. Navigate to target endpoint.\n2. Execute proof-of-concept payload.\n3. Verify security flaw in response.',
      remediation: '1. Filter input on arrival.\n2. Encode data on output.\n3. Enforce secure configuration.'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      vulnerability_name: item.vulnerability_name || '',
      severity: item.severity || 'High',
      owasp_category: item.owasp_category || 'A03:2021-Injection',
      cwe_number: item.cwe_number || 'CWE-79',
      cwe_url: item.cwe_url || '',
      cvss_score: item.cvss_score || '7.5',
      cvss_vector: item.cvss_vector || 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N',
      description: item.description || '',
      steps_to_reproduce: item.steps_to_reproduce || '',
      remediation: item.remediation || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const res = await api.put(`/kb/${editingItem.id}`, formData);
        if (res.data.success) {
          setShowModal(false);
          fetchKB();
        }
      } else {
        const res = await api.post('/kb', formData);
        if (res.data.success) {
          setShowModal(false);
          fetchKB();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving vulnerability');
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to remove '${item.vulnerability_name}' from the Knowledge Base?`)) {
      try {
        const res = await api.delete(`/kb/${item.id}`);
        if (res.data.success) {
          fetchKB();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting vulnerability');
      }
    }
  };

  
  const handleCopyPoc = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPocId(id);
    setTimeout(() => setCopiedPocId(null), 2000);
  };
  
  const handleCopyRemediation = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Dynamic Statistics
  const stats = useMemo(() => {
    const total = kbList.length;
    const crit = kbList.filter(k => k.severity === 'Critical').length;
    const high = kbList.filter(k => k.severity === 'High').length;
    const med = kbList.filter(k => k.severity === 'Medium').length;
    const low = kbList.filter(k => k.severity === 'Low').length;

    const uniqueOwasp = new Set(kbList.map(k => (k.owasp_category || '').split('-')[0].trim()).filter(Boolean));
    const owaspCoverage = Math.min(100, Math.round((uniqueOwasp.size / 10) * 100));

    return { total, crit, high, med, low, owaspCoverage };
  }, [kbList]);

  // Filtered List
  const filteredList = useMemo(() => {
    let list = kbList;

    if (filterToSuggested && reconResults?.suggestions) {
      const suggestedNames = reconResults.suggestions.map(s => s.name.toLowerCase());
      list = list.filter(k => 
        suggestedNames.some(sn => 
          k.vulnerability_name.toLowerCase().includes(sn) ||
          sn.includes(k.vulnerability_name.toLowerCase())
        )
      );
    }

    if (categoryFilter === 'ALL') return list;
    if (categoryFilter === 'CRITICAL') return list.filter(k => k.severity === 'Critical');
    if (categoryFilter === 'HIGH') return list.filter(k => k.severity === 'High');
    if (categoryFilter === 'MEDIUM') return list.filter(k => k.severity === 'Medium');
    if (categoryFilter === 'LOW') return list.filter(k => k.severity === 'Low');
    if (categoryFilter === 'INJECTION') return list.filter(k => (k.owasp_category || '').includes('A03') || (k.vulnerability_name || '').toLowerCase().includes('sql') || (k.vulnerability_name || '').toLowerCase().includes('xss'));
    if (categoryFilter === 'ACCESS') return list.filter(k => (k.owasp_category || '').includes('A01') || (k.vulnerability_name || '').toLowerCase().includes('auth') || (k.vulnerability_name || '').toLowerCase().includes('idor'));
    if (categoryFilter === 'MISCONFIG') return list.filter(k => (k.owasp_category || '').includes('A05') || (k.vulnerability_name || '').toLowerCase().includes('header') || (k.vulnerability_name || '').toLowerCase().includes('cors'));
    return list;
  }, [kbList, categoryFilter, filterToSuggested, reconResults]);

  const isSuggestedItem = (itemName) => {
    if (!reconResults?.suggestions) return false;
    const n = (itemName || '').toLowerCase();
    return reconResults.suggestions.some(s => 
      n.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(n)
    );
  };

  return (
    <div className="page-wrapper kb-container">
      {/* 1. TOP HEADER BANNER */}
      <div className="kb-header-panel">
        <div className="kb-title-group">
          <h1>
            <BookOpen color="#00E5FF" size={28} />
            Vulnerability Knowledge Base & Threat Encyclopedia
          </h1>
          <p>Standardized repository of OWASP Top 10 flaws, MITRE CWE mappings, CVSS v3.1 metrics & CERT-In compliance playbooks.</p>
        </div>

        <div className="kb-header-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowCvssModal(true)}
            className="cyber-btn cyber-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderColor: 'var(--accent-cyan)' }}
          >
            <Calculator size={16} />
            <span>CVSS v3.1 Calculator</span>
          </button>

          <button
            onClick={handleExportJson}
            className="cyber-btn cyber-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={16} />
            <span>Export KB (JSON)</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="cyber-btn cyber-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              <span>Add Vulnerability</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 🤖 SMART TARGET URL RECON & AUTO-SUGGESTION ENGINE */}
      <div className="kb-recon-panel">
        <div className="kb-recon-header">
          <div className="kb-recon-title">
            <Sparkles size={18} color="#00E5FF" />
            <h3>Smart URL Recon & Threat Auto-Suggestion Engine</h3>
          </div>
          <span className="kb-recon-badge">AI Scope Heuristics</span>
        </div>

        <div className="kb-recon-input-row">
          <div className="kb-recon-input-wrap">
            <Globe size={16} className="kb-recon-icon" />
            <input
              type="text"
              className="kb-recon-input"
              placeholder="Enter Target URL to Auto-Suggest Flaws (e.g. http://target.gov.in/login, /api/v1/user, upload.php)..."
              value={reconUrl}
              onChange={(e) => {
                setReconUrl(e.target.value);
                if (e.target.value.trim().length > 3) {
                  runSmartRecon(e.target.value);
                } else if (!e.target.value.trim()) {
                  handleClearRecon();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSmartRecon();
              }}
            />
          </div>

          <button
            type="button"
            className="kb-recon-btn"
            onClick={() => runSmartRecon()}
          >
            <Zap size={15} />
            <span>Analyze & Suggest</span>
          </button>

          {reconUrl && (
            <button
              type="button"
              className="kb-recon-clear-btn"
              onClick={handleClearRecon}
            >
              Reset
            </button>
          )}
        </div>

        {/* Suggested Vulnerabilities Results Tray */}
        {reconResults && (
          <div className="kb-suggestions-tray">
            <div className="kb-tray-header">
              <div className="kb-tray-title">
                <Cpu size={16} color="#00E5FF" />
                <span>Detected Scope Vectors ({reconResults.suggestionsCount} Recommended Checks)</span>
              </div>
              <button
                type="button"
                className={`kb-filter-toggle-btn ${filterToSuggested ? 'active' : ''}`}
                onClick={() => setFilterToSuggested(!filterToSuggested)}
              >
                <Filter size={13} />
                <span>{filterToSuggested ? 'Showing Suggested Only' : 'Filter KB to Suggested Only'}</span>
              </button>
            </div>

            <div className="kb-suggested-chips-grid">
              {reconResults.suggestions.map((s, idx) => (
                <div key={idx} className={`kb-suggestion-chip ${s.confidence.toLowerCase()}`}>
                  <div className="kb-chip-top">
                    <span className="kb-chip-name">{s.name}</span>
                    <span className={`kb-confidence-tag ${s.confidence.toLowerCase()}`}>{s.confidence} RELEVANCE</span>
                  </div>
                  <p className="kb-chip-reason">{s.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. METRIC STATS STRIP */}
      <div className="kb-stats-grid">
        <div className="kb-stat-card">
          <div className="kb-stat-icon-wrap blue">
            <BookOpen size={20} color="#00E5FF" />
          </div>
          <div className="kb-stat-info">
            <span className="kb-stat-val">{stats.total}</span>
            <span className="kb-stat-lbl">Cataloged Vulnerabilities</span>
          </div>
        </div>

        <div className="kb-stat-card">
          <div className="kb-stat-icon-wrap red">
            <Flame size={20} color="#FF0055" />
          </div>
          <div className="kb-stat-info">
            <span className="kb-stat-val red">{stats.crit}</span>
            <span className="kb-stat-lbl">Critical Severity CVEs</span>
          </div>
        </div>

        <div className="kb-stat-card">
          <div className="kb-stat-icon-wrap orange">
            <AlertTriangle size={20} color="#FF9900" />
          </div>
          <div className="kb-stat-info">
            <span className="kb-stat-val orange">{stats.high}</span>
            <span className="kb-stat-lbl">High Severity Flaws</span>
          </div>
        </div>

        <div className="kb-stat-card">
          <div className="kb-stat-icon-wrap green">
            <ShieldCheck size={20} color="#14F195" />
          </div>
          <div className="kb-stat-info">
            <span className="kb-stat-val green">{stats.owaspCoverage}%</span>
            <span className="kb-stat-lbl">OWASP Top 10 Coverage</span>
          </div>
        </div>
      </div>

      {/* 4. FILTER PILLS & SEARCH */}
      <div className="kb-controls-bar">
        <div className="kb-search-wrap">
          <Search size={16} className="kb-search-icon" />
          <input
            type="text"
            className="kb-search-input"
            placeholder="Search by vulnerability name, CWE ID, OWASP, or remediation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="kb-pills-row">
          {[
            { id: 'ALL', label: 'All Categories' },
            { id: 'CRITICAL', label: '🔴 Critical' },
            { id: 'HIGH', label: '🟠 High' },
            { id: 'MEDIUM', label: '🟡 Medium' },
            { id: 'INJECTION', label: '💉 Injection (SQLi/XSS)' },
            { id: 'ACCESS', label: '🛡️ Access Control' },
            { id: 'MISCONFIG', label: '⚙️ Misconfigurations' }
          ].map(p => (
            <button
              key={p.id}
              type="button"
              className={`kb-pill-btn ${categoryFilter === p.id ? 'active' : ''}`}
              onClick={() => setCategoryFilter(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. VULNERABILITY CARDS GRID */}
      <div className="kb-cards-grid">
        {loading ? (
          <div className="kb-loading-state">
            <RefreshCw size={24} className="spin-icon" color="#00E5FF" />
            <span>Loading Knowledge Base Repository...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="kb-empty-state">
            <ShieldCheck size={32} color="#64748b" />
            <p>No vulnerabilities match your search query or filter criteria.</p>
          </div>
        ) : (
          filteredList.map((item) => {
            const isSuggested = isSuggestedItem(item.vulnerability_name);
            const sev = (item.severity || 'Medium').toLowerCase();

            return (
              <div
                key={item.id}
                className={`kb-vuln-card ${sev} ${isSuggested ? 'suggested-glow' : ''}`}
              >
                {/* Header Strip */}
                <div className="kb-card-head">
                  <div className="kb-card-badges">
                    <span className={`sev-tag ${sev}`}>
                      {item.severity || 'MEDIUM'}
                    </span>
                    <span className="cwe-tag">{item.cwe_number || 'CWE-200'}</span>
                    <span className="owasp-tag">{(item.owasp_category || 'OWASP').split('-')[0].trim()}</span>
                    {item.cvss_score && (
                      <span className="cvss-tag">CVSS {item.cvss_score}</span>
                    )}
                  </div>

                  {isSuggested && (
                    <span className="kb-suggested-indicator">
                      <Sparkles size={12} /> Auto-Suggested
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="kb-vuln-name">{item.vulnerability_name}</h3>

                {/* Compliance Badges Strip */}
                <div className="kb-compliance-badges-strip" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0' }}>
                  <span className="compliance-chip cert-in" style={{ fontSize: '10.5px', padding: '2px 6px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '4px', fontWeight: 700 }}>
                    CERT-In SecGuideline
                  </span>
                  <span className="compliance-chip asvs" style={{ fontSize: '10.5px', padding: '2px 6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '4px', fontWeight: 700 }}>
                    OWASP ASVS v4.0
                  </span>
                  <span className="compliance-chip iso" style={{ fontSize: '10.5px', padding: '2px 6px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', borderRadius: '4px', fontWeight: 700 }}>
                    ISO 27001 Annex A
                  </span>
                </div>

                {/* Description */}
                <p className="kb-vuln-desc">{item.description}</p>

                {/* PoC Steps */}
                {item.steps_to_reproduce && (
                  <div className="kb-section-box">
                    <div className="kb-section-title-row">
                      <span className="kb-section-title" style={{ color: '#f59e0b' }}>
                        <Zap size={12} /> Steps to Reproduce (PoC)
                      </span>
                      <button
                        className="kb-copy-btn"
                        onClick={() => handleCopyPoc(item.id, item.steps_to_reproduce)}
                      >
                        {copiedPocId === item.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                        <span>{copiedPocId === item.id ? 'Copied' : 'Copy PoC'}</span>
                      </button>
                    </div>
                    <div className="kb-code-snippet">
                      {item.steps_to_reproduce}
                    </div>
                  </div>
                )}

                {/* Standard Remediation Guidance */}
                <div className="kb-section-box">
                  <div className="kb-section-title-row">
                    <span className="kb-section-title" style={{ color: '#14F195' }}>
                      <CheckCircle2 size={12} /> Standard Remediation
                    </span>
                    <button
                      className="kb-copy-btn"
                      onClick={() => handleCopyRemediation(item.id, item.remediation)}
                    >
                      {copiedId === item.id ? <Check size={12} color="#14F195" /> : <Copy size={12} />}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy Fix'}</span>
                    </button>
                  </div>
                  <div className="kb-code-snippet" style={{ color: 'var(--text-secondary)' }}>
                    {item.remediation}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="kb-card-footer">
                  {item.cwe_url ? (
                    <a
                      href={item.cwe_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ext-link-btn"
                    >
                      MITRE Advisory <ExternalLink size={11} />
                    </a>
                  ) : <span />}

                  {isAdmin && (
                    <div className="kb-footer-actions">
                      <button
                        className="kb-action-icon-btn"
                        title="Edit Vulnerability in KB"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        className="kb-action-icon-btn danger"
                        title="Delete from KB"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. CVSS v3.1 CALCULATOR MODAL */}
      {showCvssModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={22} color="var(--accent-cyan)" />
                <h3 style={{ color: 'var(--text-main)', margin: 0 }}>
                  FIRST CVSS v3.1 Interactive Base Score Calculator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCvssModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="cvss-calc-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
              {/* Score Display Banner */}
              <div className="cvss-score-banner" style={{
                background: calculatedCvss.severity === 'Critical' ? 'rgba(239, 68, 68, 0.12)' : calculatedCvss.severity === 'High' ? 'rgba(249, 115, 22, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                border: `1px solid ${calculatedCvss.severity === 'Critical' ? '#ef4444' : calculatedCvss.severity === 'High' ? '#f97316' : '#eab308'}`,
                borderRadius: '10px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Calculated Base Score</span>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)' }}>
                    {calculatedCvss.baseScore} <span style={{ fontSize: '16px', fontWeight: 700, color: calculatedCvss.severity === 'Critical' ? '#ef4444' : '#f97316' }}>{calculatedCvss.severity.toUpperCase()}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Vector String</span>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--accent-cyan)' }}>
                    {calculatedCvss.vector}
                  </div>
                </div>
              </div>

              {/* Metric Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {/* Attack Vector */}
                <div className="calc-metric-box">
                  <label className="field-label">Attack Vector (AV)</label>
                  <div className="calc-metric-pills">
                    {[
                      { id: 'N', label: 'Network (N)' },
                      { id: 'A', label: 'Adjacent (A)' },
                      { id: 'L', label: 'Local (L)' },
                      { id: 'P', label: 'Physical (P)' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        className={`metric-pill-btn ${cvssMetrics.av === m.id ? 'active' : ''}`}
                        onClick={() => setCvssMetrics({ ...cvssMetrics, av: m.id })}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attack Complexity */}
                <div className="calc-metric-box">
                  <label className="field-label">Attack Complexity (AC)</label>
                  <div className="calc-metric-pills">
                    {[
                      { id: 'L', label: 'Low (L)' },
                      { id: 'H', label: 'High (H)' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        className={`metric-pill-btn ${cvssMetrics.ac === m.id ? 'active' : ''}`}
                        onClick={() => setCvssMetrics({ ...cvssMetrics, ac: m.id })}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privileges Required */}
                <div className="calc-metric-box">
                  <label className="field-label">Privileges Required (PR)</label>
                  <div className="calc-metric-pills">
                    {[
                      { id: 'N', label: 'None (N)' },
                      { id: 'L', label: 'Low (L)' },
                      { id: 'H', label: 'High (H)' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        className={`metric-pill-btn ${cvssMetrics.pr === m.id ? 'active' : ''}`}
                        onClick={() => setCvssMetrics({ ...cvssMetrics, pr: m.id })}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* User Interaction */}
                <div className="calc-metric-box">
                  <label className="field-label">User Interaction (UI)</label>
                  <div className="calc-metric-pills">
                    {[
                      { id: 'N', label: 'None (N)' },
                      { id: 'R', label: 'Required (R)' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        className={`metric-pill-btn ${cvssMetrics.ui === m.id ? 'active' : ''}`}
                        onClick={() => setCvssMetrics({ ...cvssMetrics, ui: m.id })}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scope */}
                <div className="calc-metric-box">
                  <label className="field-label">Scope (S)</label>
                  <div className="calc-metric-pills">
                    {[
                      { id: 'U', label: 'Unchanged (U)' },
                      { id: 'C', label: 'Changed (C)' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        className={`metric-pill-btn ${cvssMetrics.s === m.id ? 'active' : ''}`}
                        onClick={() => setCvssMetrics({ ...cvssMetrics, s: m.id })}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confidentiality */}
                <div className="calc-metric-box">
                  <label className="field-label">Confidentiality (C)</label>
                  <div className="calc-metric-pills">
                    {[
                      { id: 'N', label: 'None (N)' },
                      { id: 'L', label: 'Low (L)' },
                      { id: 'H', label: 'High (H)' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        className={`metric-pill-btn ${cvssMetrics.c === m.id ? 'active' : ''}`}
                        onClick={() => setCvssMetrics({ ...cvssMetrics, c: m.id })}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Integrity */}
                <div className="calc-metric-box">
                  <label className="field-label">Integrity (I)</label>
                  <div className="calc-metric-pills">
                    {[
                      { id: 'N', label: 'None (N)' },
                      { id: 'L', label: 'Low (L)' },
                      { id: 'H', label: 'High (H)' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        className={`metric-pill-btn ${cvssMetrics.i === m.id ? 'active' : ''}`}
                        onClick={() => setCvssMetrics({ ...cvssMetrics, i: m.id })}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div className="calc-metric-box">
                  <label className="field-label">Availability (A)</label>
                  <div className="calc-metric-pills">
                    {[
                      { id: 'N', label: 'None (N)' },
                      { id: 'L', label: 'Low (L)' },
                      { id: 'H', label: 'High (H)' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        className={`metric-pill-btn ${cvssMetrics.a === m.id ? 'active' : ''}`}
                        onClick={() => setCvssMetrics({ ...cvssMetrics, a: m.id })}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCvssModal(false)}
                  className="cyber-btn cyber-btn-secondary"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={applyCvssToForm}
                  className="cyber-btn cyber-btn-primary"
                >
                  Apply Score ({calculatedCvss.baseScore} - {calculatedCvss.severity}) to Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. ADD / EDIT VULNERABILITY MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#00E5FF" />
                <h3 style={{ color: 'var(--text-main)', margin: 0 }}>
                  {editingItem ? 'Edit Knowledge Base Vulnerability' : 'Add New Vulnerability to Knowledge Base'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              <div className="form-group">
                <label className="form-label">VULNERABILITY NAME *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Broken Object Property Level Authorization (BOPLA)"
                  value={formData.vulnerability_name}
                  onChange={(e) => setFormData({ ...formData, vulnerability_name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">SEVERITY</label>
                    <button
                      type="button"
                      onClick={() => setShowCvssModal(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
                    >
                      Calculate CVSS
                    </button>
                  </div>
                  <select
                    className="form-select"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">OWASP CATEGORY</label>
                  <select
                    className="form-select"
                    value={formData.owasp_category}
                    onChange={(e) => setFormData({ ...formData, owasp_category: e.target.value })}
                  >
                    {OWASP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">CWE NUMBER</label>
                  <input
                    type="text"
                    className="form-input mono"
                    placeholder="e.g. CWE-863"
                    value={formData.cwe_number}
                    onChange={(e) => setFormData({
                      ...formData,
                      cwe_number: e.target.value,
                      cwe_url: `https://cwe.mitre.org/data/definitions/${e.target.value.replace(/[^0-9]/g, '')}.html`
                    })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">DESCRIPTION & THREAT IMPACT</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Describe the vulnerability, root cause, and threat impact..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">STEPS TO REPRODUCE (PoC)</label>
                <textarea
                  className="form-textarea mono"
                  rows="3"
                  value={formData.steps_to_reproduce}
                  onChange={(e) => setFormData({ ...formData, steps_to_reproduce: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">STANDARD REMEDIATION GUIDANCE</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={formData.remediation}
                  onChange={(e) => setFormData({ ...formData, remediation: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cyber-btn cyber-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="cyber-btn cyber-btn-primary">
                  {editingItem ? 'Save Changes' : 'Save to Knowledge Base'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
