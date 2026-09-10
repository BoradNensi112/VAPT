const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const projectRoutes = require('./projectRoutes');
const kbRoutes = require('./kbRoutes');
const analystRoutes = require('./analystRoutes');
const reportRoutes = require('./reportRoutes');
const toolsRoutes = require('./toolsRoutes');
const activityRoutes = require('./activityRoutes');
const checklistRoutes = require('./checklistRoutes');

// Mount modular sub-routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/kb', kbRoutes);
router.use('/analysts', analystRoutes);
router.use('/reports', reportRoutes);
router.use('/tools', toolsRoutes);
router.use('/activity-logs', activityRoutes);
router.use('/checklist', checklistRoutes);

module.exports = router;
