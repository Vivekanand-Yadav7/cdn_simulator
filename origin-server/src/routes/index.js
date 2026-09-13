const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.post('/file/:name', express.text({ type: '*/*' }), fileController.uploadFile);
router.get('/file/:name', fileController.downloadFile);

module.exports = router;
