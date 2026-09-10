const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, projectController.getProjects);
router.get('/:id', verifyToken, projectController.getProjectById);
router.post('/', verifyToken, projectController.createProject);
router.put('/:id', verifyToken, projectController.updateProject);
router.post('/:projectId/findings', verifyToken, projectController.addFindings);
router.delete('/:id', verifyToken, projectController.deleteProject);

module.exports = router;
