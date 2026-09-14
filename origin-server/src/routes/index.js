const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const authRoutes = require('./authRoutes');

router.use('/auth', authRoutes);

router.post('/file/:name', express.text({ type: '*/*' }), fileController.uploadFile);
router.get('/file/:name', fileController.downloadFile);

module.exports = router;
