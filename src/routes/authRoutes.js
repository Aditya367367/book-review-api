const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// Middleware to authenticate JWT tokens
router.post('/signup', authController.signup);
router.post('/login', authController.login);

module.exports = router;