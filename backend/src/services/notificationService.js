const Notification = require('../models/Notification')

async function createNotification(payload) {
  return Notification.create(payload)
}

module.exports = { createNotification }
