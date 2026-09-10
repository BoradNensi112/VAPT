const KBService = require('../services/kbService');

exports.getKnowledgeBase = async (req, res) => {
  try {
    const { search, severity } = req.query;
    const items = await KBService.getAll(search, severity);
    return res.json({ success: true, items });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.getKBItemById = async (req, res) => {
  try {
    const item = await KBService.getById(req.params.id);
    return res.json({ success: true, item });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.createKBItem = async (req, res) => {
  try {
    const item = await KBService.create(req.body, req.user);
    return res.status(201).json({ success: true, item, message: 'Vulnerability added to Knowledge Base' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.updateKBItem = async (req, res) => {
  try {
    const item = await KBService.update(req.params.id, req.body, req.user);
    return res.json({ success: true, item, message: 'Vulnerability updated in Knowledge Base' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.deleteKBItem = async (req, res) => {
  try {
    await KBService.delete(req.params.id, req.user);
    return res.json({ success: true, message: 'Vulnerability removed from Knowledge Base' });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};
