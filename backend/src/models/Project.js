const db = require('../config/db');

class ProjectModel {
  static async findAll() {
    const result = await db.query(`
      SELECT p.*,
        COUNT(f.id) AS total_findings,
        COUNT(CASE WHEN f.severity = 'Critical' THEN 1 END) AS critical_count,
        COUNT(CASE WHEN f.severity = 'High' THEN 1 END) AS high_count,
        COUNT(CASE WHEN f.severity = 'Medium' THEN 1 END) AS medium_count,
        COUNT(CASE WHEN f.severity = 'Low' THEN 1 END) AS low_count,
        COUNT(CASE WHEN f.status = 'Open' THEN 1 END) AS open_count,
        COUNT(CASE WHEN f.status = 'Closed' THEN 1 END) AS closed_count
      FROM projects p
      LEFT JOIN findings f ON p.id = f.project_id
      GROUP BY p.id
      ORDER BY p.id DESC
    `);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async create({ projectName, targetUrl, securityAnalysts, projectManagers, cisoName, remarks, createdBy }) {
    const result = await db.query(
      `INSERT INTO projects (project_name, target_url, security_analysts, project_managers, ciso_name, remarks, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [projectName, targetUrl, securityAnalysts, projectManagers, cisoName, remarks, createdBy || null]
    );
    return result.rows[0];
  }

  static async update(id, { projectName, targetUrl, securityAnalysts, projectManagers, cisoName, remarks }) {
    const result = await db.query(
      `UPDATE projects
       SET project_name = $1, target_url = $2, security_analysts = $3, project_managers = $4, ciso_name = $5, remarks = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [projectName, targetUrl, securityAnalysts, projectManagers, cisoName, remarks, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM projects WHERE id = $1', [id]);
    return true;
  }
}

module.exports = ProjectModel;
