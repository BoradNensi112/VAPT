const db = require('../config/db');

class FindingModel {
  static async findByProjectId(projectId) {
    const result = await db.query(
      'SELECT * FROM findings WHERE project_id = $1 ORDER BY id ASC',
      [projectId]
    );
    return result.rows;
  }

  static async create({ projectId, vulnerabilityName, description, stepsToReproduce, remediation, severity, reference, owaspCategory, cweNumber, cweUrl, status }) {
    const result = await db.query(
      `INSERT INTO findings (project_id, vulnerability_name, description, steps_to_reproduce, remediation, severity, reference, owasp_category, cwe_number, cwe_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        projectId,
        vulnerabilityName,
        description,
        stepsToReproduce,
        remediation,
        severity,
        reference || null,
        owaspCategory,
        cweNumber,
        cweUrl,
        status || 'Open'
      ]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM findings WHERE id = $1', [id]);
    return true;
  }

  static async deleteByProjectId(projectId) {
    await db.query('DELETE FROM findings WHERE project_id = $1', [projectId]);
    return true;
  }
}

module.exports = FindingModel;
