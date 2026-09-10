const db = require('../config/db');

class KnowledgeBaseModel {
  static async findAll(search = '', severity = '') {
    let sql = 'SELECT * FROM knowledge_base';
    const params = [];
    const conditions = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(
        LOWER(vulnerability_name) LIKE $${params.length} OR
        LOWER(owasp_category) LIKE $${params.length} OR
        LOWER(cwe_number) LIKE $${params.length} OR
        LOWER(description) LIKE $${params.length}
      )`);
    }

    if (severity && severity.trim()) {
      params.push(severity.trim());
      conditions.push(`severity = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY id ASC';

    const result = await db.query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM knowledge_base WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async create({ vulnerabilityName, description, stepsToReproduce, remediation, severity, reference, owaspCategory, cweNumber, cweUrl }) {
    const result = await db.query(
      `INSERT INTO knowledge_base (vulnerability_name, description, steps_to_reproduce, remediation, severity, reference, owasp_category, cwe_number, cwe_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        vulnerabilityName,
        description,
        stepsToReproduce || '',
        remediation || '',
        severity,
        reference || '',
        owaspCategory,
        cweNumber,
        cweUrl || `https://cwe.mitre.org/data/definitions/${cweNumber.replace(/[^0-9]/g, '')}.html`
      ]
    );
    return result.rows[0];
  }

  static async update(id, { vulnerabilityName, description, stepsToReproduce, remediation, severity, reference, owaspCategory, cweNumber, cweUrl }) {
    const result = await db.query(
      `UPDATE knowledge_base
       SET vulnerability_name = $1, description = $2, steps_to_reproduce = $3, remediation = $4, severity = $5, reference = $6, owasp_category = $7, cwe_number = $8, cwe_url = $9
       WHERE id = $10
       RETURNING *`,
      [
        vulnerabilityName,
        description,
        stepsToReproduce || '',
        remediation || '',
        severity,
        reference || '',
        owaspCategory,
        cweNumber,
        cweUrl || `https://cwe.mitre.org/data/definitions/${cweNumber.replace(/[^0-9]/g, '')}.html`,
        id
      ]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM knowledge_base WHERE id = $1', [id]);
    return true;
  }
}

module.exports = KnowledgeBaseModel;
