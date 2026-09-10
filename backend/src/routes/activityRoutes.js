const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, activityController.getActivityLogs);

module.exports = router;
