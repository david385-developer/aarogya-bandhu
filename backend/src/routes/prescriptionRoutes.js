const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { asyncHandler } = require('../middleware/asyncHandler')
const { listPrescriptions, createPrescription } = require('../controllers/prescriptionController')

const prescriptionRoutes = express.Router()

prescriptionRoutes.get('/', requireAuth, asyncHandler(listPrescriptions))
prescriptionRoutes.post('/', requireAuth, asyncHandler(createPrescription))

module.exports = { prescriptionRoutes }
