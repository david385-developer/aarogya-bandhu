const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { asyncHandler } = require('../middleware/asyncHandler')
const { listDoctors, getDoctorByEmail, getDoctorById, updateDoctor } = require('../controllers/doctorController')

const doctorRoutes = express.Router()

doctorRoutes.get('/', requireAuth, asyncHandler(listDoctors))
doctorRoutes.get('/by-email/:email', requireAuth, asyncHandler(getDoctorByEmail))
doctorRoutes.get('/:id', requireAuth, asyncHandler(getDoctorById))
doctorRoutes.patch('/:id', requireAuth, asyncHandler(updateDoctor))

module.exports = { doctorRoutes }
