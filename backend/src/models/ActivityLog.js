const db = require('../config/db');

class ActivityLogModel {
  static async findAll(user) {
    if (user && user.role !== 'Admin' && user.role !== 'CISO' && user.role !== 'Super Admin') {
      const result = await db.query(
        'SELECT * FROM activity_logs WHERE username = $1 OR user_id = $2 ORDER BY timestamp DESC LIMIT 100',
        [user.username, user.id]
      );
      return result.rows;
    }
    const result = await db.query(
      'SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100'
    );
    return result.rows;
  }

  static async create({ userId, username, role, action, details }) {
    const result = await db.query(
      'INSERT INTO activity_logs (user_id, username, role, action, details) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId || null, username, role, action, details]
    );
    return result.rows[0];
  }
}

module.exports = ActivityLogModel;
