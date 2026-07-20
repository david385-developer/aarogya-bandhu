const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/rbacMiddleware')
const { asyncHandler } = require('../middleware/asyncHandler')
const { scanPassport, getMyQr } = require('../controllers/passportController')
const { ROLES } = require('../constants/roles')

const passportRoutes = express.Router()

passportRoutes.post('/scan', requireAuth, requireRole(ROLES.DOCTOR, ROLES.ADMIN, ROLES.RECEPTIONIST), asyncHandler(scanPassport))
passportRoutes.get('/my-qr', requireAuth, requireRole(ROLES.PATIENT), asyncHandler(getMyQr))

module.exports = { passportRoutes }
