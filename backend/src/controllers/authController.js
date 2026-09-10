const AuthService = require('../services/authService');

exports.login = async (req, res) => {
  try {
    const { username, password, role, adminSecretKey } = req.body;
    const data = await AuthService.login({ username, password, role, adminSecretKey });
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await AuthService.getMe(req.user.id);
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updated = await AuthService.updateProfile(req.user.id, req.body, req.user);
    return res.json({ success: true, user: updated, message: 'Profile updated successfully' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const updated = await AuthService.changePassword(req.user.id, req.body, req.user);
    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.getProfileStats = async (req, res) => {
  try {
    const stats = await AuthService.getProfileStats(req.user);
    return res.json({ success: true, stats });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};
