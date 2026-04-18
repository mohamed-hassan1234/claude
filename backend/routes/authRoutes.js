const express = require('express');
const { loginValidators, login, me } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/login', loginValidators, login);
router.get('/me', protect, me);

module.exports = router;
