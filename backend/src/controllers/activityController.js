const ActivityService = require('../services/activityService');

exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityService.getLogs(req.user);
    return res.json({ success: true, logs });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};
