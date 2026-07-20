const mongoose = require('mongoose')

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  medicineName: { type: String, trim: true },
  dosage: { type: String, required: true, trim: true },
  frequency: { type: String, required: true, trim: true },
  duration: { type: String, required: true, trim: true },
  instructions: { type: String, default: null, trim: true },
}, { _id: false })

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: { type: String, default: () => 'RX-' + Math.floor(100000 + Math.random() * 900000), index: true },
    consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', default: null, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientProfile', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', required: true, index: true },
    medications: { type: [medicationSchema], default: [] },
    diagnosis: { type: String, default: null, trim: true },
    notes: { type: String, default: null, trim: true },
    followUpDate: { type: String, default: null },
  },
  { timestamps: true },
)

prescriptionSchema.index({ patientId: 1, createdAt: -1 })
prescriptionSchema.index({ doctorId: 1, createdAt: -1 })

module.exports = mongoose.model('Prescription', prescriptionSchema)
