const mongoose = require('mongoose')

const patientProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    patientId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: null, trim: true },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, default: null, trim: true },
    bloodGroup: { type: String, default: null, trim: true },
    address: { type: String, default: null, trim: true },
    emergencyContactName: { type: String, default: null, trim: true },
    emergencyContactPhone: { type: String, default: null, trim: true },
    allergies: { type: [String], default: [] },
    chronicDiseases: { type: [String], default: [] },
    currentMedications: { type: [String], default: [] },
    photoUrl: { type: String, default: null },
  },
  { timestamps: true },
)

patientProfileSchema.index({ email: 1 })

module.exports = mongoose.model('PatientProfile', patientProfileSchema)
