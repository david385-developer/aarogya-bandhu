const { verifyAccessToken } = require('../utils/tokens')
const User = require('../models/User')
const { AppError } = require('../utils/appError')

async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return next(new AppError('Authentication required', 401))

    const decoded = verifyAccessToken(token)
    const user = await User.findById(decoded.sub)
    if (!user || user.status !== 'active') return next(new AppError('Invalid session', 401))

    req.user = user
    next()
  } catch (error) {
    next(new AppError('Invalid or expired token', 401))
  }
}

module.exports = { requireAuth }
