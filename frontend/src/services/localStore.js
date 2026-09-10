import initialData from '../data/initialStore.json';

const STORAGE_KEY = 'vapt_cloud_store_v1';

function getStore() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      console.error('Failed to parse local store:', e);
    }
  }
  const clone = JSON.parse(JSON.stringify(initialData));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
  } catch (e) {}
  return clone;
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save local store:', e);
  }
}

export const localStore = {
  login(username, password, role, adminSecretKey) {
    const store = getStore();
    const user = (store.users || []).find(
      (u) => (u.username || '').toLowerCase() === (username || '').toLowerCase()
    );

    if (role === 'Admin' && adminSecretKey && adminSecretKey.trim() !== 'BISAG-ADMIN-2026') {
      return { success: false, message: 'Invalid Admin Master Secret Code. Contact CISO.' };
    }

    const matchedUser = user || {
      id: 99,
      name: username || 'Security Officer',
      username: username || 'analyst',
      email: (username || 'user') + '@bisag.gov.in',
      role: role || 'Security Analyst',
      status: 'Active',
      department: 'Software',
      bio: 'Cybersecurity Analyst specializing in Web Application VAPT and Defensive Hardening.',
      specialization: 'OWASP Top 10, CWE Testing, SSL/TLS Ciphers'
    };

    const activeUser = { ...matchedUser, role: role || matchedUser.role };

    return {
      success: true,
      message: 'Authentication successful',
      token: 'vapt_mock_token_' + Date.now(),
      user: activeUser
    };
  },

  getProfileStats() {
    const store = getStore();
    return {
      success: true,
      stats: {
        totalAssessments: store.projects ? store.projects.length : 14,
        vulnerabilitiesFlagged: store.projects ? store.projects.reduce((acc, p) => acc + ((p.findings && p.findings.length) || 0), 0) : 48,
        mitigationsVerified: 28,
        activeChecklistStreak: '5 Days Active'
      },
      recentLogs: store.activity_logs ? store.activity_logs.slice(0, 5) : []
    };
  },

  getProjects() {
    const store = getStore();
    return { success: true, projects: store.projects || [] };
  },

  getProjectById(id) {
    const store = getStore();
    const project = (store.projects || []).find((p) => String(p.id) === String(id));
    return { success: !!project, project: project || null };
  },

  createProject(formData) {
    const store = getStore();
    if (!store.projects) store.projects = [];
    const newProject = {
      id: Date.now(),
      project_name: formData.project_name,
      target_url: formData.target_url,
      security_analysts: formData.security_analysts || 'Unassigned',
      project_managers: formData.project_managers || 'N/A',
      ciso_name: formData.ciso_name || 'Shri Krunal Patel',
      remarks: formData.remarks || 'Standard VAPT Assessment under BISAG-N MeitY Security Directive.',
      created_at: new Date().toISOString(),
      findings: []
    };
    store.projects.unshift(newProject);
    saveStore(store);
    return { success: true, project: newProject };
  },

  deleteProject(id) {
    const store = getStore();
    store.projects = (store.projects || []).filter((p) => String(p.id) !== String(id));
    saveStore(store);
    return { success: true, message: 'Project deleted' };
  },

  addFindingsToProject(projectId, findings) {
    const store = getStore();
    const p = (store.projects || []).find((item) => String(item.id) === String(projectId));
    if (p) {
      if (!p.findings) p.findings = [];
      if (Array.isArray(findings)) {
        p.findings.push(...findings);
      } else if (findings) {
        p.findings.push(findings);
      }
      saveStore(store);
    }
    return { success: true };
  },

  getAnalytics() {
    const store = getStore();
    const projects = store.projects || [];
    let totalCrit = 0, totalHigh = 0, totalMed = 0, totalLow = 0;
    
    projects.forEach(p => {
      totalCrit += p.critical_count || 0;
      totalHigh += p.high_count || 0;
      totalMed += p.medium_count || 0;
      totalLow += p.low_count || 0;
      if (p.findings) {
        p.findings.forEach(f => {
          const sev = (f.reportSeverity || f.severity || '').toLowerCase();
          if (sev === 'critical') totalCrit++;
          else if (sev === 'high') totalHigh++;
          else if (sev === 'medium') totalMed++;
          else if (sev === 'low') totalLow++;
        });
      }
    });

    const totalFindings = totalCrit + totalHigh + totalMed + totalLow || 38;

    return {
      success: true,
      analytics: {
        totalProjects: projects.length || 6,
        totalFindings: totalFindings,
        severityBreakdown: {
          critical: totalCrit || 8,
          high: totalHigh || 14,
          medium: totalMed || 11,
          low: totalLow || 5
        },
        complianceRate: '88.5%',
        recentFindings: store.activity_logs || []
      }
    };
  },

  compareReports(baseId, compareId) {
    const store = getStore();
    const baseP = (store.projects || []).find((p) => String(p.id) === String(baseId));
    const compP = (store.projects || []).find((p) => String(p.id) === String(compareId));

    return {
      success: true,
      comparison: {
        baseProject: baseP || { project_name: 'Cycle 1 Assessment' },
        compareProject: compP || { project_name: 'Cycle 2 Retest' },
        deltaStats: {
          resolvedCount: 4,
          newCount: 1,
          persistingCount: 2,
          riskReductionPercent: 62.5
        },
        commonFindings: [],
        newFindings: [],
        resolvedFindings: []
      }
    };
  },

  getChecklist(date) {
    const store = getStore();
    const session = (store.checklist_sessions || []).find((s) => s.sessionDate === date);
    return { success: true, session: session || null };
  },

  getChecklistHistory() {
    const store = getStore();
    return { success: true, sessions: store.checklist_sessions || [] };
  },

  saveChecklist(data) {
    const store = getStore();
    if (!store.checklist_sessions) store.checklist_sessions = [];
    const idx = store.checklist_sessions.findIndex((s) => s.sessionDate === data.sessionDate);
    if (idx >= 0) {
      store.checklist_sessions[idx] = { ...store.checklist_sessions[idx], ...data };
    } else {
      store.checklist_sessions.unshift(data);
    }
    saveStore(store);
    return { success: true, message: 'Checklist saved' };
  },

  getKB(search = '', severity = '') {
    const store = getStore();
    let kb = store.knowledge_base || [];
    if (search) {
      const q = search.toLowerCase();
      kb = kb.filter((k) => (k.name || '').toLowerCase().includes(q) || (k.desc || '').toLowerCase().includes(q) || (k.remedy || '').toLowerCase().includes(q));
    }
    if (severity && severity !== 'ALL') {
      kb = kb.filter((k) => (k.severity || '').toLowerCase() === severity.toLowerCase());
    }
    return { success: true, data: kb };
  },

  createKB(item) {
    const store = getStore();
    if (!store.knowledge_base) store.knowledge_base = [];
    const newItem = { id: Date.now(), ...item };
    store.knowledge_base.unshift(newItem);
    saveStore(store);
    return { success: true, data: newItem };
  },

  updateKB(id, item) {
    const store = getStore();
    const idx = (store.knowledge_base || []).findIndex((k) => String(k.id) === String(id));
    if (idx >= 0) {
      store.knowledge_base[idx] = { ...store.knowledge_base[idx], ...item };
      saveStore(store);
    }
    return { success: true };
  },

  deleteKB(id) {
    const store = getStore();
    store.knowledge_base = (store.knowledge_base || []).filter((k) => String(k.id) !== String(id));
    saveStore(store);
    return { success: true };
  },

  getUsers() {
    const store = getStore();
    return { success: true, users: store.users || [] };
  },

  createUser(userData) {
    const store = getStore();
    if (!store.users) store.users = [];
    const newUser = {
      id: Date.now(),
      name: userData.name,
      username: userData.username,
      email: userData.email,
      role: userData.role || 'Security Analyst',
      status: userData.status || 'Active',
      department: userData.department || 'Software',
      created_at: new Date().toISOString()
    };
    store.users.unshift(newUser);
    saveStore(store);
    return { success: true, user: newUser };
  },

  updateUser(id, userData) {
    const store = getStore();
    const idx = (store.users || []).findIndex((u) => String(u.id) === String(id));
    if (idx >= 0) {
      store.users[idx] = { ...store.users[idx], ...userData };
      saveStore(store);
    }
    return { success: true, user: store.users[idx] };
  },

  deleteUser(id) {
    const store = getStore();
    store.users = (store.users || []).filter((u) => String(u.id) !== String(id));
    saveStore(store);
    return { success: true };
  },

  getAnalysts() {
    const store = getStore();
    return { success: true, analysts: store.analysts || [] };
  },

  getActivityLogs() {
    const store = getStore();
    return { success: true, logs: store.activity_logs || [] };
  },

  simulateToolScan(toolType, payload) {
    const target = payload.host || payload.domain || payload.url || 'bisag.gov.in';
    if (toolType.includes('port')) {
      return {
        success: true,
        host: target,
        openPorts: [
          { port: 80, service: 'HTTP', state: 'open', banner: 'Apache/2.4.52 (Ubuntu)' },
          { port: 443, service: 'HTTPS', state: 'open', banner: 'TLSv1.3 OpenSSL' },
          { port: 22, service: 'SSH', state: 'filtered', banner: 'OpenSSH_8.9p1' },
          { port: 8080, service: 'HTTP-Proxy', state: 'open', banner: 'Nginx/1.18.0' }
        ],
        scanDuration: '1.24s'
      };
    } else if (toolType.includes('dns')) {
      return {
        success: true,
        domain: target,
        records: {
          A: ['180.179.213.14', '180.179.213.15'],
          AAAA: ['2404:6800:4002:80b::200e'],
          MX: ['10 mail.bisag.gov.in', '20 backup-mx.bisag.gov.in'],
          TXT: ['v=spf1 include:_spf.gov.in ~all', 'bisag-verification=2026-meity-sec'],
          NS: ['ns1.nic.in', 'ns2.nic.in'],
          CNAME: ['portal.bisag.gov.in']
        }
      };
    } else if (toolType.includes('ssl')) {
      return {
        success: true,
        host: target,
        grade: 'A+',
        valid: true,
        issuer: 'NIC CA 2026 / National Informatics Centre',
        validTo: '2027-09-01T00:00:00.000Z',
        protocol: 'TLSv1.3',
        cipher: 'TLS_AES_256_GCM_SHA384',
        hsts: true,
        keyLength: 4096
      };
    } else if (toolType.includes('header')) {
      return {
        success: true,
        url: target,
        grade: 'B+',
        headers: {
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Content-Security-Policy': "default-src 'self' https:; script-src 'self' 'unsafe-inline'"
        },
        missing: ['Permissions-Policy']
      };
    } else if (toolType.includes('file')) {
      return {
        success: true,
        url: target,
        tested: 35,
        exposed: [
          { path: '/robots.txt', status: 200, risk: 'Info', notes: 'Exposes admin endpoints' },
          { path: '/.git/HEAD', status: 403, risk: 'Secure', notes: 'Properly blocked' }
        ]
      };
    } else if (toolType.includes('cors')) {
      return {
        success: true,
        url: target,
        originTested: 'https://evil.com',
        allowOrigin: 'null',
        allowCredentials: 'false',
        status: 'Hardened / Secure'
      };
    }
    return { success: true, message: 'Scan complete', data: {} };
  }
};
