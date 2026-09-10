const AnalystModel = require('../models/Analyst');
const ActivityLogModel = require('../models/ActivityLog');

class AnalystService {
  static async getAll() {
    return await AnalystModel.findAll();
  }

  static async create({ name, department }, currentUser) {
    if (!name || !name.trim()) {
      throw { status: 400, message: 'Analyst name is required.' };
    }

    const analyst = await AnalystModel.create({
      name: name.trim(),
      department: department || 'General'
    });

    if (currentUser) {
      await ActivityLogModel.create({
        userId: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        action: 'Analyst Registered',
        details: `Registered dynamic security analyst '${analyst.name}'`
      });
    }

    return analyst;
  }

  static async delete(id, currentUser) {
    const list = await AnalystModel.findAll();
    const analyst = list.find(a => a.id === parseInt(id, 10));
    await AnalystModel.delete(id);
    if (currentUser) {
      await ActivityLogModel.create({
        userId: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        action: 'Analyst Deleted',
        details: `Deleted security analyst '${analyst ? analyst.name : '#' + id}'`
      });
    }
    return true;
  }
}

module.exports = AnalystService;
