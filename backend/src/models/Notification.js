const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientProfile', default: null },
    healthEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthEvent', default: null },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ healthEventId: 1 })

module.exports = mongoose.model('Notification', notificationSchema)
