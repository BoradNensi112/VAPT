const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/export/:projectId', verifyToken, reportController.exportExcel);
router.get('/analytics', verifyToken, reportController.getAnalytics);
router.get('/compare', verifyToken, reportController.compareProjects);

module.exports = router;

