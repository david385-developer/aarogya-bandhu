const mongoose = require('mongoose')

const consultationSchema = new mongoose.Schema(
  {
    consultationId: { type: String, default: () => 'CONS-' + Math.floor(100000 + Math.random() * 900000), index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientProfile', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', required: true, index: true },
    doctorName: { type: String, required: true, trim: true },
    chiefComplaint: { type: String, default: null, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    symptoms: { type: String, default: null, trim: true },
    notes: { type: String, default: null, trim: true },
    followUpDate: { type: String, default: null },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', default: null },
  },
  { timestamps: true },
)

consultationSchema.index({ patientId: 1, createdAt: -1 })
consultationSchema.index({ doctorId: 1, createdAt: -1 })

module.exports = mongoose.model('Consultation', consultationSchema)
