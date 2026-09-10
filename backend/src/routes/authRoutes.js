const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getMe);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/password', verifyToken, authController.changePassword);
router.get('/profile-stats', verifyToken, authController.getProfileStats);

module.exports = router;
