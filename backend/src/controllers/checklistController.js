const ChecklistSession = require('../models/ChecklistSession');
const ActivityLog = require('../models/ActivityLog');

exports.getSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionDate = req.query.date || new Date().toISOString().slice(0, 10);

    const session = await ChecklistSession.getByUserAndDate(userId, sessionDate);
    res.json({
      success: true,
      sessionDate,
      session: session || {
        user_id: userId,
        username: req.user.username,
        session_date: sessionDate,
        target_url: '',
        project_name: '',
        checked_items: {},
        notes: '',
        tested_count: 0,
        total_count: 0
      }
    });
  } catch (err) {
    console.error('Error fetching checklist session:', err);
    res.status(500).json({ success: false, message: 'Server error fetching checklist session' });
  }
};

exports.saveSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;
    const role = req.user.role;
    const {
      sessionDate = new Date().toISOString().slice(0, 10),
      targetUrl = '',
      projectName = '',
      checkedItems = {},
      notes = '',
      testedCount = 0,
      totalCount = 0
    } = req.body;

    const saved = await ChecklistSession.saveSession({
      userId,
      username,
      sessionDate,
      targetUrl,
      projectName,
      checkedItems,
      notes,
      testedCount,
      totalCount
    });

    // Record activity log for SOC timeline
    const targetLabel = targetUrl || projectName || 'Security Audit Scope';
    await ActivityLog.create({
      userId,
      username,
      role,
      action: 'Daily Checklist Updated',
      details: `Tested ${testedCount}/${totalCount} items on '${targetLabel}' for session date ${sessionDate}`
    });

    res.json({
      success: true,
      message: 'Daily VAPT checklist session saved successfully',
      session: saved
    });
  } catch (err) {
    console.error('Error saving checklist session:', err);
    res.status(500).json({ success: false, message: 'Server error saving checklist session' });
  }
};

exports.getAllSessionDates = async (req, res) => {
  try {
    const sessions = await ChecklistSession.getAllSessions();
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'Super Admin' || req.user.role === 'CISO';
    
    // Scoped list
    const filtered = isAdmin
      ? sessions
      : sessions.filter(s => s.user_id === req.user.id || s.username === req.user.username);

    const summaries = filtered.map(s => ({
      id: s.id,
      sessionDate: s.session_date,
      username: s.username,
      targetUrl: s.target_url,
      projectName: s.project_name,
      testedCount: s.tested_count,
      totalCount: s.total_count,
      updatedAt: s.updated_at
    }));

    res.json({
      success: true,
      sessions: summaries
    });
  } catch (err) {
    console.error('Error fetching session dates:', err);
    res.status(500).json({ success: false, message: 'Server error fetching session dates' });
  }
};
