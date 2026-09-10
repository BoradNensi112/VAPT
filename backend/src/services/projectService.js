const ProjectModel = require('../models/Project');
const FindingModel = require('../models/Finding');
const ActivityLogModel = require('../models/ActivityLog');

class ProjectService {
  static async getAllProjects() {
    return await ProjectModel.findAll();
  }

  static async getProjectDetails(id) {
    const project = await ProjectModel.findById(id);
    if (!project) {
      throw { status: 404, message: 'Project not found' };
    }
    const findings = await FindingModel.findByProjectId(id);
    return { project, findings };
  }

  static async createProject(data, currentUser) {
    const { project_name, target_url, security_analysts, project_managers, ciso_name, remarks } = data;

    if (!project_name || !target_url) {
      throw { status: 400, message: 'Project Name and Target URL are required.' };
    }

    const project = await ProjectModel.create({
      projectName: project_name.trim(),
      targetUrl: target_url.trim(),
      securityAnalysts: security_analysts || 'Ankit Mandaviya, Jai Mehta',
      projectManagers: project_managers || 'ABCD, WXYZ',
      cisoName: ciso_name || 'Shri ABCD',
      remarks: remarks || '1. Functional Bugs are attached to in the Findings folder Under !',
      createdBy: currentUser ? currentUser.id : null
    });

    if (currentUser) {
      await ActivityLogModel.create({
        userId: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        action: 'Project Created',
        details: `Created assessment project '${project.project_name}' for target ${project.target_url}`
      });
    }

    return project;
  }

  static async updateProject(id, data, currentUser) {
    const project = await ProjectModel.findById(id);
    if (!project) {
      throw { status: 404, message: 'Project not found' };
    }

    const { project_name, target_url, security_analysts, project_managers, ciso_name, remarks } = data;

    const updated = await ProjectModel.update(id, {
      projectName: project_name ? project_name.trim() : project.project_name,
      targetUrl: target_url ? target_url.trim() : project.target_url,
      securityAnalysts: security_analysts || project.security_analysts,
      projectManagers: project_managers || project.project_managers,
      cisoName: ciso_name || project.ciso_name,
      remarks: remarks !== undefined ? remarks : project.remarks
    });

    if (currentUser) {
      await ActivityLogModel.create({
        userId: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        action: 'Project Updated',
        details: `Updated project '${updated.project_name}'`
      });
    }

    return updated;
  }

  static async addFindingsToProject(projectId, findingsList, currentUser) {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw { status: 404, message: 'Project not found' };
    }

    // Refresh previous findings for this project
    await FindingModel.deleteByProjectId(projectId);

    const created = [];
    for (const f of findingsList) {
      const item = await FindingModel.create({
        projectId,
        vulnerabilityName: f.vulnerability_name || f.name,
        description: f.description || f.desc || '',
        stepsToReproduce: f.steps_to_reproduce || f.steps || '',
        remediation: f.remediation || '',
        severity: f.severity || 'Medium',
        reference: f.reference || f.name || '',
        owaspCategory: f.owasp_category || f.owasp || 'A00:2021',
        cweNumber: f.cwe_number || f.cwe_ref || 'CWE-000',
        cweUrl: f.cwe_url || f.cwe_ref_url || '',
        status: f.status || 'Open'
      });
      created.push(item);
    }

    if (currentUser) {
      await ActivityLogModel.create({
        userId: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        action: 'Findings Updated',
        details: `Updated ${created.length} finding(s) for project '${project.project_name}'`
      });
    }

    return created;
  }

  static async deleteProject(id, currentUser) {
    const project = await ProjectModel.findById(id);
    if (!project) {
      throw { status: 404, message: 'Project not found' };
    }

    await FindingModel.deleteByProjectId(id);
    await ProjectModel.delete(id);

    if (currentUser) {
      await ActivityLogModel.create({
        userId: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        action: 'Project Deleted',
        details: `Deleted project '${project.project_name}' and associated findings`
      });
    }

    return true;
  }
}

module.exports = ProjectService;
