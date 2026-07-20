const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { asyncHandler } = require('../middleware/asyncHandler')
const { listLabReports, createLabReport, updateLabReport } = require('../controllers/labReportController')

const labReportRoutes = express.Router()

labReportRoutes.get('/', requireAuth, asyncHandler(listLabReports))
labReportRoutes.post('/', requireAuth, asyncHandler(createLabReport))
labReportRoutes.patch('/:id', requireAuth, asyncHandler(updateLabReport))

module.exports = { labReportRoutes }
