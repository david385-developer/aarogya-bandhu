const Notification = require('../models/Notification')
const { AppError } = require('../utils/appError')

async function listNotifications(req, res) {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 })
  const formatted = notifications.map((n) => {
    const doc = n.toObject()
    doc.user_id = doc.userId
    doc.is_read = doc.isRead
    doc.created_at = doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString()
    return doc
  })
  res.status(200).json({ success: true, data: formatted })
}

async function updateNotification(req, res) {
  const { id } = req.params
  const updates = {}
  if (req.body.is_read !== undefined || req.body.isRead !== undefined) {
    updates.isRead = req.body.is_read !== undefined ? req.body.is_read : req.body.isRead
    if (updates.isRead) updates.readAt = new Date()
  }

  const notification = await Notification.findOneAndUpdate({ _id: id, userId: req.user._id }, updates, { new: true })
  if (!notification) throw new AppError('Notification not found', 404)

  const doc = notification.toObject()
  doc.user_id = doc.userId
  doc.is_read = doc.isRead
  doc.created_at = doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString()

  res.status(200).json({ success: true, data: doc })
}

async function deleteNotification(req, res) {
  const { id } = req.params
  const result = await Notification.findOneAndDelete({ _id: id, userId: req.user._id })
  if (!result) throw new AppError('Notification not found', 404)
  res.status(200).json({ success: true, message: 'Notification deleted' })
}

module.exports = { listNotifications, updateNotification, deleteNotification }
