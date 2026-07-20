const mongoose = require('mongoose')

const passportSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientProfile', required: true, unique: true },
    passportToken: { type: String, required: true, unique: true, trim: true },
    qrPayload: { type: Object, required: true },
    publicSummary: { type: Object, default: {} },
    status: { type: String, default: 'active', enum: ['active', 'inactive'] },
    version: { type: Number, default: 1 },
    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true },
)


module.exports = mongoose.model('Passport', passportSchema)
