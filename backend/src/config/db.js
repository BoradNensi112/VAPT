const { Pool, Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const localDbPath = path.join(dataDir, 'vapt_store.json');

// In-memory / file fallback store
let localStore = {
  users: [],
  analysts: [],
  projects: [],
  knowledge_base: [],
  findings: [],
  activity_logs: [],
  checklist_sessions: []
};

if (fs.existsSync(localDbPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
    localStore = {
      users: Array.isArray(raw.users) ? raw.users : [],
      analysts: Array.isArray(raw.analysts) ? raw.analysts : [],
      projects: Array.isArray(raw.projects) ? raw.projects : [],
      knowledge_base: Array.isArray(raw.knowledge_base) ? raw.knowledge_base : [],
      findings: Array.isArray(raw.findings) ? raw.findings : [],
      activity_logs: Array.isArray(raw.activity_logs) ? raw.activity_logs : [],
      checklist_sessions: Array.isArray(raw.checklist_sessions) ? raw.checklist_sessions : []
    };
  } catch (e) {
    console.error('Error reading local store:', e.message);
  }
}

function saveLocalStore() {
  try {
    fs.writeFileSync(localDbPath, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving local store:', e.message);
  }
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'vapt_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 3000,
});

let isPgActive = false;

async function checkPgConnection() {
  try {
    const client = await pool.connect();
    client.release();
    isPgActive = true;
    console.log('✅ [DB] Connected to PostgreSQL successfully (pgAdmin compatible).');
    return true;
  } catch (err) {
    isPgActive = false;
    console.log('⚠️ [DB] PostgreSQL is offline or credentials differ. Using local database storage.');
    console.log('   (To use PostgreSQL, start PostgreSQL in Services/pgAdmin with credentials in .env)');
    return false;
  }
}

async function query(text, params = []) {
  try {
    const res = await pool.query(text, params);
    isPgActive = true;
    return res;
  } catch (err) {
    return emulateQuery(text, params);
  }
}

function emulateQuery(text, params) {
  const sql = text.trim();

  // 1. SELECT * FROM users WHERE (username = $1 OR email = $1)
  if (sql.includes('SELECT * FROM users WHERE (username = $1 OR email = $1)')) {
    const term = params[0];
    const user = localStore.users.find(u => u.username === term || u.email === term);
    return { rows: user ? [user] : [] };
  }

  // 2. SELECT * FROM users WHERE id = $1
  if (sql.startsWith('SELECT') && sql.includes('FROM users WHERE id = $1')) {
    const id = parseInt(params[0], 10);
    const user = localStore.users.find(u => u.id === id);
    return { rows: user ? [user] : [] };
  }

  // 3. SELECT * FROM users WHERE username = 'admin'
  if (sql.includes("SELECT * FROM users WHERE username = 'admin'")) {
    const user = localStore.users.find(u => u.username === 'admin');
    return { rows: user ? [user] : [] };
  }

  // 4. SELECT * FROM users (all)
  if (sql.includes('FROM users ORDER BY id')) {
    return { rows: [...localStore.users] };
  }

  // 5. INSERT INTO users
  if (sql.startsWith('INSERT INTO users')) {
    const newId = localStore.users.length ? Math.max(...localStore.users.map(u => u.id)) + 1 : 1;
    const [name, username, email, password_hash, role, status] = params;
    const newUser = {
      id: newId,
      name,
      username,
      email,
      password_hash,
      role: role || 'Security Analyst',
      status: status || 'Active',
      created_at: new Date().toISOString()
    };
    localStore.users.push(newUser);
    saveLocalStore();
    return { rows: [newUser] };
  }

  
  // 5.5 UPDATE users password_hash
  if (sql.includes('UPDATE users SET password_hash = $1 WHERE id = $2')) {
    const [passwordHash, id] = params;
    const userId = parseInt(id, 10);
    const user = localStore.users.find(u => u.id === userId);
    if (user) {
      user.password_hash = passwordHash;
      saveLocalStore();
      return { rows: [user] };
    }
    return { rows: [] };
  }

  // 5.6 UPDATE users profile
  if (sql.includes('UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email)')) {
    const [name, email, department, phone, bio, specialization, id] = params;
    const userId = parseInt(id, 10);
    const user = localStore.users.find(u => u.id === userId);
    if (user) {
      if (name) user.name = name;
      if (email) user.email = email;
      if (department) user.department = department;
      if (phone !== undefined) user.phone = phone;
      if (bio !== undefined) user.bio = bio;
      if (specialization !== undefined) user.specialization = specialization;
      saveLocalStore();
      return { rows: [user] };
    }
    return { rows: [] };
  }

  // 5.7 UPDATE users admin role/status
  if (sql.startsWith('UPDATE users')) {
    const id = parseInt(params[4] || params[params.length - 1], 10);
    const user = localStore.users.find(u => u.id === id);
    if (user) {
      if (params[0]) user.name = params[0];
      if (params[1]) user.role = params[1];
      if (params[2]) user.status = params[2];
      if (params[3]) user.department = params[3];
      saveLocalStore();
      return { rows: [user] };
    }
    return { rows: [] };
  }

  // 6. DELETE FROM users WHERE id = $1
  if (sql.startsWith('DELETE FROM users WHERE id = $1')) {
    const id = parseInt(params[0], 10);
    localStore.users = localStore.users.filter(u => u.id !== id);
    saveLocalStore();
    return { rows: [] };
  }

  
  // 6.5 SELECT activity_logs filtered
  if (sql.includes('FROM activity_logs WHERE username = $1 OR user_id = $2')) {
    const uname = params[0];
    const uid = params[1];
    const filtered = (localStore.activity_logs || []).filter(l => l.username === uname || l.userId === uid || l.user_id === uid).map(l => ({
      ...l,
      role: l.role === 'Super Admin' ? 'Admin' : (l.role || 'Admin')
    }));
    return { rows: filtered.slice(0, 100) };
  }

  // 7. Projects Query with Counts
  if (sql.includes('SELECT p.*') && sql.includes('FROM projects p')) {
    const projectsWithCounts = localStore.projects.map(p => {
      const pFindings = localStore.findings.filter(f => f.project_id === p.id);
      return {
        ...p,
        total_findings: pFindings.length,
        critical_count: pFindings.filter(f => f.severity === 'Critical').length,
        high_count: pFindings.filter(f => f.severity === 'High').length,
        medium_count: pFindings.filter(f => f.severity === 'Medium').length,
        low_count: pFindings.filter(f => f.severity === 'Low').length,
        open_count: pFindings.filter(f => f.status === 'Open').length,
        closed_count: pFindings.filter(f => f.status === 'Closed').length
      };
    });
    return { rows: projectsWithCounts };
  }

  // 8. SELECT * FROM projects WHERE id = $1
  if (sql.startsWith('SELECT * FROM projects WHERE id = $1')) {
    const id = parseInt(params[0], 10);
    const p = localStore.projects.find(x => x.id === id);
    return { rows: p ? [p] : [] };
  }

  // 9. INSERT INTO projects
  if (sql.startsWith('INSERT INTO projects')) {
    const newId = localStore.projects.length ? Math.max(...localStore.projects.map(x => x.id)) + 1 : 1;
    const [project_name, target_url, security_analysts, project_managers, ciso_name, remarks, created_by] = params;
    const newProject = {
      id: newId,
      project_name,
      target_url,
      security_analysts,
      project_managers,
      ciso_name,
      remarks,
      created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStore.projects.unshift(newProject);
    saveLocalStore();
    return { rows: [newProject] };
  }

  // 9b. UPDATE projects
  if (sql.startsWith('UPDATE projects')) {
    const [project_name, target_url, security_analysts, project_managers, ciso_name, remarks, id] = params;
    const projId = parseInt(id, 10);
    const p = localStore.projects.find(x => x.id === projId);
    if (p) {
      p.project_name = project_name;
      p.target_url = target_url;
      p.security_analysts = security_analysts;
      p.project_managers = project_managers;
      p.ciso_name = ciso_name;
      p.remarks = remarks;
      p.updated_at = new Date().toISOString();
      saveLocalStore();
      return { rows: [p] };
    }
    return { rows: [] };
  }

  // 10. DELETE FROM projects WHERE id = $1
  if (sql.startsWith('DELETE FROM projects WHERE id = $1')) {
    const id = parseInt(params[0], 10);
    localStore.projects = localStore.projects.filter(p => p.id !== id);
    localStore.findings = localStore.findings.filter(f => f.project_id !== id);
    saveLocalStore();
    return { rows: [] };
  }

  // 10b. DELETE FROM findings WHERE project_id = $1
  if (sql.startsWith('DELETE FROM findings WHERE project_id = $1')) {
    const projectId = parseInt(params[0], 10);
    localStore.findings = localStore.findings.filter(f => f.project_id !== projectId);
    saveLocalStore();
    return { rows: [] };
  }

  // 11. Findings Queries
  if (sql.includes('FROM findings WHERE project_id = $1')) {
    const projectId = parseInt(params[0], 10);
    const list = localStore.findings.filter(f => f.project_id === projectId);
    return { rows: list };
  }

  // 12. INSERT INTO findings
  if (sql.startsWith('INSERT INTO findings')) {
    const newId = localStore.findings.length ? Math.max(...localStore.findings.map(x => x.id)) + 1 : 1;
    const [project_id, vulnerability_name, description, steps_to_reproduce, remediation, severity, reference, owasp_category, cwe_number, cwe_url, status] = params;
    const newFinding = {
      id: newId,
      project_id: parseInt(project_id, 10),
      vulnerability_name,
      description,
      steps_to_reproduce,
      remediation,
      severity,
      reference,
      owasp_category,
      cwe_number,
      cwe_url,
      status: status || 'Open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStore.findings.push(newFinding);
    saveLocalStore();
    return { rows: [newFinding] };
  }

  // 13. DELETE FROM findings WHERE id = $1
  if (sql.startsWith('DELETE FROM findings WHERE id = $1')) {
    const id = parseInt(params[0], 10);
    localStore.findings = localStore.findings.filter(f => f.id !== id);
    saveLocalStore();
    return { rows: [] };
  }

  // 13b. Analysts Queries
  if (sql.includes('FROM analysts WHERE LOWER(name) = LOWER($1)')) {
    const term = ((params[0] || '') + '').trim().toLowerCase();
    const found = (localStore.analysts || []).find(a => (a.name || '').toLowerCase() === term);
    return { rows: found ? [found] : [] };
  }

  if (sql.includes('FROM analysts')) {
    const list = [...(localStore.analysts || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return { rows: list };
  }

  if (sql.startsWith('INSERT INTO analysts')) {
    localStore.analysts = localStore.analysts || [];
    const newId = localStore.analysts.length ? Math.max(...localStore.analysts.map(a => a.id)) + 1 : 1;
    const [name, department] = params;
    const newAnalyst = {
      id: newId,
      name: (name || '').trim(),
      department: department || 'General',
      is_active: true,
      created_at: new Date().toISOString()
    };
    localStore.analysts.push(newAnalyst);
    saveLocalStore();
    return { rows: [newAnalyst] };
  }

  if (sql.startsWith('DELETE FROM analysts WHERE id = $1')) {
    const id = parseInt(params[0], 10);
    localStore.analysts = (localStore.analysts || []).filter(a => a.id !== id);
    saveLocalStore();
    return { rows: [] };
  }

  // 14. Knowledge Base
  if (sql.includes('FROM knowledge_base WHERE id = $1')) {
    const id = parseInt(params[0], 10);
    const item = (localStore.knowledge_base || []).find(k => k.id === id);
    return { rows: item ? [item] : [] };
  }

  if (sql.startsWith('DELETE FROM knowledge_base WHERE id = $1')) {
    const id = parseInt(params[0], 10);
    localStore.knowledge_base = (localStore.knowledge_base || []).filter(k => k.id !== id);
    saveLocalStore();
    return { rows: [] };
  }

  if (sql.includes('FROM knowledge_base')) {
    let list = [...(localStore.knowledge_base || [])];
    if (params && params.length > 0) {
      params.forEach(p => {
        if (typeof p === 'string' && p.includes('%')) {
          const q = p.replace(/%/g, '').trim().toLowerCase();
          if (q) {
            list = list.filter(k => 
              (k.vulnerability_name || '').toLowerCase().includes(q) ||
              (k.owasp_category || '').toLowerCase().includes(q) ||
              (k.cwe_number || '').toLowerCase().includes(q) ||
              (k.description || '').toLowerCase().includes(q)
            );
          }
        } else if (typeof p === 'string' && ['Critical', 'High', 'Medium', 'Low'].includes(p)) {
          list = list.filter(k => k.severity === p);
        }
      });
    }
    return { rows: list };
  }

  // 15. INSERT INTO knowledge_base
  if (sql.startsWith('INSERT INTO knowledge_base')) {
    localStore.knowledge_base = localStore.knowledge_base || [];
    const newId = localStore.knowledge_base.length ? Math.max(...localStore.knowledge_base.map(x => x.id)) + 1 : 1;
    const [vulnerability_name, description, steps_to_reproduce, remediation, severity, reference, owasp_category, cwe_number, cwe_url] = params;
    const item = {
      id: newId,
      vulnerability_name,
      description,
      steps_to_reproduce: steps_to_reproduce || '',
      remediation: remediation || '',
      severity: severity || 'Medium',
      reference: reference || vulnerability_name,
      owasp_category: owasp_category || 'A00:2021',
      cwe_number: cwe_number || 'CWE-000',
      cwe_url: cwe_url || '',
      created_at: new Date().toISOString()
    };
    localStore.knowledge_base.unshift(item);
    saveLocalStore();
    return { rows: [item] };
  }

  // 15b. UPDATE knowledge_base
  if (sql.startsWith('UPDATE knowledge_base')) {
    const [vulnerability_name, description, steps_to_reproduce, remediation, severity, reference, owasp_category, cwe_number, cwe_url, id] = params;
    const kbId = parseInt(id, 10);
    const item = (localStore.knowledge_base || []).find(k => k.id === kbId);
    if (item) {
      item.vulnerability_name = vulnerability_name;
      item.description = description;
      item.steps_to_reproduce = steps_to_reproduce || '';
      item.remediation = remediation || '';
      item.severity = severity || 'Medium';
      item.reference = reference || vulnerability_name;
      item.owasp_category = owasp_category || 'A00:2021';
      item.cwe_number = cwe_number || 'CWE-000';
      item.cwe_url = cwe_url || '';
      saveLocalStore();
      return { rows: [item] };
    }
    return { rows: [] };
  }

  // 16. Activity Logs
  if (sql.startsWith('INSERT INTO activity_logs')) {
    const newId = localStore.activity_logs.length + 1;
    const [user_id, username, role, action, details] = params;
    const normalizedRole = role === 'Super Admin' ? 'Admin' : (role || 'Admin');
    const log = {
      id: newId,
      user_id,
      username,
      role: normalizedRole,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    localStore.activity_logs.unshift(log);
    saveLocalStore();
    return { rows: [log] };
  }

  if (sql.includes('FROM activity_logs')) {
    const normalized = (localStore.activity_logs || []).map(l => ({
      ...l,
      role: l.role === 'Super Admin' ? 'Admin' : (l.role || 'Admin')
    }));
    return { rows: normalized };
  }

  // 17. Analytics stats
  if (sql.includes('COUNT(*) AS total_findings')) {
    const f = localStore.findings;
    return {
      rows: [{
        total_findings: f.length,
        critical: f.filter(x => x.severity === 'Critical').length,
        high: f.filter(x => x.severity === 'High').length,
        medium: f.filter(x => x.severity === 'Medium').length,
        low: f.filter(x => x.severity === 'Low').length,
        open: f.filter(x => x.status === 'Open').length,
        closed: f.filter(x => x.status === 'Closed').length
      }]
    };
  }

  if (sql.includes('total_projects') || (sql.includes('FROM projects') && sql.includes('COUNT('))) {
    const p = localStore.projects || [];
    return {
      rows: [{
        total_projects: p.length,
        apk_count: p.filter(x => (x.target_url || '').toLowerCase().includes('.apk')).length,
        web_count: p.filter(x => !(x.target_url || '').toLowerCase().includes('.apk')).length
      }]
    };
  }

  if (sql.includes('SELECT owasp_category, COUNT(*)') || (sql.includes('owasp_category') && sql.includes('COUNT('))) {
    const counts = {};
    localStore.findings.forEach(f => {
      if (f.owasp_category) {
        counts[f.owasp_category] = (counts[f.owasp_category] || 0) + 1;
      }
    });
    const rows = Object.keys(counts).map(cat => ({
      owasp_category: cat,
      count: counts[cat]
    })).sort((a, b) => b.count - a.count);
    return { rows };
  }

  if (sql.includes('cwe_number') && sql.includes('COUNT(')) {
    const counts = {};
    (localStore.findings || []).forEach(f => {
      if (f.cwe_number) {
        counts[f.cwe_number] = (counts[f.cwe_number] || 0) + 1;
      }
    });
    const rows = Object.keys(counts).map(cwe => ({
      cwe_number: cwe,
      count: counts[cwe]
    })).sort((a, b) => b.count - a.count);
    return { rows };
  }

  // 18. Checklist Sessions
  if (sql.includes('FROM checklist_sessions WHERE user_id = $1 AND session_date = $2')) {
    const userId = parseInt(params[0], 10);
    const date = params[1];
    const session = (localStore.checklist_sessions || []).find(s => s.user_id === userId && s.session_date === date);
    return { rows: session ? [session] : [] };
  }

  if (sql.includes('FROM checklist_sessions WHERE session_date = $1')) {
    const date = params[0];
    const list = (localStore.checklist_sessions || []).filter(s => s.session_date === date);
    return { rows: list };
  }

  if (sql.includes('FROM checklist_sessions ORDER BY session_date DESC')) {
    const list = [...(localStore.checklist_sessions || [])].sort((a, b) => (b.session_date || '').localeCompare(a.session_date || ''));
    return { rows: list };
  }

  if (sql.startsWith('INSERT INTO checklist_sessions')) {
    localStore.checklist_sessions = localStore.checklist_sessions || [];
    const newId = localStore.checklist_sessions.length ? Math.max(...localStore.checklist_sessions.map(s => s.id)) + 1 : 1;
    const [user_id, username, session_date, target_url, project_name, checked_items, notes, tested_count, total_count] = params;
    
    // Check if session exists for this user and date to update
    const existingIndex = localStore.checklist_sessions.findIndex(s => s.user_id === parseInt(user_id, 10) && s.session_date === session_date);
    const sessionObj = {
      id: existingIndex >= 0 ? localStore.checklist_sessions[existingIndex].id : newId,
      user_id: parseInt(user_id, 10),
      username,
      session_date,
      target_url: target_url || '',
      project_name: project_name || '',
      checked_items: typeof checked_items === 'string' ? JSON.parse(checked_items) : checked_items,
      notes: notes || '',
      tested_count: parseInt(tested_count || 0, 10),
      total_count: parseInt(total_count || 0, 10),
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      localStore.checklist_sessions[existingIndex] = sessionObj;
    } else {
      localStore.checklist_sessions.unshift(sessionObj);
    }
    saveLocalStore();
    return { rows: [sessionObj] };
  }

  // Default empty
  return { rows: [] };
}

module.exports = {
  query,
  pool,
  checkPgConnection,
  getIsPgActive: () => isPgActive,
};
