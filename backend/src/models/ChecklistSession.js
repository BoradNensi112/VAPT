const db = require('../config/db');

class ChecklistSession {
  static async getByUserAndDate(userId, sessionDate) {
    const res = await db.query(
      'SELECT * FROM checklist_sessions WHERE user_id = $1 AND session_date = $2',
      [userId, sessionDate]
    );
    return res.rows[0] || null;
  }

  static async getByDate(sessionDate) {
    const res = await db.query(
      'SELECT * FROM checklist_sessions WHERE session_date = $1',
      [sessionDate]
    );
    return res.rows;
  }

  static async getAllSessions() {
    const res = await db.query(
      'SELECT * FROM checklist_sessions ORDER BY session_date DESC'
    );
    return res.rows;
  }

  static async saveSession({ userId, username, sessionDate, targetUrl, projectName, checkedItems, notes, testedCount, totalCount }) {
    const res = await db.query(
      'INSERT INTO checklist_sessions (user_id, username, session_date, target_url, project_name, checked_items, notes, tested_count, total_count) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [
        userId,
        username,
        sessionDate,
        targetUrl || '',
        projectName || '',
        typeof checkedItems === 'string' ? checkedItems : JSON.stringify(checkedItems || {}),
        notes || '',
        testedCount || 0,
        totalCount || 0
      ]
    );
    return res.rows[0];
  }
}

module.exports = ChecklistSession;
