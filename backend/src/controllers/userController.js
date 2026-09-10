const UserService = require('../services/userService');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    return res.json({ success: true, users });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await UserService.createUser(req.body, req.user);
    return res.status(201).json({ success: true, user, message: 'User provisioned successfully' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await UserService.updateUser(req.params.id, req.body, req.user);
    return res.json({ success: true, user, message: 'User updated successfully' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await UserService.deleteUser(req.params.id, req.user);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};
