const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const profileController = require('../controllers/profileController');

// Protect all profile routes
router.use(authMiddleware.protect);

// Get logged-in user info
router.get('/get-user-info', profileController.getUserInfo);

module.exports = router;
