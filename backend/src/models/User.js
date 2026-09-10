const db = require('../config/db');

class UserModel {
  static async findByUsernameOrEmail(term) {
    const result = await db.query(
      'SELECT * FROM users WHERE (username = $1 OR email = $1)',
      [term.trim()]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT id, name, username, email, role, status, department, phone, bio, specialization, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByIdWithHash(id) {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll() {
    const result = await db.query(
      'SELECT id, name, username, email, role, status, department, created_at FROM users ORDER BY id ASC'
    );
    return result.rows;
  }

  static async create({ name, username, email, passwordHash, role, status, department }) {
    const result = await db.query(
      'INSERT INTO users (name, username, email, password_hash, role, status, department) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, username, email, role, status, department, created_at',
      [name, username, email, passwordHash, role || 'Security Analyst', status || 'Active', department || 'Software']
    );
    return result.rows[0];
  }

  static async update(id, { name, role, status, department }) {
    const result = await db.query(
      'UPDATE users SET name = COALESCE($1, name), role = COALESCE($2, role), status = COALESCE($3, status), department = COALESCE($4, department) WHERE id = $5 RETURNING id, name, username, email, role, status, department, created_at',
      [name, role, status, department, id]
    );
    return result.rows[0];
  }

  static async updateProfile(id, { name, email, department, phone, bio, specialization }) {
    const result = await db.query(
      'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), department = COALESCE($3, department), phone = COALESCE($4, phone), bio = COALESCE($5, bio), specialization = COALESCE($6, specialization) WHERE id = $7 RETURNING id, name, username, email, role, status, department, phone, bio, specialization, created_at',
      [name, email, department, phone, bio, specialization, id]
    );
    return result.rows[0];
  }

  static async updatePassword(id, passwordHash) {
    const result = await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, name, username, email, role, status, department, created_at',
      [passwordHash, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    return true;
  }
}

module.exports = UserModel;
