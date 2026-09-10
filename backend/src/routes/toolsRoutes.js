const express = require('express');
const router = express.Router();
const toolsController = require('../controllers/toolsController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/headers', toolsController.checkHeaders);
router.post('/ports', toolsController.scanPorts);
router.post('/dns', toolsController.reconDns);
router.post('/ssl', toolsController.inspectSsl);
router.post('/sensitive-files', toolsController.probeSensitiveFiles);
router.post('/cors', toolsController.testCors);
router.post('/run', toolsController.runToolScan);

module.exports = router;


