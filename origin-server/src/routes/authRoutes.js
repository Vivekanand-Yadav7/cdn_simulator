const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', express.json(), authController.signup);
router.post('/login', express.json(), authController.login);

module.exports = router;
