const mongoose = require('mongoose')

const healthEventSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientProfile', required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, trim: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    severity: { type: String, default: 'info', enum: ['info', 'warning', 'critical'] },
    metadata: { type: Object, default: {} },
    referenceIds: { type: Object, default: {} },
    correlationId: { type: String, default: null },
    sourceModule: { type: String, default: 'auth' },
  },
  { timestamps: true },
)

healthEventSchema.index({ patientId: 1, createdAt: -1 })
healthEventSchema.index({ eventType: 1, createdAt: -1 })
healthEventSchema.index({ actorId: 1, createdAt: -1 })

module.exports = mongoose.model('HealthEvent', healthEventSchema)
