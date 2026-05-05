const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { signupValidation, loginValidation } = require('../middleware/validation');

// Public routes
router.post('/signup', signupValidation, authController.signup);
router.post('/login', loginValidation, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);
router.get('/users', authenticateToken, isAdmin, authController.getAllUsers);
router.get('/users/search', authenticateToken, authController.searchUsers);

module.exports = router;
