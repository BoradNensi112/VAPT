const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All user management routes strictly require root Admin role
router.get('/', verifyToken, requireRole(['Admin']), userController.getAllUsers);
router.post('/', verifyToken, requireRole(['Admin']), userController.createUser);
router.put('/:id', verifyToken, requireRole(['Admin']), userController.updateUser);
router.delete('/:id', verifyToken, requireRole(['Admin']), userController.deleteUser);

module.exports = router;
