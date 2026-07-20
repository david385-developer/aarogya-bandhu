const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { asyncHandler } = require('../middleware/asyncHandler')
const { listPatients, getPatientByEmail, getPatientById, updatePatient } = require('../controllers/patientController')

const patientRoutes = express.Router()

patientRoutes.get('/', requireAuth, asyncHandler(listPatients))
patientRoutes.get('/by-email/:email', requireAuth, asyncHandler(getPatientByEmail))
patientRoutes.get('/:id', requireAuth, asyncHandler(getPatientById))
patientRoutes.patch('/:id', requireAuth, asyncHandler(updatePatient))

module.exports = { patientRoutes }
