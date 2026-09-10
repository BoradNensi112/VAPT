const AnalystService = require('../services/analystService');

exports.getAllAnalysts = async (req, res) => {
  try {
    const analysts = await AnalystService.getAll();
    return res.json({ success: true, analysts });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.createAnalyst = async (req, res) => {
  try {
    const analyst = await AnalystService.create(req.body, req.user);
    return res.status(201).json({ success: true, analyst, message: 'Analyst added successfully' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.deleteAnalyst = async (req, res) => {
  try {
    await AnalystService.delete(req.params.id, req.user);
    return res.json({ success: true, message: 'Analyst removed successfully' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};
