const express = require('express')
const multer = require('multer')
const { requireAuth } = require('../middleware/authMiddleware')
const { asyncHandler } = require('../middleware/asyncHandler')
const { listPatients, getPatientByEmail, getPatientById, updatePatient } = require('../controllers/patientController')
const { uploadMedicalFile, listMyMedicalFiles } = require('../controllers/medicalFileController')
const { listMyTimelineEvents } = require('../controllers/timelineController')
const { listConsultations } = require('../controllers/consultationController')
const { listPrescriptions } = require('../controllers/prescriptionController')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
})

const patientRoutes = express.Router()

// Specific paths MUST come before parameter routes like /:id
patientRoutes.post('/me/medical-files', requireAuth, upload.single('file'), asyncHandler(uploadMedicalFile))
patientRoutes.get('/me/medical-files', requireAuth, asyncHandler(listMyMedicalFiles))
patientRoutes.get('/me/timeline', requireAuth, asyncHandler(listMyTimelineEvents))
patientRoutes.get('/me/consultations', requireAuth, asyncHandler(listConsultations))
patientRoutes.get('/me/prescriptions', requireAuth, asyncHandler(listPrescriptions))

patientRoutes.get('/', requireAuth, asyncHandler(listPatients))
patientRoutes.get('/by-email/:email', requireAuth, asyncHandler(getPatientByEmail))

// Sub-resource endpoints for a specific patientId
patientRoutes.get('/:patientId/consultations', requireAuth, asyncHandler(listConsultations))
patientRoutes.get('/:patientId/prescriptions', requireAuth, asyncHandler(listPrescriptions))
patientRoutes.get('/:patientId/medical-files', requireAuth, asyncHandler(listMyMedicalFiles))

patientRoutes.get('/:id', requireAuth, asyncHandler(getPatientById))
patientRoutes.patch('/:id', requireAuth, asyncHandler(updatePatient))

module.exports = { patientRoutes }
