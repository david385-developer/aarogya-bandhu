const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { asyncHandler } = require('../middleware/asyncHandler')
const {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  updateNotification,
  deleteNotification,
} = require('../controllers/notificationController')

const notificationRoutes = express.Router()

notificationRoutes.get('/me/unread-count', requireAuth, asyncHandler(getUnreadCount))
notificationRoutes.get('/unread-count', requireAuth, asyncHandler(getUnreadCount))
notificationRoutes.patch('/me/read-all', requireAuth, asyncHandler(markAllRead))
notificationRoutes.patch('/read-all', requireAuth, asyncHandler(markAllRead))
notificationRoutes.get('/me', requireAuth, asyncHandler(listNotifications))
notificationRoutes.get('/', requireAuth, asyncHandler(listNotifications))
notificationRoutes.patch('/:id/read', requireAuth, asyncHandler(markRead))
notificationRoutes.patch('/:id', requireAuth, asyncHandler(updateNotification))
notificationRoutes.delete('/:id', requireAuth, asyncHandler(deleteNotification))

module.exports = { notificationRoutes }
