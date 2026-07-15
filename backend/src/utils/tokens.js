const jwt = require('jsonwebtoken')
const crypto = require('crypto')

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' })
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}

function createRefreshToken() {
  return crypto.randomBytes(48).toString('hex')
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

module.exports = { signAccessToken, verifyAccessToken, createRefreshToken, hashToken }
