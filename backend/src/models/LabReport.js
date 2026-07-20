const mongoose = require('mongoose')

const labReportSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientProfile', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', default: null },
    testName: { type: String, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'completed', 'verified'] },
    result: { type: Object, default: null },
    reportUrl: { type: String, default: null }, // Cloudinary URL
    notes: { type: String, default: null },
    requestedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

labReportSchema.index({ patientId: 1, createdAt: -1 })
labReportSchema.index({ status: 1 })

module.exports = mongoose.model('LabReport', labReportSchema)
