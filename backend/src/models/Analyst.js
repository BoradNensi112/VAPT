const db = require('../config/db');

class AnalystModel {
  static async findAll() {
    const result = await db.query(
      'SELECT id, name, department, is_active, created_at FROM analysts ORDER BY name ASC'
    );
    return result.rows;
  }

  static async findByName(name) {
    const result = await db.query(
      'SELECT * FROM analysts WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );
    return result.rows[0] || null;
  }

  static async create({ name, department = 'General' }) {
    const existing = await this.findByName(name);
    if (existing) return existing;

    const result = await db.query(
      `INSERT INTO analysts (name, department, is_active)
       VALUES ($1, $2, true)
       RETURNING *`,
      [name.trim(), department]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM analysts WHERE id = $1', [id]);
    return true;
  }
}

module.exports = AnalystModel;
