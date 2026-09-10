const bcrypt = require('bcryptjs');
const UserModel = require('../models/User');
const ActivityLogModel = require('../models/ActivityLog');

class UserService {
  static async getAllUsers() {
    return await UserModel.findAll();
  }

  static async createUser({ name, username, email, password, role, status, department }, adminUser) {
    if (!name || !username || !email || !password) {
      throw { status: 400, message: 'All fields (name, username, email, password) are required.' };
    }

    const existing = await UserModel.findByUsernameOrEmail(username);
    if (existing) {
      throw { status: 400, message: 'Username or email already exists in system.' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      passwordHash,
      role: role || 'Security Analyst',
      status: status || 'Active',
      department: department || 'Software'
    });

    if (adminUser) {
      await ActivityLogModel.create({
        userId: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        action: 'User Created',
        details: 'Created new user ' + newUser.username + ' (' + newUser.role + ')'
      });
    }

    return newUser;
  }

  static async updateUser(id, { name, role, status, department }, adminUser) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    const updated = await UserModel.update(id, { name, role, status, department });
    if (adminUser) {
      await ActivityLogModel.create({
        userId: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        action: 'User Updated',
        details: 'Updated role & clearance for user ' + user.username + ' (' + (role || user.role) + ')'
      });
    }
    return updated;
  }

  static async deleteUser(id, adminUser) {
    const user = await UserModel.findById(id);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    if (user.username === 'admin') {
      throw { status: 403, message: 'Cannot delete primary root administrator account.' };
    }

    await UserModel.delete(id);

    if (adminUser) {
      await ActivityLogModel.create({
        userId: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        action: 'User Deleted',
        details: 'Deleted user ' + user.username + ' (' + user.role + ')'
      });
    }

    return true;
  }
}

module.exports = UserService;
