const mongoose = require('mongoose')

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    doctorId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: null, trim: true },
    specialization: { type: String, default: 'General Medicine', trim: true },
    department: { type: String, default: 'General Medicine', trim: true },
    avatarUrl: { type: String, default: null },
  },
  { timestamps: true },
)

doctorProfileSchema.index({ email: 1 })

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema)
