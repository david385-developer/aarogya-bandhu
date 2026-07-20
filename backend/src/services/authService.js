const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const User = require('../models/User')
const PatientProfile = require('../models/PatientProfile')
const DoctorProfile = require('../models/DoctorProfile')
const RefreshToken = require('../models/RefreshToken')
const { ROLES } = require('../constants/roles')
const { AppError } = require('../utils/appError')
const { signAccessToken, createRefreshToken, hashToken } = require('../utils/tokens')
const { createHealthEvent } = require('./healthEventService')
const { createNotification } = require('./notificationService')
const { ensurePassport } = require('./passportService')

function buildRedirectPath(role) {
  switch (role) {
    case ROLES.PATIENT:
      return '/patient'
    case ROLES.DOCTOR:
      return '/doctor'
    case ROLES.RECEPTIONIST:
      return '/reception'
    case ROLES.LABORATORY:
      return '/lab'
    case ROLES.ADMIN:
      return '/admin'
    default:
      return '/login'
  }
}

function publicUser(user, profile = null) {
  return {
    id: user._id,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    phone: user.phone,
    created_at: user.createdAt,
    profile,
  }
}

async function register(payload) {
  const existing = await User.findOne({ email: payload.email })
  if (existing) throw new AppError('Email already in use', 409)

  const passwordHash = await bcrypt.hash(payload.password, 12)
  const user = await User.create({
    fullName: payload.fullName,
    email: payload.email,
    passwordHash,
    role: payload.role,
    phone: payload.phone || null,
    status: 'active',
  })

  let profile = null

  if (payload.role === ROLES.PATIENT) {
    const patientCount = await PatientProfile.countDocuments()
    profile = await PatientProfile.create({
      userId: user._id,
      patientId: `PT-${String(patientCount + 1).padStart(6, '0')}`,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone || null,
      allergies: [],
      chronicDiseases: [],
      currentMedications: [],
    })
    const passport = await ensurePassport(profile)
    const event = await createHealthEvent({
      patientId: profile._id,
      actorId: user._id,
      actorRole: user.role,
      eventType: 'PATIENT_REGISTERED',
      entityType: 'patientProfile',
      entityId: String(profile._id),
      title: 'Patient Registered',
      severity: 'info',
      metadata: { patientId: profile.patientId, passportToken: passport.passportToken },
      referenceIds: { userId: String(user._id), passportId: String(passport._id) },
      sourceModule: 'auth',
    })

    await createNotification({
      userId: user._id,
      patientId: profile._id,
      healthEventId: event._id,
      type: 'registration',
      title: 'Welcome to Arogya Bandhu',
      message: 'Your patient profile and QR passport are ready.',
    })
  } else if (payload.role === ROLES.DOCTOR) {
    const doctorCount = await DoctorProfile.countDocuments()
    profile = await DoctorProfile.create({
      userId: user._id,
      doctorId: `DR-${String(doctorCount + 1).padStart(5, '0')}`,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone || null,
      specialization: 'General Medicine',
      department: 'General Medicine',
    })
  }

  const accessToken = signAccessToken({ sub: String(user._id), role: user.role })
  const refreshToken = createRefreshToken()
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  })

  return {
    user: publicUser(user, profile),
    token: accessToken,
    refreshToken,
    redirectTo: buildRedirectPath(user.role),
  }
}

async function login(payload) {
  const user = await User.findOne({ email: payload.email }).select('+passwordHash')
  if (!user) throw new AppError('Invalid credentials', 401)
  if (user.status !== 'active') throw new AppError('Account is disabled', 403)

  const ok = await bcrypt.compare(payload.password, user.passwordHash)
  if (!ok) throw new AppError('Invalid credentials', 401)

  user.lastLoginAt = new Date()
  await user.save()

  const accessToken = signAccessToken({ sub: String(user._id), role: user.role })
  const refreshToken = createRefreshToken()
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  })

  return {
    user: publicUser(user),
    token: accessToken,
    refreshToken,
    redirectTo: buildRedirectPath(user.role),
  }
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId)
  if (!user) throw new AppError('User not found', 404)

  let profile = null
  if (user.role === ROLES.PATIENT) {
    profile = await PatientProfile.findOne({ userId: user._id })
  } else if (user.role === ROLES.DOCTOR) {
    profile = await DoctorProfile.findOne({ userId: user._id })
    if (!profile) {
      const doctorCount = await DoctorProfile.countDocuments()
      profile = await DoctorProfile.create({
        userId: user._id,
        doctorId: `DR-${String(doctorCount + 1).padStart(5, '0')}`,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || null,
        specialization: 'General Medicine',
        department: 'General Medicine',
      })
    }
  }

  return {
    user: publicUser(user, profile),
    redirectTo: buildRedirectPath(user.role),
  }
}

async function refreshSession(refreshToken) {
  const tokenDoc = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken), revokedAt: null })
  if (!tokenDoc) throw new AppError('Invalid refresh token', 401)
  if (tokenDoc.expiresAt.getTime() < Date.now()) throw new AppError('Refresh token expired', 401)

  const user = await User.findById(tokenDoc.userId)
  if (!user || user.status !== 'active') throw new AppError('Invalid session', 401)

  const accessToken = signAccessToken({ sub: String(user._id), role: user.role })
  return { token: accessToken, redirectTo: buildRedirectPath(user.role) }
}

async function logout(refreshToken, userId) {
  if (refreshToken) {
    await RefreshToken.updateOne(
      { tokenHash: hashToken(refreshToken), userId },
      { $set: { revokedAt: new Date() } },
    )
  }
  return { success: true }
}

module.exports = { register, login, getCurrentUser, refreshSession, logout, buildRedirectPath }
