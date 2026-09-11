const { getStore } = require('@netlify/blobs');
const initialData = require('../src/data/initialStore.json');

let inMemoryStore = JSON.parse(JSON.stringify(initialData));

async function getDb() {
  try {
    const blobStore = getStore('vapt_cloud_database');
    const existing = await blobStore.get('vapt_main_store', { type: 'json' });
    if (existing && Array.isArray(existing.projects) && existing.projects.length >= 3) {
      inMemoryStore = existing;
      return existing;
    }
    const seed = JSON.parse(JSON.stringify(initialData));
    await blobStore.setJSON('vapt_main_store', seed);
    inMemoryStore = seed;
    return seed;
  } catch (e) {
    return inMemoryStore;
  }
}

async function saveDb(store) {
  inMemoryStore = store;
  try {
    const blobStore = getStore('vapt_cloud_database');
    await blobStore.setJSON('vapt_main_store', store);
  } catch (e) {}
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

exports.handler = async (event, context) => {
  const method = (event.httpMethod || 'GET').toUpperCase();
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let cleanPath = event.path
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '')
    .replace(/^\//, '')
    .split('?')[0];

  const query = event.queryStringParameters || {};
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      body = {};
    }
  }

  const store = await getDb();

  // 1. AUTH
  if (cleanPath === 'auth/login' && method === 'POST') {
    const { username, password, role, adminSecretKey } = body;
    if (role === 'Admin' && adminSecretKey && adminSecretKey.trim() !== 'BISAG-ADMIN-2026') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid Admin Master Secret Code.' })
      };
    }
    const user = (store.users || []).find(
      (u) => (u.username || '').toLowerCase() === (username || '').toLowerCase()
    ) || {
      id: 99,
      name: username || 'Security Officer',
      username: username || 'analyst',
      email: (username || 'user') + '@bisag.gov.in',
      role: role || 'Security Analyst',
      status: 'Active',
      department: 'Software'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Authentication successful',
        token: 'vapt_cloud_token_' + Date.now(),
        user: { ...user, role: role || user.role }
      })
    };
  }

  if (cleanPath === 'auth/me' && method === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, user: store.users ? store.users[0] : null })
    };
  }

  if (cleanPath === 'auth/profile-stats' && method === 'GET') {
    const projects = store.projects || [];
    const findings = store.findings || [];
    const closed = findings.filter((f) => (f.status || '').toLowerCase() === 'closed');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        stats: {
          totalAssessments: projects.length,
          vulnerabilitiesFlagged: findings.length,
          mitigationsVerified: closed.length,
          activeChecklistStreak: '5 Days Active'
        },
        recentLogs: (store.activity_logs || []).slice(0, 5)
      })
    };
  }

  // 2. PROJECTS
  if (cleanPath === 'projects' && method === 'GET') {
    const enriched = (store.projects || []).map((p) => enrichProject(p, store.findings || []));
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, projects: enriched })
    };
  }

  if (cleanPath === 'projects' && method === 'POST') {
    if (!store.projects) store.projects = [];
    if (!store.activity_logs) store.activity_logs = [];

    const newProject = {
      id: Date.now(),
      project_name: body.project_name || 'New Target Assessment',
      target_url: body.target_url || 'http://target.gov.in',
      security_analysts: body.security_analysts || 'BISAG-N Security Analyst',
      project_managers: body.project_managers || 'Concern Project Manager: N/A',
      ciso_name: body.ciso_name || 'Concern Additional Director: Shri Krunal Patel',
      remarks: body.remarks || 'Standard VAPT Assessment under BISAG-N MeitY Security Directive.',
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
      details: 'Created assessment target ' + newProject.project_name,
      timestamp: new Date().toISOString()
    });

    await saveDb(store);
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ success: true, project: newProject, message: 'Project created' })
    };
  }

  if (cleanPath.startsWith('projects/') && cleanPath.endsWith('/findings') && method === 'POST') {
    const id = cleanPath.split('/')[1];
    if (!store.findings) store.findings = [];
    const list = Array.isArray(body.findings) ? body.findings : body.findings ? [body.findings] : [];
    
    const formatted = list.map((f, idx) => ({
      id: f.id || Date.now() + idx,
      project_id: Number(id),
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
    await saveDb(store);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, findings: formatted, message: 'Findings updated' })
    };
  }

  if (cleanPath.startsWith('projects/') && method === 'GET') {
    const id = cleanPath.split('/')[1];
    const project = (store.projects || []).find((p) => String(p.id) === String(id));
    if (!project) {
      return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Project not found' }) };
    }
    const matching = (store.findings || []).filter((f) => String(f.project_id) === String(id));
    const enriched = enrichProject(project, store.findings || []);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, project: enriched, findings: matching })
    };
  }

  if (cleanPath.startsWith('projects/') && method === 'PUT') {
    const id = cleanPath.split('/')[1];
    const idx = (store.projects || []).findIndex((p) => String(p.id) === String(id));
    if (idx >= 0) {
      store.projects[idx] = { ...store.projects[idx], ...body, updated_at: new Date().toISOString() };
      await saveDb(store);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, project: store.projects[idx] }) };
    }
    return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Project not found' }) };
  }

  if (cleanPath.startsWith('projects/') && method === 'DELETE') {
    const id = cleanPath.split('/')[1];
    store.projects = (store.projects || []).filter((p) => String(p.id) !== String(id));
    store.findings = (store.findings || []).filter((f) => String(f.project_id) !== String(id));
    await saveDb(store);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Project deleted' }) };
  }

  // 3. ANALYTICS
  if (cleanPath === 'reports/analytics' && method === 'GET') {
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

      if ((f.status || '').toLowerCase() === 'closed') closed++;
      else open++;

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

    const owaspBreakdown = Object.keys(owaspMap).map((k) => ({ owasp_category: k, count: owaspMap[k] }));
    const cweBreakdown = Object.keys(cweMap).map((k) => ({ cwe_number: k, count: cweMap[k] }));

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
      statusCode: 200,
      headers,
      body: JSON.stringify({
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
        activityLogs: store.activity_logs || []
      })
    };
  }

  // 4. CHECKLIST
  if (cleanPath === 'checklist/history' && method === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, sessions: store.checklist_sessions || [] })
    };
  }

  if (cleanPath === 'checklist' && method === 'GET') {
    const session = (store.checklist_sessions || []).find((s) => s.sessionDate === query.date);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, session: session || null })
    };
  }

  if (cleanPath === 'checklist' && method === 'POST') {
    if (!store.checklist_sessions) store.checklist_sessions = [];
    const idx = store.checklist_sessions.findIndex((s) => s.sessionDate === body.sessionDate);
    if (idx >= 0) {
      store.checklist_sessions[idx] = { ...store.checklist_sessions[idx], ...body };
    } else {
      store.checklist_sessions.unshift(body);
    }
    await saveDb(store);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Checklist saved' }) };
  }

  // 5. KNOWLEDGE BASE
  if (cleanPath === 'kb' && method === 'GET') {
    let kb = store.knowledge_base || [];
    if (query.search) {
      const q = query.search.toLowerCase();
      kb = kb.filter((k) => (k.vulnerability_name || k.name || '').toLowerCase().includes(q) || (k.description || k.desc || '').toLowerCase().includes(q));
    }
    if (query.severity && query.severity !== 'ALL') {
      kb = kb.filter((k) => (k.severity || '').toLowerCase() === query.severity.toLowerCase());
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, items: kb, data: kb, knowledgeBase: kb })
    };
  }

  if (cleanPath === 'kb' && method === 'POST') {
    if (!store.knowledge_base) store.knowledge_base = [];
    const newItem = {
      id: Date.now(),
      vulnerability_name: body.vulnerability_name || body.name,
      description: body.description || body.desc,
      steps_to_reproduce: body.steps_to_reproduce || body.steps,
      remediation: body.remediation,
      severity: body.severity || 'Medium',
      owasp_category: body.owasp_category || body.owasp || 'A03:2021-Injection',
      cwe_number: body.cwe_number || body.cwe_ref || 'CWE-79',
      cwe_url: body.cwe_url || body.cwe_ref_url || 'https://cwe.mitre.org',
      created_at: new Date().toISOString()
    };
    store.knowledge_base.unshift(newItem);
    await saveDb(store);
    return { statusCode: 201, headers, body: JSON.stringify({ success: true, item: newItem, data: newItem }) };
  }

  // 6. ANALYSTS & USERS & ACTIVITY LOGS
  if (cleanPath === 'analysts' && method === 'GET') {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, analysts: store.analysts || [] }) };
  }

  if (cleanPath === 'activity-logs' && method === 'GET') {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, logs: store.activity_logs || [] }) };
  }

  if (cleanPath === 'users' && method === 'GET') {
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, users: store.users || [] }) };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, message: 'Netlify Cloud API Active' })
  };
};
