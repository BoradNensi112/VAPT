const express = require('express');
const router = express.Router();
const kbController = require('../controllers/kbController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', kbController.getKnowledgeBase);
router.get('/:id', kbController.getKBItemById);
router.post('/', verifyToken, kbController.createKBItem);
router.put('/:id', verifyToken, kbController.updateKBItem);
router.delete('/:id', verifyToken, kbController.deleteKBItem);

module.exports = router;
