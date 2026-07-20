const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { asyncHandler } = require('../middleware/asyncHandler')
const {
  createConsultation,
  listConsultations,
  getConsultationById,
} = require('../controllers/consultationController')

const consultationRoutes = express.Router()

consultationRoutes.post('/', requireAuth, asyncHandler(createConsultation))
consultationRoutes.get('/', requireAuth, asyncHandler(listConsultations))
consultationRoutes.get('/:id', requireAuth, asyncHandler(getConsultationById))

module.exports = { consultationRoutes }
