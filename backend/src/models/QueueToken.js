const mongoose = require('mongoose')

const queueTokenSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientProfile', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', required: true },
    tokenNumber: { type: Number, required: true },
    status: { type: String, default: 'waiting', enum: ['waiting', 'in_progress', 'completed', 'cancelled'] },
  },
  { timestamps: true },
)

queueTokenSchema.index({ doctorId: 1, status: 1, tokenNumber: 1 })
queueTokenSchema.index({ patientId: 1, createdAt: -1 })

module.exports = mongoose.model('QueueToken', queueTokenSchema)
