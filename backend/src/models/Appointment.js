const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientProfile', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', required: true },
    appointmentDate: { type: String, required: true },
    appointmentTime: { type: String, required: true },
    status: { type: String, default: 'scheduled', enum: ['scheduled', 'completed', 'cancelled'] },
    reason: { type: String, default: null },
    tokenNumber: { type: Number, default: null },
  },
  { timestamps: true },
)

appointmentSchema.index({ patientId: 1, appointmentDate: -1 })
appointmentSchema.index({ doctorId: 1, appointmentDate: -1 })

module.exports = mongoose.model('Appointment', appointmentSchema)
