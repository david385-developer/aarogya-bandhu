const mongoose = require('mongoose')

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
}, { _id: false })

const prescriptionSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientProfile', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', required: true },
    medications: { type: [medicationSchema], default: [] },
    diagnosis: { type: String, default: null },
    notes: { type: String, default: null },
    followUpDate: { type: String, default: null },
  },
  { timestamps: true },
)

prescriptionSchema.index({ patientId: 1, createdAt: -1 })
prescriptionSchema.index({ doctorId: 1, createdAt: -1 })

module.exports = mongoose.model('Prescription', prescriptionSchema)
