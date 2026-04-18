const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const AdminUser = require('../models/AdminUser');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/auditService');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_secret_change_me', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const loginValidators = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ApiError(400, errors.array()[0].msg);

  const user = await AdminUser.findOne({ email: req.body.email.toLowerCase() });
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) throw new ApiError(403, 'Admin account is disabled');

  user.lastLoginAt = new Date();
  await user.save();
  await writeAudit({ req, action: 'login', entity: 'AdminUser', entityId: user._id.toString() });

  res.json({
    token: signToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { loginValidators, login, me };
