const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { asyncHandler } = require('../middleware/asyncHandler')
const { listQueueTokens, createQueueToken, updateQueueToken } = require('../controllers/queueController')

const queueRoutes = express.Router()

queueRoutes.get('/', requireAuth, asyncHandler(listQueueTokens))
queueRoutes.post('/', requireAuth, asyncHandler(createQueueToken))
queueRoutes.patch('/:id', requireAuth, asyncHandler(updateQueueToken))

module.exports = { queueRoutes }
