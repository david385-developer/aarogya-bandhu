const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { asyncHandler } = require('../middleware/asyncHandler')
const { listTimelineEvents, createTimelineEvent } = require('../controllers/timelineController')

const timelineRoutes = express.Router()

timelineRoutes.get('/', requireAuth, asyncHandler(listTimelineEvents))
timelineRoutes.post('/', requireAuth, asyncHandler(createTimelineEvent))

module.exports = { timelineRoutes }
