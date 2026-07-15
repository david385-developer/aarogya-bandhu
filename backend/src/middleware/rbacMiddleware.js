const { AppError } = require('../utils/appError')

function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('Authentication required', 401))
    if (!allowedRoles.includes(req.user.role)) return next(new AppError('Forbidden', 403))
    next()
  }
}

module.exports = { requireRole }
