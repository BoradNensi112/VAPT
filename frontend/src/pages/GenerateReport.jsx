import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ExcelJS from 'exceljs';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Search,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Save,
  Building2,
  Users,
  X,
  Sparkles
} from 'lucide-react';

import {
  DEPARTMENTS,
  DEPARTMENT_DIRECTORS,
  ANALYSTS as DEFAULT_ANALYSTS,
  REMARK_OPTIONS,
  SEVERITY_OPTIONS,
  OWASP_OPTIONS,
  VULNERABILITIES as DEFAULT_VULNERABILITIES
} from '../data/vulnerabilityData';
import api from '../services/api';
import { generateVaptPdfReport } from '../services/pdfExportService';
import { downloadVaptExcelReport } from '../services/excelExportService';
import '../styles/reportGenerator.css';

const SEVERITY_ORDER = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3
};

const getToday = () => new Date().toISOString().slice(0, 10);

const formatDate = (val) => {
  if (!val) return '';
  const d = new Date(val);
  return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

export default function GenerateReport() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [vulnerabilities, setVulnerabilities] = useState(DEFAULT_VULNERABILITIES);
  const [analystsList, setAnalystsList] = useState(DEFAULT_ANALYSTS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Dynamic Add Analyst Inline State
  const [isAddingAnalyst, setIsAddingAnalyst] = useState(false);
  const [newAnalystName, setNewAnalystName] = useState('');

  // Dynamic Add Custom Vulnerability Modal State
  const [showAddVulnModal, setShowAddVulnModal] = useState(false);
  const [newVulnForm, setNewVulnForm] = useState({
    name: '',
    severity: 'High',
    owasp: 'A03:2021-Injection',
    cwe_ref: 'CWE-79',
    cwe_ref_url: 'https://cwe.mitre.org/data/definitions/79.html',
    desc: '',
    steps: '1. Navigate to $$ endpoint.\n2. Inject custom security payload.\n3. Observe unauthorized behavior in response.',
    remediation: '1. Enforce strict input validation.\n2. Sanitize and encode output.\n3. Implement defense-in-depth security controls.'
  });

  // Project Information
  const [project, setProject] = useState({
    projectName: '',
    department: 'Software',
    projectUrl: '',
    assessmentDate: getToday(),
    analysts: ['Ankit Nandaniya', 'Arpan Goswami'],
    projectManager: 'ABCD, WXYZ',
    concernProjectManager: 'Shri ',
    concernDirector: 'Shri Krunal Patel',
    cisoName: 'Shri ABCD'
  });

  // Remarks
  const [remarks, setRemarks] = useState([REMARK_OPTIONS[0]]);
  const [scopeType, setScopeType] = useState('Web Application VAPT');

  // Previous Reference
  const [includePrevious, setIncludePrevious] = useState(false);
  const [previousDate, setPreviousDate] = useState('2026-08-04');
  const [previousName, setPreviousName] = useState('');
  const [previousStatus, setPreviousStatus] = useState('Open');

  // Load dynamic data from backend (KB and Analysts) + Existing Project if projectId query param
  useEffect(() => {
    // 1. Fetch Dynamic Analysts
    api.get('/analysts')
      .then(res => {
        if (res.data.success && res.data.analysts?.length > 0) {
          const names = res.data.analysts.map(a => a.name);
          setAnalystsList(names);
        }
      })
      .catch(err => {
        console.warn('Using default analysts fallback:', err.message);
      });

    // 2. Fetch Dynamic Knowledge Base
    api.get('/kb')
      .then(res => {
        if (res.data.success && res.data.items?.length > 0) {
          const mapped = res.data.items.map(k => ({
            id: k.id,
            name: k.vulnerability_name,
            severity: k.severity,
            reportSeverity: k.severity,
            owasp: k.owasp_category,
            cwe_ref: k.cwe_number,
            cwe_ref_url: k.cwe_url,
            reference: k.reference || k.vulnerability_name,
            reference_url: k.cwe_url,
            desc: k.description,
            steps: k.steps_to_reproduce,
            remediation: k.remediation
          }));
          setVulnerabilities(mapped);
        }
      })
      .catch(err => {
        console.warn('Using default vulnerability dataset fallback:', err.message);
      });

    // 3. Load Existing Project Data if editing via Manage Findings (?projectId=...)
    if (projectId) {
      api.get(`/projects/${projectId}`)
        .then(res => {
          if (res.data.success && res.data.project) {
            const p = res.data.project;
            setProject({
              projectName: p.project_name || '',
              department: p.department || 'Software',
              projectUrl: p.target_url || '',
              assessmentDate: getToday(),
              analysts: p.security_analysts ? p.security_analysts.split(',').map(s => s.trim()) : [],
              projectManagers: p.project_managers || 'Concern Project Manager: N/A'
            });

            if (p.remarks) {
              setRemarks(p.remarks.split('\n'));
            }

            if (res.data.findings && res.data.findings.length > 0) {
              const mappedSelected = res.data.findings.map(f => ({
                id: f.id,
                name: f.vulnerability_name,
                severity: f.severity,
                reportSeverity: f.severity,
                owasp: f.owasp_category,
                cwe_ref: f.cwe_number,
                cwe_ref_url: f.cwe_url,
                reference: f.reference || f.vulnerability_name,
                reference_url: f.cwe_url,
                desc: f.description,
                steps: f.steps_to_reproduce,
                remediation: f.remediation,
                status: f.status || 'Open'
              }));
              setSelected(mappedSelected);
              setExpanded(mappedSelected[0]?.name || null);
            }
            setMessage(`Loaded existing assessment: "${p.project_name}" with ${res.data.findings?.length || 0} finding(s)`);
            setTimeout(() => setMessage(''), 4000);
          }
        })
        .catch(err => {
          console.error('Error loading existing project:', err);
        });
    }
  }, [projectId]);

  // Filter vulnerabilities
  const filteredVulnerabilities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vulnerabilities;
    return vulnerabilities.filter(v =>
      [v.name, v.severity, v.owasp, v.cwe_ref, v.reference].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [search, vulnerabilities]);

  const selectedMap = useMemo(() => {
    return new Map(selected.map(item => [item.name, item]));
  }, [selected]);

  // Counts
  const counts = useMemo(() => {
    const res = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    selected.forEach(item => {
      const s = item.reportSeverity || item.severity || 'Low';
      if (res[s] !== undefined) res[s]++;
    });
    return res;
  }, [selected]);

  const toggleFinding = (vuln) => {
    if (selectedMap.has(vuln.name)) {
      setSelected(items => items.filter(i => i.name !== vuln.name));
      if (expanded === vuln.name) setExpanded(null);
    } else {
      const newFinding = {
        ...vuln,
        reportSeverity: vuln.reportSeverity || vuln.severity || 'Low',
        steps: vuln.steps || '',
        desc: vuln.desc || '',
        remediation: vuln.remediation || ''
      };
      setSelected(items => [...items, newFinding]);
      setExpanded(vuln.name);
    }
  };

  const updateFinding = (name, changes) => {
    setSelected(items => items.map(item => (item.name === name ? { ...item, ...changes } : item)));
  };

  const selectVisible = () => {
    const newItems = filteredVulnerabilities
      .filter(v => !selectedMap.has(v.name))
      .map(v => ({ ...v, reportSeverity: v.severity || 'Low' }));
    setSelected(items => [...items, ...newItems]);
  };

  const clearAll = () => {
    setSelected([]);
    setExpanded(null);
  };

  // Handle Dynamic Analyst Addition
  const handleAddCustomAnalyst = async (e) => {
    e.preventDefault();
    const cleanName = newAnalystName.trim();
    if (!cleanName) return;

    try {
      await api.post('/analysts', { name: cleanName, department: project.department });
      
      if (!analystsList.includes(cleanName)) {
        setAnalystsList(prev => [...prev, cleanName]);
      }
      if (!project.analysts.includes(cleanName)) {
        setProject(prev => ({ ...prev, analysts: [...prev.analysts, cleanName] }));
      }
      
      setNewAnalystName('');
      setIsAddingAnalyst(false);
      setMessage(`Analyst '${cleanName}' added dynamically & selected!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      if (!analystsList.includes(cleanName)) {
        setAnalystsList(prev => [...prev, cleanName]);
      }
      if (!project.analysts.includes(cleanName)) {
        setProject(prev => ({ ...prev, analysts: [...prev.analysts, cleanName] }));
      }
      setNewAnalystName('');
      setIsAddingAnalyst(false);
    }
  };

  // Handle Dynamic Custom Vulnerability Creation
  const handleCreateCustomVulnerability = async (e) => {
    e.preventDefault();
    if (!newVulnForm.name.trim()) {
      alert('Please enter a Vulnerability Name');
      return;
    }

    try {
      const res = await api.post('/kb', {
        vulnerability_name: newVulnForm.name.trim(),
        severity: newVulnForm.severity,
        owasp_category: newVulnForm.owasp,
        cwe_number: newVulnForm.cwe_ref,
        cwe_url: newVulnForm.cwe_ref_url,
        description: newVulnForm.desc,
        steps_to_reproduce: newVulnForm.steps,
        remediation: newVulnForm.remediation
      });

      const savedVuln = {
        name: newVulnForm.name.trim(),
        severity: newVulnForm.severity,
        reportSeverity: newVulnForm.severity,
        owasp: newVulnForm.owasp,
        cwe_ref: newVulnForm.cwe_ref,
        cwe_ref_url: newVulnForm.cwe_ref_url,
        reference: newVulnForm.name.trim(),
        reference_url: newVulnForm.cwe_ref_url,
        desc: newVulnForm.desc,
        steps: newVulnForm.steps,
        remediation: newVulnForm.remediation
      };

      // Add to vulnerabilities list & auto-select
      setVulnerabilities(prev => [savedVuln, ...prev]);
      setSelected(prev => [...prev, savedVuln]);
      setExpanded(savedVuln.name);

      setShowAddVulnModal(false);
      setNewVulnForm({
        name: '',
        severity: 'High',
        owasp: 'A03:2021-Injection',
        cwe_ref: 'CWE-79',
        cwe_ref_url: 'https://cwe.mitre.org/data/definitions/79.html',
        desc: '',
        steps: '1. Navigate to $$ endpoint.\n2. Inject custom security payload.\n3. Observe unauthorized behavior in response.',
        remediation: '1. Enforce strict input validation.\n2. Sanitize and encode output.\n3. Implement defense-in-depth security controls.'
      });

      setMessage(`Custom finding '${savedVuln.name}' saved to Database & added to report!`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving custom vulnerability to Database');
    }
  };

  const validate = () => {
    if (!project.projectName.trim()) {
      alert('Please enter a Project Name.');
      return false;
    }
    if (!selected.length) {
      alert('Please select at least one vulnerability finding for the report.');
      return false;
    }
    return true;
  };

  // Generate Executive PDF Report
  const handleGeneratePdf = () => {
    if (!validate()) return;
    try {
      setMessage('Generating Executive PDF Report with Posture Analysis...');
      generateVaptPdfReport({
        project: {
          project_name: project.projectName,
          target_url: project.projectUrl,
          project_code: `VAPT-${String(projectId || '001').padStart(3, '0')}`,
          start_date: project.assessmentDate,
          department: project.department
        },
        findings: selected.map(f => ({
          vulnerability_name: f.name,
          severity: f.reportSeverity || f.severity || 'Medium',
          cwe_number: f.cwe_ref || 'CWE-200',
          owasp_category: f.owasp || 'A01:2021',
          description: f.desc || '',
          steps_to_reproduce: f.steps || '',
          remediation: f.remediation || ''
        })),
        scopeType: scopeType,
        analysts: project.analysts
      });
      setMessage('✓ Executive PDF Report downloaded successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(`PDF Generation error: ${err.message}`);
    }
  };

  // Generate Excel matching exact BISAG-N VAPT specifications
  const generateReport = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      setMessage('Generating pixel-perfect formatted Excel report...');

      await downloadVaptExcelReport({
        project,
        findings: selected,
        remarks,
        retestFindings: includePrevious
          ? [
              {
                vulnerability_name: previousName || 'Flagged Vulnerability',
                status: previousStatus || 'Open'
              }
            ]
          : selected,
        assessmentDate: project.assessmentDate
      });

      // Auto-save to Database so report appears in Saved Reports & Dashboard
      const savedId = await saveToDatabase();
      if (savedId) {
        setMessage('Report saved to Database & Excel downloaded successfully!');
      } else {
        setMessage('Official Excel Report downloaded successfully!');
      }
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveToDatabase = async () => {
    try {
      const payload = {
        project_name: project.projectName.trim(),
        target_url: project.projectUrl.trim(),
        security_analysts: project.analysts.join(', '),
        project_managers: project.projectManagers || 'Concern Project Manager: N/A',
        ciso_name: DEPARTMENT_DIRECTORS[project.department] || 'Shri Krunal Patel',
        remarks: remarks.join('\n')
      };

      let targetId = projectId;
      if (targetId) {
        // Update existing project
        await api.put(`/projects/${targetId}`, payload);
      } else {
        // Create new project
        const res = await api.post('/projects', payload);
        if (res.data.success && res.data.project?.id) {
          targetId = res.data.project.id;
        }
      }

      if (targetId) {
        const findingsPayload = selected.map(f => ({
          vulnerability_name: f.name,
          description: f.desc || '',
          steps_to_reproduce: (f.steps || '').replaceAll('$$', project.projectUrl.trim()),
          remediation: f.remediation || '',
          severity: f.reportSeverity || f.severity || 'Medium',
          owasp_category: f.owasp || 'A00:2021',
          cwe_number: f.cwe_ref || 'CWE-000',
          cwe_url: f.cwe_ref_url || '',
          status: f.status || 'Open'
        }));

        await api.post(`/projects/${targetId}/findings`, { findings: findingsPayload });
        return targetId;
      }
    } catch (err) {
      console.warn('Could not save to database via API:', err.message);
    }
    return null;
  };

  const saveDraft = async () => {
    if (!validate()) return;
    setSaving(true);
    const savedId = await saveToDatabase();
    if (savedId) {
      setMessage('Project assessment & findings saved to Database successfully!');
    } else {
      localStorage.setItem('vapt_saved_draft', JSON.stringify({ project, selected, remarks }));
      setMessage('Saved locally in browser storage.');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3500);
  };

  return (
    <div className="page-wrapper report-generator-container">
      {/* Top Banner */}
      <div className="report-gen-header">
        <div>
          <div className="report-eyebrow">
            <span className="pulse-dot" />
            BISAG-N CYBER OPERATIONS CENTER
          </div>
          <h1>VAPT Report Generator</h1>
          <p>
            Standardized VAPT reporting matching <strong>BISAG/SD/FR-207 R01</strong> specifications.
          </p>
        </div>

        <div className="header-status-badge">
          <span className="status-indicator-green" />
          <span>{vulnerabilities.length} VULN_DB Standard Entries</span>
        </div>
      </div>

      {/* Live Edit Mode Alert Banner */}
      {projectId && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(59,130,246,0.04) 100%)',
          border: '1px solid #93c5fd',
          borderLeft: '4px solid #2563eb',
          padding: '14px 20px',
          borderRadius: '10px',
          marginBottom: '24px',
          color: '#1e3a8a',
          boxShadow: '0 2px 8px rgba(37,99,235,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.4rem' }}>📝</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#1e40af' }}>
                Editing Saved Assessment #{projectId}: &quot;{project.projectName || 'Loading...'}&quot;
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                Existing project details, target scope, security analysts, and <strong>{selected.length} pre-selected finding(s)</strong> have been loaded. Any edits or re-exports will update this project.
              </div>
            </div>
          </div>
          <span style={{
            background: '#2563eb',
            color: '#ffffff',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap'
          }}>
            Manage Findings Mode
          </span>
        </div>
      )}

      {/* STEP 1: Report Details */}
      <div className="report-step-panel">
        <div className="step-panel-title">
          <span className="step-number-badge">01</span>
          <div>
            <h2>Report & Project Parameters</h2>
            <p>Target scope, department director routing, and assigned security personnel.</p>
          </div>
        </div>

        <div className="form-grid-4">
          <div className="form-group">
            <label className="form-label">PROJECT NAME *</label>
            <input
              type="text"
              className="form-input"
              value={project.projectName}
              onChange={(e) => setProject({ ...project, projectName: e.target.value })}
              placeholder="e.g. National VAPT Portal or e-Gov Service"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">DEPARTMENT / DIVISION</label>
            <select
              className="form-select"
              value={project.department}
              onChange={(e) => setProject({ ...project, department: e.target.value })}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">URL OR APK (AUTO-DETECT)</label>
            <input
              type="text"
              className="form-input mono"
              value={project.projectUrl}
              onChange={(e) => setProject({ ...project, projectUrl: e.target.value })}
              placeholder="http://example.com OR app.apk"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">ASSESSMENT DATE</label>
            <input
              type="date"
              className="form-input"
              value={project.assessmentDate}
              onChange={(e) => setProject({ ...project, assessmentDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">SCOPE / AUDIT TYPE</label>
            <select
              className="form-select"
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value)}
            >
              <option value="Web Application VAPT">Web Application VAPT</option>
              <option value="REST API & Microservices VAPT">REST API & Microservices VAPT</option>
              <option value="Mobile Application (Android/iOS) VAPT">Mobile Application VAPT</option>
              <option value="Network Infrastructure VAPT">Network Infrastructure VAPT</option>
              <option value="Cloud Security Posture Audit">Cloud Security Posture Audit</option>
            </select>
          </div>
        </div>

        {/* 4 Official Excel Metadata Fields (Rows 8-12 Structure) */}
        <div style={{ marginTop: '16px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-green, #10b981)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileSpreadsheet size={15} />
            <span>EXCEL REPORT HEADER METADATA (LEFT & RIGHT COLUMNS)</span>
          </div>

          <div className="form-grid-4">
            <div className="form-group">
              <label className="form-label">PROJECT MANAGER (LEFT COL - ROW 11)</label>
              <input
                type="text"
                className="form-input"
                value={project.projectManager}
                onChange={(e) => setProject({ ...project, projectManager: e.target.value })}
                placeholder="e.g. ABCD, WXYZ"
              />
            </div>

            <div className="form-group">
              <label className="form-label">CONCERN PROJECT MANAGER (RIGHT COL - ROW 10)</label>
              <input
                type="text"
                className="form-input"
                value={project.concernProjectManager}
                onChange={(e) => setProject({ ...project, concernProjectManager: e.target.value })}
                placeholder="e.g. Shri HarpalSinh"
              />
            </div>

            <div className="form-group">
              <label className="form-label">CONCERN ADDITIONAL DIRECTOR (RIGHT COL - ROW 11)</label>
              <input
                type="text"
                className="form-input"
                value={project.concernDirector}
                onChange={(e) => setProject({ ...project, concernDirector: e.target.value })}
                placeholder="e.g. Shri Krunal Patel"
              />
            </div>

            <div className="form-group">
              <label className="form-label">ADDITIONAL DIRECTOR CUM CISO (ROW 12)</label>
              <input
                type="text"
                className="form-input"
                value={project.cisoName}
                onChange={(e) => setProject({ ...project, cisoName: e.target.value })}
                placeholder="e.g. Shri ABCD"
              />
            </div>
          </div>
        </div>

        {/* Assigned Security Analysts (Dynamic Multi-Select + Add Custom) */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0 }}>ASSIGNED SECURITY ANALYSTS (MULTI-SELECT)</label>
            {!isAddingAnalyst && (
              <button
                type="button"
                onClick={() => setIsAddingAnalyst(true)}
                className="cyber-btn cyber-btn-secondary"
                style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={13} />
                <span>Add Analyst</span>
              </button>
            )}
          </div>

          <div className="analyst-chips-container">
            {analystsList.map((analyst) => {
              const isSelected = project.analysts.includes(analyst);
              return (
                <button
                  type="button"
                  key={analyst}
                  className={`analyst-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setProject({
                      ...project,
                      analysts: isSelected
                        ? project.analysts.filter((a) => a !== analyst)
                        : [...project.analysts, analyst]
                    });
                  }}
                >
                  <span className="chip-check">{isSelected ? '✓' : '+'}</span>
                  <span>{analyst}</span>
                </button>
              );
            })}

            {/* Inline Add Analyst Form */}
            {isAddingAnalyst ? (
              <form onSubmit={handleAddCustomAnalyst} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter analyst name..."
                  value={newAnalystName}
                  onChange={(e) => setNewAnalystName(e.target.value)}
                  autoFocus
                  style={{ width: '180px', padding: '6px 12px', fontSize: '12px' }}
                />
                <button type="submit" className="cyber-btn cyber-btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAddingAnalyst(false); setNewAnalystName(''); }}
                  className="cyber-btn cyber-btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingAnalyst(true)}
                className="analyst-chip"
                style={{ borderStyle: 'dashed', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', background: 'transparent' }}
              >
                <Plus size={14} />
                <span>Add Custom Analyst</span>
              </button>
            )}
          </div>
        </div>

        <div className="ciso-note-banner">
          <Building2 size={16} />
          <span>{DEPARTMENT_DIRECTORS[project.department] || 'Concern Director: Shri Krunal Patel'}</span>
        </div>
      </div>

      {/* STEP 2: Search & Select Vulnerabilities + Dynamic Add Modal */}
      <div className="report-step-panel">
        <div className="step-panel-header-split">
          <div className="step-panel-title">
            <span className="step-number-badge">02</span>
            <div>
              <h2>Search & Select Vulnerabilities</h2>
              <p>Search standard OWASP / CWE templates or define a custom zero-day vulnerability.</p>
            </div>
          </div>

          <div className="picker-quick-actions">
            <button
              type="button"
              onClick={() => setShowAddVulnModal(true)}
              className="cyber-btn cyber-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Add Custom Vulnerability</span>
            </button>
            <button type="button" onClick={selectVisible} className="cyber-btn cyber-btn-secondary">
              Select Visible
            </button>
            <button type="button" onClick={clearAll} className="cyber-btn cyber-btn-danger">
              Clear All
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-bar-wrapper">
          <Search size={18} color="var(--accent-cyan)" />
          <input
            type="text"
            className="search-bar-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to search — e.g. XSS, CSRF, Injection, Captcha, Path Traversal..."
          />
          <span className="search-count-pill">{filteredVulnerabilities.length} Found</span>
        </div>

        {/* Vulnerability Pill Grid */}
        <div className="vulnerability-picker-grid">
          {filteredVulnerabilities.map((vuln) => {
            const isSelected = selectedMap.has(vuln.name);
            return (
              <button
                type="button"
                key={vuln.name}
                className={`vuln-picker-card ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleFinding(vuln)}
              >
                <span className="vuln-indicator">{isSelected ? '✓' : '+'}</span>
                <span className="vuln-picker-title">{vuln.name}</span>
                <span className={`badge-severity badge-${vuln.severity?.toLowerCase()}`}>
                  {vuln.severity}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 3: Adjust Severity & Steps */}
      <div className="report-step-panel">
        <div className="step-panel-header-split">
          <div className="step-panel-title">
            <span className="step-number-badge">03</span>
            <div>
              <h2>Adjust Severity & Steps to Reproduce</h2>
              <p>Fine-tune descriptions, reproduction steps, and remediation per target.</p>
            </div>
          </div>

          <span className="selected-counter-badge">{selected.length} Selected</span>
        </div>

        {selected.length === 0 ? (
          <div className="empty-findings-box">
            <div className="empty-findings-icon-wrap">
              <AlertTriangle size={24} />
            </div>
            <h4>No vulnerabilities selected yet</h4>
            <p>Use the search picker above in Step 2 to select findings or add a custom vulnerability.</p>
          </div>
        ) : (
          <div className="findings-accordion-list">
            {selected.map((vuln, idx) => {
              const isOpen = expanded === vuln.name;
              return (
                <div key={vuln.name} className="finding-accordion-card">
                  <div
                    className="finding-accordion-header"
                    onClick={() => setExpanded(isOpen ? null : vuln.name)}
                  >
                    <div className="finding-idx-circle">{String(idx + 1).padStart(2, '0')}</div>
                    <div className="finding-header-info">
                      <strong>{vuln.name}</strong>
                      <small className="mono">{vuln.owasp || 'OWASP Top 10'}</small>
                    </div>

                    <span className={`badge-severity badge-${(vuln.reportSeverity || vuln.severity || 'Low').toLowerCase()}`}>
                      {vuln.reportSeverity || vuln.severity}
                    </span>

                    <button
                      type="button"
                      className="finding-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFinding(vuln);
                      }}
                      title="Remove Finding"
                    >
                      ×
                    </button>

                    <span className="accordion-chevron">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </div>

                  {/* Expanded Editor */}
                  {isOpen && (
                    <div className="finding-expanded-editor">
                      <div className="editor-top-grid">
                        <div className="form-group">
                          <label className="form-label">SEVERITY</label>
                          <select
                            className="form-select"
                            value={vuln.reportSeverity || vuln.severity}
                            onChange={(e) => updateFinding(vuln.name, { reportSeverity: e.target.value })}
                          >
                            {SEVERITY_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="meta-info-box">
                          <span>OWASP / CWE</span>
                          <strong>{vuln.owasp || 'OWASP Standard'}</strong>
                        </div>

                        <div className="meta-info-box">
                          <span>REFERENCE</span>
                          <strong>{vuln.reference || vuln.name}</strong>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">DESCRIPTION</label>
                        <textarea
                          className="form-textarea"
                          rows="4"
                          value={vuln.desc || ''}
                          onChange={(e) => updateFinding(vuln.name, { desc: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          STEPS TO REPRODUCE (USE <code className="mono">$$</code> FOR TARGET URL)
                        </label>
                        <textarea
                          className="form-textarea mono"
                          rows="5"
                          value={vuln.steps || ''}
                          onChange={(e) => updateFinding(vuln.name, { steps: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">REMEDIATION</label>
                        <textarea
                          className="form-textarea"
                          rows="4"
                          value={vuln.remediation || ''}
                          onChange={(e) => updateFinding(vuln.name, { remediation: e.target.value })}
                        />
                      </div>

                      {vuln.cwe_ref_url && (
                        <div style={{ marginTop: '8px' }}>
                          <a
                            href={vuln.cwe_ref_url}
                            target="_blank"
                            rel="noreferrer"
                            className="external-link-btn"
                          >
                            <span>Open Official CWE / OWASP Reference</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STEP 4: Remarks & Previous Reference */}
      <div className="report-step-panel">
        <div className="step-panel-title">
          <span className="step-number-badge">04</span>
          <div>
            <h2>Remarks & Previous Re-Test Reference</h2>
            <p>Select remarks and toggle previous vulnerability re-test status.</p>
          </div>
        </div>

        <div className="remarks-check-grid">
          {REMARK_OPTIONS.map((remark) => {
            const isChecked = remarks.includes(remark);
            return (
              <button
                type="button"
                key={remark}
                className={`remark-toggle-pill ${isChecked ? 'active' : ''}`}
                onClick={() => {
                  setRemarks(isChecked ? remarks.filter((r) => r !== remark) : [...remarks, remark]);
                }}
              >
                <span className="pill-checkbox">{isChecked ? '✓' : ''}</span>
                <span>{remark}</span>
              </button>
            );
          })}
        </div>

        {/* Include Previous Reference Toggle */}
        <div className="previous-reference-toggle-box">
          <label className="toggle-checkbox-label">
            <input
              type="checkbox"
              checked={includePrevious}
              onChange={(e) => setIncludePrevious(e.target.checked)}
            />
            <span>Include Previous Vulnerability Reference Section</span>
          </label>

          {includePrevious && (
            <div className="form-grid-3" style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">LAST REPORTED DATE</label>
                <input
                  type="date"
                  className="form-input"
                  value={previousDate}
                  onChange={(e) => setPreviousDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">PREVIOUS VULNERABILITY NAME</label>
                <input
                  type="text"
                  className="form-input"
                  value={previousName}
                  onChange={(e) => setPreviousName(e.target.value)}
                  placeholder="e.g. Broken Authentication"
                />
              </div>

              <div className="form-group">
                <label className="form-label">STATUS</label>
                <select
                  className="form-select"
                  value={previousStatus}
                  onChange={(e) => setPreviousStatus(e.target.value)}
                >
                  <option value="Open">Open</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Retest Required">Retest Required</option>
                  <option value="Not Provided">Not Provided</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STEP 5: Summary Breakdown & Final Export Panel */}
      <div className="report-step-panel step-5-export-panel">
        <div className="step-panel-title">
          <span className="step-number-badge">05</span>
          <div>
            <h2>Final Findings Summary & Export</h2>
            <p>Overall vulnerability distribution tally after selection, ready for official report generation.</p>
          </div>
        </div>

        <div className="summary-strip-grid" style={{ marginBottom: '24px' }}>
          <div className="summary-pill-card total">
            <div className="summary-pill-label">Total Findings</div>
            <div className="summary-pill-val">{String(selected.length).padStart(2, '0')}</div>
          </div>

          <div className="summary-pill-card critical">
            <div className="summary-pill-label">Critical</div>
            <div className="summary-pill-val">{String(counts.Critical).padStart(2, '0')}</div>
          </div>

          <div className="summary-pill-card high">
            <div className="summary-pill-label">High Severity</div>
            <div className="summary-pill-val">{String(counts.High).padStart(2, '0')}</div>
          </div>

          <div className="summary-pill-card medium">
            <div className="summary-pill-label">Medium Severity</div>
            <div className="summary-pill-val">{String(counts.Medium).padStart(2, '0')}</div>
          </div>

          <div className="summary-pill-card low">
            <div className="summary-pill-label">Low Severity</div>
            <div className="summary-pill-val">{String(counts.Low).padStart(2, '0')}</div>
          </div>
        </div>

        <div className="review-download-banner">
          <div>
            <div className="review-banner-tag">READY FOR EXPORT</div>
            <h2>{project.projectName || 'Untitled VAPT Report'}</h2>
            <p>
              {selected.length} Finding(s) Selected • Department: {project.department} • Assessment Date: {formatDate(project.assessmentDate)}
            </p>
          </div>

          <div className="review-actions-group" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={saveDraft} className="cyber-btn cyber-btn-secondary" disabled={saving}>
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Draft to DB'}</span>
            </button>

            <button type="button" onClick={handleGeneratePdf} className="cyber-btn cyber-btn-secondary" style={{ borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
              <FileText size={18} />
              <span>Download Executive PDF</span>
            </button>

            <button type="button" onClick={generateReport} className="cyber-btn cyber-btn-primary">
              <FileSpreadsheet size={18} />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Add Custom Vulnerability to KB */}
      {showAddVulnModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--accent-cyan)" />
                <h3 style={{ color: 'var(--text-main)', margin: 0 }}>Add Custom Vulnerability to VULN_DB</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVulnModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomVulnerability} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              <div className="form-group">
                <label className="form-label">VULNERABILITY NAME *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Zero-Day API Key Leakage or SSRF in Webhook"
                  value={newVulnForm.name}
                  onChange={(e) => setNewVulnForm({ ...newVulnForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">SEVERITY</label>
                  <select
                    className="form-select"
                    value={newVulnForm.severity}
                    onChange={(e) => setNewVulnForm({ ...newVulnForm, severity: e.target.value })}
                  >
                    {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">OWASP CATEGORY</label>
                  <select
                    className="form-select"
                    value={newVulnForm.owasp}
                    onChange={(e) => setNewVulnForm({ ...newVulnForm, owasp: e.target.value })}
                  >
                    {OWASP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">CWE NUMBER</label>
                  <input
                    type="text"
                    className="form-input mono"
                    placeholder="e.g. CWE-918"
                    value={newVulnForm.cwe_ref}
                    onChange={(e) => setNewVulnForm({
                      ...newVulnForm,
                      cwe_ref: e.target.value,
                      cwe_ref_url: `https://cwe.mitre.org/data/definitions/${e.target.value.replace(/[^0-9]/g, '')}.html`
                    })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">DESCRIPTION</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Explain the security impact and risk..."
                  value={newVulnForm.desc}
                  onChange={(e) => setNewVulnForm({ ...newVulnForm, desc: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">STEPS TO REPRODUCE (USE $$ FOR TARGET URL)</label>
                <textarea
                  className="form-textarea mono"
                  rows="3"
                  value={newVulnForm.steps}
                  onChange={(e) => setNewVulnForm({ ...newVulnForm, steps: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">STANDARD REMEDIATION</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={newVulnForm.remediation}
                  onChange={(e) => setNewVulnForm({ ...newVulnForm, remediation: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddVulnModal(false)}
                  className="cyber-btn cyber-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="cyber-btn cyber-btn-primary">
                  Save to Database & Add to Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {message && (
        <div className="cyber-toast">
          <Check size={18} />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
