const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Server error' : err.message;

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  res.status(statusCode).json({
    message,
    details: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
};

module.exports = errorHandler;
