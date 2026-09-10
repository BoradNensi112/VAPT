const ProjectService = require('../services/projectService');

exports.getProjects = async (req, res) => {
  try {
    const projects = await ProjectService.getAllProjects();
    return res.json({ success: true, projects });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const data = await ProjectService.getProjectDetails(req.params.id);
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const project = await ProjectService.createProject(req.body, req.user);
    return res.status(201).json({ success: true, project, message: 'Project created successfully' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await ProjectService.updateProject(req.params.id, req.body, req.user);
    return res.json({ success: true, project, message: 'Project updated successfully' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.addFindings = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { findings } = req.body;
    if (!Array.isArray(findings)) {
      return res.status(400).json({ success: false, message: 'Findings must be an array.' });
    }
    const created = await ProjectService.addFindingsToProject(projectId, findings, req.user);
    return res.json({ success: true, findings: created, message: 'Findings updated successfully' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    await ProjectService.deleteProject(req.params.id, req.user);
    return res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};
