const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { asyncHandler } = require('../middleware/asyncHandler')
const { listTimelineEvents, listMyTimelineEvents, createTimelineEvent } = require('../controllers/timelineController')

const timelineRoutes = express.Router()

timelineRoutes.get('/me', requireAuth, asyncHandler(listMyTimelineEvents))
timelineRoutes.get('/', requireAuth, asyncHandler(listTimelineEvents))
timelineRoutes.post('/', requireAuth, asyncHandler(createTimelineEvent))

module.exports = { timelineRoutes }
