import initialData from '../data/initialStore.json';

const STORAGE_KEY = 'vapt_cloud_store_v4';

function getStore() {
  const existing = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (parsed && Array.isArray(parsed.projects) && parsed.projects.length >= 4) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse local store:', e);
    }
  }
  const clone = JSON.parse(JSON.stringify(initialData));
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
    }
  } catch (e) {}
  return clone;
}

function saveStore(store) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  } catch (e) {
    console.error('Failed to save local store:', e);
  }
}

function enrichProject(project, allFindings) {
  const matchingFindings = (allFindings || []).filter(
    (f) => String(f.project_id) === String(project.id)
  );

  let crit = 0, high = 0, med = 0, low = 0, open = 0, closed = 0;
  matchingFindings.forEach((f) => {
    const sev = (f.reportSeverity || f.severity || '').toLowerCase();
    if (sev === 'critical') crit++;
    else if (sev === 'high') high++;
    else if (sev === 'medium') med++;
    else if (sev === 'low') low++;

    if ((f.status || '').toLowerCase() === 'closed') {
      closed++;
    } else {
      open++;
    }
  });

  return {
    ...project,
    total_findings: matchingFindings.length,
    critical_count: crit,
    high_count: high,
    medium_count: med,
    low_count: low,
    open_count: open,
    closed_count: closed,
    findings: matchingFindings
  };
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
    const projects = store.projects || [];
    const findings = store.findings || [];
    const closedFindings = findings.filter(f => (f.status || '').toLowerCase() === 'closed');

    return {
      success: true,
      stats: {
        totalAssessments: projects.length || 3,
        vulnerabilitiesFlagged: findings.length || 10,
        mitigationsVerified: closedFindings.length || 2,
        activeChecklistStreak: '5 Days Active'
      },
      recentLogs: store.activity_logs ? store.activity_logs.slice(0, 5) : []
    };
  },

  getProjects() {
    const store = getStore();
    const allFindings = store.findings || [];
    const enriched = (store.projects || []).map(p => enrichProject(p, allFindings));
    return { success: true, projects: enriched };
  },

  getProjectById(id) {
    const store = getStore();
    const allFindings = store.findings || [];
    const project = (store.projects || []).find((p) => String(p.id) === String(id));
    if (!project) {
      return { success: false, message: 'Project not found', project: null, findings: [] };
    }
    const enriched = enrichProject(project, allFindings);
    return {
      success: true,
      project: enriched,
      findings: enriched.findings || []
    };
  },

  createProject(formData) {
    const store = getStore();
    if (!store.projects) store.projects = [];
    if (!store.activity_logs) store.activity_logs = [];

    const newProject = {
      id: Date.now(),
      project_name: formData.project_name,
      target_url: formData.target_url,
      security_analysts: formData.security_analysts || 'BISAG-N Security Analyst',
      project_managers: formData.project_managers || 'Concern Project Manager: N/A',
      ciso_name: formData.ciso_name || 'Concern Additional Director: Shri Krunal Patel',
      remarks: formData.remarks || 'Standard VAPT Assessment under BISAG-N MeitY Security Directive.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    store.projects.unshift(newProject);

    store.activity_logs.unshift({
      id: Date.now(),
      user_id: 1,
      username: 'analyst',
      role: 'Security Analyst',
      action: 'Project Created',
      details: `Provisioned assessment target '${newProject.project_name}' for ${newProject.target_url}`,
      timestamp: new Date().toISOString()
    });

    saveStore(store);
    return { success: true, project: newProject, message: 'Project created successfully' };
  },

  updateProject(id, formData) {
    const store = getStore();
    const idx = (store.projects || []).findIndex((p) => String(p.id) === String(id));
    if (idx >= 0) {
      store.projects[idx] = {
        ...store.projects[idx],
        ...formData,
        updated_at: new Date().toISOString()
      };
      saveStore(store);
      return { success: true, project: store.projects[idx], message: 'Project updated successfully' };
    }
    return { success: false, message: 'Project not found' };
  },

  deleteProject(id) {
    const store = getStore();
    store.projects = (store.projects || []).filter((p) => String(p.id) !== String(id));
    store.findings = (store.findings || []).filter((f) => String(f.project_id) !== String(id));

    if (!store.activity_logs) store.activity_logs = [];
    store.activity_logs.unshift({
      id: Date.now(),
      user_id: 1,
      username: 'analyst',
      role: 'Security Analyst',
      action: 'Project Deleted',
      details: `Removed assessment target project #${id} and its associated findings`,
      timestamp: new Date().toISOString()
    });

    saveStore(store);
    return { success: true, message: 'Project deleted successfully' };
  },

  addFindingsToProject(projectId, findings) {
    const store = getStore();
    if (!store.findings) store.findings = [];
    const list = Array.isArray(findings) ? findings : findings ? [findings] : [];
    
    const formatted = list.map((f, idx) => ({
      id: f.id || Date.now() + idx,
      project_id: Number(projectId),
      vulnerability_name: f.vulnerability_name || f.name || 'Security Finding',
      description: f.description || f.desc || '',
      steps_to_reproduce: f.steps_to_reproduce || f.steps || '',
      remediation: f.remediation || '',
      severity: f.severity || f.reportSeverity || 'Medium',
      reportSeverity: f.reportSeverity || f.severity || 'Medium',
      reference: f.reference || f.cwe_ref || null,
      owasp_category: f.owasp_category || f.owasp || 'A03:2021-Injection',
      cwe_number: f.cwe_number || f.cwe_ref || 'CWE-79',
      cwe_url: f.cwe_url || f.cwe_ref_url || 'https://cwe.mitre.org',
      status: f.status || 'Open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    store.findings.push(...formatted);

    if (!store.activity_logs) store.activity_logs = [];
    store.activity_logs.unshift({
      id: Date.now(),
      user_id: 1,
      username: 'analyst',
      role: 'Security Analyst',
      action: 'Vulnerability Logged',
      details: `Added ${formatted.length} finding(s) to Project #${projectId}`,
      timestamp: new Date().toISOString()
    });

    saveStore(store);
    return { success: true, findings: formatted, message: 'Findings updated successfully' };
  },

  getAnalytics() {
    const store = getStore();
    const projects = store.projects || [];
    const findings = store.findings || [];

    let critical = 0, high = 0, medium = 0, low = 0, open = 0, closed = 0;
    const owaspMap = {};
    const cweMap = {};

    findings.forEach((f) => {
      const sev = (f.reportSeverity || f.severity || '').toLowerCase();
      if (sev === 'critical') critical++;
      else if (sev === 'high') high++;
      else if (sev === 'medium') medium++;
      else if (sev === 'low') low++;

      if ((f.status || '').toLowerCase() === 'closed') {
        closed++;
      } else {
        open++;
      }

      const owasp = f.owasp_category || 'A03:2021-Injection';
      owaspMap[owasp] = (owaspMap[owasp] || 0) + 1;

      const cwe = f.cwe_number || 'CWE-79';
      cweMap[cwe] = (cweMap[cwe] || 0) + 1;
    });

    const totalFindings = findings.length;
    const totalProjects = projects.length;
    const fixRate = totalFindings > 0 ? ((closed / totalFindings) * 100).toFixed(1) : '100.0';

    let threatScore = 100 - (critical * 25 + high * 15 + medium * 5 + low * 2);
    if (threatScore < 10) threatScore = 10;
    if (totalFindings === 0) threatScore = 98;

    let grade = 'A';
    if (threatScore < 70) grade = 'B';
    if (threatScore < 50) grade = 'C';
    if (threatScore < 30) grade = 'F';

    const owaspBreakdown = Object.keys(owaspMap).map((k) => ({
      owasp_category: k,
      count: owaspMap[k]
    }));

    const cweBreakdown = Object.keys(cweMap).map((k) => ({
      cwe_number: k,
      count: cweMap[k]
    }));

    const recentProjects = projects.map((p) => {
      const enriched = enrichProject(p, findings);
      return {
        id: p.id,
        project_name: p.project_name,
        target_url: p.target_url,
        security_analysts: p.security_analysts,
        total_findings: enriched.total_findings,
        crit: enriched.critical_count,
        high: enriched.high_count,
        med: enriched.medium_count,
        low: enriched.low_count,
        closed_count: enriched.closed_count
      };
    });

    return {
      success: true,
      stats: {
        total_findings: totalFindings,
        critical,
        high,
        medium,
        low,
        open,
        closed,
        total_projects: totalProjects,
        fix_rate: fixRate
      },
      threatScore,
      grade,
      owaspBreakdown,
      cweBreakdown,
      recentProjects,
      activityLogs: store.activity_logs || [],
      analytics: {
        totalProjects,
        totalFindings,
        severityBreakdown: { critical, high, medium, low },
        complianceRate: `${fixRate}%`,
        recentFindings: store.activity_logs || []
      }
    };
  },

  compareReports(baseId, compareId) {
    const store = getStore();
    const baseP = (store.projects || []).find((p) => String(p.id) === String(baseId));
    const compP = (store.projects || []).find((p) => String(p.id) === String(compareId));

    const baseFindings = (store.findings || []).filter((f) => String(f.project_id) === String(baseId));
    const compFindings = (store.findings || []).filter((f) => String(f.project_id) === String(compareId));

    const baseNames = new Set(baseFindings.map((f) => f.vulnerability_name));
    const compNames = new Set(compFindings.map((f) => f.vulnerability_name));

    const resolved = baseFindings.filter((f) => !compNames.has(f.vulnerability_name));
    const newFindings = compFindings.filter((f) => !baseNames.has(f.vulnerability_name));
    const persisting = compFindings.filter((f) => baseNames.has(f.vulnerability_name));

    const totalBase = baseFindings.length || 1;
    const reduction = Math.max(0, Math.round(((resolved.length - newFindings.length) / totalBase) * 100));

    return {
      success: true,
      comparison: {
        baseProject: baseP || { project_name: 'Cycle 1 Assessment' },
        compareProject: compP || { project_name: 'Cycle 2 Retest' },
        deltaStats: {
          resolvedCount: resolved.length,
          newCount: newFindings.length,
          persistingCount: persisting.length,
          riskReductionPercent: reduction
        },
        commonFindings: persisting,
        newFindings: newFindings,
        resolvedFindings: resolved
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

    if (!store.activity_logs) store.activity_logs = [];
    store.activity_logs.unshift({
      id: Date.now(),
      user_id: 1,
      username: 'analyst',
      role: 'Security Analyst',
      action: 'Daily Checklist Updated',
      details: `Tested ${data.testedCount || 0}/${data.totalCount || 31} checklist items on '${data.targetUrl || 'Target'}'`,
      timestamp: new Date().toISOString()
    });

    saveStore(store);
    return { success: true, message: 'Checklist saved successfully' };
  },

  getKB(search = '', severity = '') {
    const store = getStore();
    let kb = store.knowledge_base || [];
    if (search) {
      const q = search.toLowerCase();
      kb = kb.filter((k) =>
        (k.vulnerability_name || k.name || '').toLowerCase().includes(q) ||
        (k.description || k.desc || '').toLowerCase().includes(q) ||
        (k.remediation || k.remedy || '').toLowerCase().includes(q)
      );
    }
    if (severity && severity !== 'ALL') {
      kb = kb.filter((k) => (k.severity || '').toLowerCase() === severity.toLowerCase());
    }
    return {
      success: true,
      items: kb,
      data: kb,
      knowledgeBase: kb
    };
  },

  createKB(item) {
    const store = getStore();
    if (!store.knowledge_base) store.knowledge_base = [];
    const newItem = {
      id: Date.now(),
      vulnerability_name: item.name || item.vulnerability_name,
      description: item.desc || item.description,
      steps_to_reproduce: item.steps || item.steps_to_reproduce,
      remediation: item.remediation,
      severity: item.severity || 'Medium',
      reference: item.reference || item.name,
      owasp_category: item.owasp || item.owasp_category,
      cwe_number: item.cwe_ref || item.cwe_number,
      cwe_url: item.cwe_ref_url || item.cwe_url || 'https://cwe.mitre.org',
      created_at: new Date().toISOString()
    };
    store.knowledge_base.unshift(newItem);
    saveStore(store);
    return { success: true, item: newItem, data: newItem, message: 'Vulnerability added to Knowledge Base' };
  },

  updateKB(id, item) {
    const store = getStore();
    const idx = (store.knowledge_base || []).findIndex((k) => String(k.id) === String(id));
    if (idx >= 0) {
      store.knowledge_base[idx] = { ...store.knowledge_base[idx], ...item };
      saveStore(store);
      return { success: true, item: store.knowledge_base[idx], data: store.knowledge_base[idx], message: 'Vulnerability updated' };
    }
    return { success: false, message: 'Item not found' };
  },

  deleteKB(id) {
    const store = getStore();
    store.knowledge_base = (store.knowledge_base || []).filter((k) => String(k.id) !== String(id));
    saveStore(store);
    return { success: true, message: 'Vulnerability removed from Knowledge Base' };
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
    return { success: true, user: newUser, message: 'User created successfully' };
  },

  updateUser(id, userData) {
    const store = getStore();
    const idx = (store.users || []).findIndex((u) => String(u.id) === String(id));
    if (idx >= 0) {
      store.users[idx] = { ...store.users[idx], ...userData };
      saveStore(store);
      return { success: true, user: store.users[idx], message: 'User updated successfully' };
    }
    return { success: false, message: 'User not found' };
  },

  deleteUser(id) {
    const store = getStore();
    store.users = (store.users || []).filter((u) => String(u.id) !== String(id));
    saveStore(store);
    return { success: true, message: 'User removed successfully' };
  },

  getAnalysts() {
    const store = getStore();
    const current = store.analysts || [];
    const initialList = initialData.analysts || [];
    
    // Merge any missing initial analysts into current list
    let updated = false;
    initialList.forEach(ia => {
      const exists = current.some(c => (c.name || '').trim().toLowerCase() === (ia.name || '').trim().toLowerCase());
      if (!exists) {
        current.push(ia);
        updated = true;
      }
    });

    if (updated) {
      store.analysts = current;
      saveStore(store);
    }

    return { success: true, analysts: current };
  },

  createAnalyst(analystData) {
    const store = getStore();
    if (!store.analysts) store.analysts = [];
    const newAnalyst = {
      id: Date.now(),
      name: analystData.name,
      department: analystData.department || 'Software',
      is_active: true,
      created_at: new Date().toISOString()
    };
    store.analysts.unshift(newAnalyst);
    saveStore(store);
    return { success: true, analyst: newAnalyst, message: 'Analyst added successfully' };
  },

  deleteAnalyst(id) {
    const store = getStore();
    store.analysts = (store.analysts || []).filter((a) => String(a.id) !== String(id));
    saveStore(store);
    return { success: true, message: 'Analyst removed successfully' };
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
