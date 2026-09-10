const KnowledgeBaseModel = require('../models/KnowledgeBase');
const ActivityLogModel = require('../models/ActivityLog');

class KBService {
  static async getAll(search, severity) {
    return await KnowledgeBaseModel.findAll(search, severity);
  }

  static async getById(id) {
    const item = await KnowledgeBaseModel.findById(id);
    if (!item) {
      throw { status: 404, message: 'Vulnerability not found in Knowledge Base' };
    }
    return item;
  }

  static async create(data, currentUser) {
    const { vulnerability_name, name, description, steps_to_reproduce, remediation, severity, reference, owasp_category, owasp, cwe_number, cwe, cwe_url } = data;

    const vulnName = (vulnerability_name || name || '').trim();
    if (!vulnName) {
      throw { status: 400, message: 'Vulnerability name is required.' };
    }

    const item = await KnowledgeBaseModel.create({
      vulnerabilityName: vulnName,
      description: description || '',
      stepsToReproduce: steps_to_reproduce || '',
      remediation: remediation || '',
      severity: severity || 'Medium',
      reference: reference || '',
      owaspCategory: owasp_category || owasp || 'A00:2021-General',
      cweNumber: cwe_number || cwe || 'CWE-000',
      cweUrl: cwe_url || ''
    });

    if (currentUser) {
      await ActivityLogModel.create({
        userId: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        action: 'Knowledge Base Added',
        details: `Added new vulnerability '${item.vulnerability_name}' (${item.severity})`
      });
    }

    return item;
  }

  static async update(id, data, currentUser) {
    const existing = await KnowledgeBaseModel.findById(id);
    if (!existing) {
      throw { status: 404, message: 'Vulnerability not found in Knowledge Base' };
    }

    const { vulnerability_name, name, description, steps_to_reproduce, remediation, severity, reference, owasp_category, owasp, cwe_number, cwe, cwe_url } = data;

    const vulnName = (vulnerability_name || name || existing.vulnerability_name || '').trim();

    const updated = await KnowledgeBaseModel.update(id, {
      vulnerabilityName: vulnName,
      description: description !== undefined ? description : existing.description,
      stepsToReproduce: steps_to_reproduce !== undefined ? steps_to_reproduce : existing.steps_to_reproduce,
      remediation: remediation !== undefined ? remediation : existing.remediation,
      severity: severity || existing.severity,
      reference: reference !== undefined ? reference : existing.reference,
      owaspCategory: owasp_category || owasp || existing.owasp_category,
      cweNumber: cwe_number || cwe || existing.cwe_number,
      cweUrl: cwe_url !== undefined ? cwe_url : existing.cwe_url
    });

    if (currentUser) {
      await ActivityLogModel.create({
        userId: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        action: 'Knowledge Base Updated',
        details: `Updated vulnerability '${updated.vulnerability_name}' (${updated.severity})`
      });
    }

    return updated;
  }

  static async delete(id, currentUser) {
    const item = await KnowledgeBaseModel.findById(id);
    if (!item) {
      throw { status: 404, message: 'Vulnerability not found in Knowledge Base' };
    }

    await KnowledgeBaseModel.delete(id);

    if (currentUser) {
      await ActivityLogModel.create({
        userId: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        action: 'Knowledge Base Deleted',
        details: `Deleted vulnerability '${item.vulnerability_name}'`
      });
    }

    return true;
  }
}

module.exports = KBService;
