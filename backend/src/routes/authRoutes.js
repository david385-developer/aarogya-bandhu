const express = require('express')
const { registerValidator, loginValidator, refreshValidator } = require('../validators/authValidators')
const { validateRequest } = require('../middleware/validateRequest')
const { asyncHandler } = require('../middleware/asyncHandler')
const { requireAuth } = require('../middleware/authMiddleware')
const { registerUser, loginUser, me, refresh, logoutUser } = require('../controllers/authController')

const authRoutes = express.Router()

authRoutes.post('/register', registerValidator, validateRequest, asyncHandler(registerUser))
authRoutes.post('/login', loginValidator, validateRequest, asyncHandler(loginUser))
authRoutes.get('/me', requireAuth, asyncHandler(me))
authRoutes.post('/refresh', refreshValidator, validateRequest, asyncHandler(refresh))
authRoutes.post('/logout', requireAuth, asyncHandler(logoutUser))

module.exports = { authRoutes }
