const { AppError } = require('../utils/appError')

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'
  if (err instanceof AppError || err.isOperational) {
    return res.status(statusCode).json({ success: false, message })
  }
  return res.status(statusCode).json({ success: false, message })
}

module.exports = { errorHandler }
