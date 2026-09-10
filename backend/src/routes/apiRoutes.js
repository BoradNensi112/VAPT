const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const projectController = require('../controllers/projectController');
const kbController = require('../controllers/kbController');
const toolsController = require('../controllers/toolsController');
const reportController = require('../controllers/reportController');
const activityController = require('../controllers/activityController');

// --- Auth Routes ---
router.post('/auth/login', authController.login);
router.get('/auth/me', verifyToken, authController.getMe);

// --- User Management (Admin Only) ---
router.get('/users', verifyToken, requireRole(['Admin']), userController.getUsers);
router.post('/users', verifyToken, requireRole(['Admin']), userController.createUser);
router.put('/users/:id', verifyToken, requireRole(['Admin']), userController.updateUser);
router.delete('/users/:id', verifyToken, requireRole(['Admin']), userController.deleteUser);

// --- Projects & Findings ---
router.get('/projects', verifyToken, projectController.getProjects);
router.get('/projects/:id', verifyToken, projectController.getProjectById);
router.post('/projects', verifyToken, projectController.createProject);
router.put('/projects/:id', verifyToken, projectController.updateProject);
router.delete('/projects/:id', verifyToken, requireRole(['Admin', 'Project Manager']), projectController.deleteProject);

router.post('/projects/:id/findings', verifyToken, projectController.addFinding);
router.put('/findings/:findingId', verifyToken, projectController.updateFinding);
router.delete('/findings/:findingId', verifyToken, projectController.deleteFinding);

// --- Knowledge Base ---
router.get('/kb', verifyToken, kbController.getAllKB);
router.post('/kb', verifyToken, kbController.createKB);

// --- Security Utilities Suite ---
router.post('/tools/headers', verifyToken, toolsController.analyzeHeaders);
router.post('/tools/cors', verifyToken, toolsController.testCors);
router.post('/tools/clickjacking', verifyToken, toolsController.testClickjacking);

// --- Reports & Analytics ---
router.get('/reports/export/:projectId', verifyToken, reportController.exportExcel);
router.get('/reports/analytics', verifyToken, reportController.getAnalytics);
router.get('/reports/compare', verifyToken, reportController.compareProjects);

// --- Activity Logs ---
router.get('/activity-logs', verifyToken, activityController.getActivityLogs);

module.exports = router;
