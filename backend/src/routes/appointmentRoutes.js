const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { asyncHandler } = require('../middleware/asyncHandler')
const { listAppointments, createAppointment, updateAppointment } = require('../controllers/appointmentController')

const appointmentRoutes = express.Router()

appointmentRoutes.get('/', requireAuth, asyncHandler(listAppointments))
appointmentRoutes.post('/', requireAuth, asyncHandler(createAppointment))
appointmentRoutes.patch('/:id', requireAuth, asyncHandler(updateAppointment))

module.exports = { appointmentRoutes }
