const mongoose = require('mongoose')
const { ROLES } = require('../constants/roles')

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: Object.values(ROLES) },
    phone: { type: String, default: null, trim: true },
    status: { type: String, default: 'active', enum: ['active', 'disabled'] },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
)

userSchema.index({ role: 1 })

module.exports = mongoose.model('User', userSchema)
