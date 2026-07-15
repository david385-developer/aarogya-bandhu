const { register, login, getCurrentUser, refreshSession, logout } = require('../services/authService')

async function registerUser(req, res) {
  const result = await register(req.body)
  res.status(201).json({ success: true, ...result })
}

async function loginUser(req, res) {
  const result = await login(req.body)
  res.status(200).json({ success: true, ...result })
}

async function me(req, res) {
  const result = await getCurrentUser(req.user._id)
  res.status(200).json({ success: true, ...result })
}

async function refresh(req, res) {
  const result = await refreshSession(req.body.refreshToken)
  res.status(200).json({ success: true, ...result })
}

async function logoutUser(req, res) {
  const result = await logout(req.body.refreshToken, req.user._id)
  res.status(200).json({ success: true, ...result })
}

module.exports = { registerUser, loginUser, me, refresh, logoutUser }
