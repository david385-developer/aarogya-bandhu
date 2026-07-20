const mongoose = require('mongoose')

const medicalFileSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientProfile', required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    cloudinaryUrl: { type: String, required: true },
    resourceType: { type: String, default: 'auto' },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    category: { type: String, default: 'General', trim: true },
  },
  { timestamps: true },
)

medicalFileSchema.index({ patientId: 1, uploadedAt: -1 })

module.exports = mongoose.model('MedicalFile', medicalFileSchema)
