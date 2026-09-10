const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklistController');
const { verifyToken } = require('../middleware/authMiddleware');

// All checklist routes require valid authentication
router.use(verifyToken);

router.get('/', checklistController.getSession);
router.post('/', checklistController.saveSession);
router.get('/history', checklistController.getAllSessionDates);

module.exports = router;
