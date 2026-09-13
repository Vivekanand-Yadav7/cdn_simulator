const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.post('/:name', fileController.postFile);
router.get('/:name', fileController.getFile);

module.exports = router;
