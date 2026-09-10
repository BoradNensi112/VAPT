const express = require('express');
const router = express.Router();
const analystController = require('../controllers/analystController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', analystController.getAllAnalysts);
router.post('/', verifyToken, analystController.createAnalyst);
router.delete('/:id', verifyToken, analystController.deleteAnalyst);

module.exports = router;
