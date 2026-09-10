const ActivityLogModel = require('../models/ActivityLog');

class ActivityService {
  static async getLogs(user) {
    const rawLogs = await ActivityLogModel.findAll(user);
    return (rawLogs || []).map(log => ({
      ...log,
      role: log.role === 'Super Admin' ? 'Admin' : (log.role || 'Admin')
    }));
  }

  static async logAction({ userId, username, role, action, details }) {
    const normalizedRole = role === 'Super Admin' ? 'Admin' : (role || 'Admin');
    return await ActivityLogModel.create({ userId, username, role: normalizedRole, action, details });
  }
}

module.exports = ActivityService;
