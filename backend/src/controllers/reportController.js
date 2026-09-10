const ReportExportService = require('../services/reportExportService');
const ActivityLogModel = require('../models/ActivityLog');

exports.exportExcel = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { buffer, projectName } = await ReportExportService.generateProjectExcel(projectId);

    if (req.user) {
      await ActivityLogModel.create({
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        action: 'VAPT Report Exported',
        details: `Downloaded official Excel VAPT audit report for '${projectName}' (Form BISAG/SD/FR-207)`
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="' + projectName + '-VAPT-Report.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Excel Export Error:', err);
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const analytics = await ReportExportService.getAnalytics(req.user);
    return res.json({ success: true, ...analytics });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.compareProjects = async (req, res) => {
  try {
    const { baseProjectId, compareProjectId } = req.query;
    if (!baseProjectId || !compareProjectId) {
      return res.status(400).json({ success: false, message: 'Both project IDs are required for comparison.' });
    }
    const result = await ReportExportService.compareProjects(baseProjectId, compareProjectId);
    if (req.user) {
      await ActivityLogModel.create({
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        action: 'Cycle Comparison Analyzed',
        details: `Analyzed delta comparison between Project #${baseProjectId} and Project #${compareProjectId}`
      });
    }
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};
