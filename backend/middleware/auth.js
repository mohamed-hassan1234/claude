const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Authentication token is required');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
  const user = await AdminUser.findById(decoded.id).select('-passwordHash');

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Admin account is not active');
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};

module.exports = { protect, authorize };
