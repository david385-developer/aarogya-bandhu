const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { asyncHandler } = require('../middleware/asyncHandler')
const { listNotifications, updateNotification, deleteNotification } = require('../controllers/notificationController')

const notificationRoutes = express.Router()

notificationRoutes.get('/', requireAuth, asyncHandler(listNotifications))
notificationRoutes.patch('/:id', requireAuth, asyncHandler(updateNotification))
notificationRoutes.delete('/:id', requireAuth, asyncHandler(deleteNotification))

module.exports = { notificationRoutes }
