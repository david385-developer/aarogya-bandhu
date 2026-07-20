const QueueToken = require('../models/QueueToken')
const HealthEvent = require('../models/HealthEvent')
const Notification = require('../models/Notification')
const PatientProfile = require('../models/PatientProfile')
const DoctorProfile = require('../models/DoctorProfile')
const Appointment = require('../models/Appointment')
const { AppError } = require('../utils/appError')

async function resolvePatientProfile(value) {
  if (!value) return null
  return (
    (await PatientProfile.findById(value).catch(() => null)) ||
    (await PatientProfile.findOne({ patientId: value }).catch(() => null)) ||
    (await PatientProfile.findOne({ userId: value }).catch(() => null))
  )
}

async function resolveDoctorProfile(value) {
  if (!value) return null
  return (
    (await DoctorProfile.findById(value).catch(() => null)) ||
    (await DoctorProfile.findOne({ doctorId: value }).catch(() => null)) ||
    (await DoctorProfile.findOne({ userId: value }).catch(() => null))
  )
}

async function listQueueTokens(req, res) {
  const { doctorId, status } = req.query
  const filter = {}
  if (doctorId) filter.doctorId = doctorId
  if (status) filter.status = status

  const tokens = await QueueToken.find(filter)
    .populate('patientId')
    .populate('doctorId')
    .sort({ tokenNumber: 1 })

  const formatted = tokens.map((t) => {
    const doc = t.toObject()
    doc.patients = doc.patientId
    doc.doctors = doc.doctorId
    doc.patient_id = doc.patientId ? doc.patientId._id : null
    doc.doctor_id = doc.doctorId ? doc.doctorId._id : null
    doc.token_number = doc.tokenNumber
    return doc
  })

  res.status(200).json({ success: true, data: formatted })
}

async function createQueueToken(req, res) {
  const rawPatientId = req.body.patient_id || req.body.patientId
  const rawDoctorId = req.body.doctor_id || req.body.doctorId
  const tokenNumber = Number(req.body.token_number || req.body.tokenNumber || 1)
  const status = req.body.status || 'waiting'

  if (!rawPatientId) throw new AppError('Patient ID is required', 400)
  if (!rawDoctorId) throw new AppError('Doctor ID is required', 400)
  if (!Number.isFinite(tokenNumber) || tokenNumber <= 0) throw new AppError('Token number must be a positive number', 400)

  const patient = await resolvePatientProfile(rawPatientId)
  const doctor = await resolveDoctorProfile(rawDoctorId)

  if (!patient) throw new AppError('Patient not found', 404)
  if (!doctor) throw new AppError('Doctor not found', 404)

  const payload = {
    patientId: patient._id,
    doctorId: doctor._id,
    tokenNumber,
    status,
  }

  let token
  try {
    token = await QueueToken.create(payload)
  } catch (error) {
    if (error && error.name === 'ValidationError') {
      throw new AppError(error.message, 400)
    }
    throw error
  }
  const populated = await QueueToken.findById(token._id).populate('patientId').populate('doctorId')
  if (!populated) throw new AppError('Queue token could not be created', 500)

  const today = new Date().toISOString().split('T')[0]
  if (patient && doctor) {
    const existingAppt = await Appointment.findOne({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate: today,
    })
    if (!existingAppt) {
      await Appointment.create({
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentDate: today,
        appointmentTime: new Date().toTimeString().slice(0, 5),
        reason: `Queue Token #${token.tokenNumber}`,
        status: 'scheduled',
      })
    }
  }

  if (patient) {
    // Generate QUEUE_TOKEN_GENERATED HealthEvent
    const eventToken = await HealthEvent.create({
      patientId: patient._id,
      actorId: req.user ? req.user._id : patient.userId,
      actorRole: req.user ? req.user.role : 'receptionist',
      eventType: 'QUEUE_TOKEN_GENERATED',
      entityType: 'queueToken',
      entityId: String(token._id),
      title: `Queue Token #${token.tokenNumber} Generated`,
      description: `Assigned for visit consultation.`,
      severity: 'info',
      sourceModule: 'reception',
    })

    if (patient.userId) {
      await Notification.create({
        userId: patient.userId,
        patientId: patient._id,
        healthEventId: eventToken._id,
        type: 'queue_token',
        title: 'Queue Token Generated',
        message: `Token #${token.tokenNumber} has been generated for your visit.`,
      })
    }

    // Generate DOCTOR_ASSIGNED HealthEvent
    if (doctor) {
      const eventDoc = await HealthEvent.create({
        patientId: patient._id,
        actorId: req.user ? req.user._id : patient.userId,
        actorRole: req.user ? req.user.role : 'receptionist',
        eventType: 'DOCTOR_ASSIGNED',
        entityType: 'queueToken',
        entityId: String(token._id),
        title: `Assigned to Dr. ${doctor.fullName || 'Doctor'}`,
        description: `Consultation queue token #${token.tokenNumber}`,
        severity: 'info',
        sourceModule: 'reception',
      })

      if (patient.userId) {
        await Notification.create({
          userId: patient.userId,
          patientId: patient._id,
          healthEventId: eventDoc._id,
          type: 'doctor_assigned',
          title: 'Doctor Assigned',
          message: `Dr. ${doctor.fullName || 'Doctor'} has been assigned for your consultation.`,
        })
      }

      if (doctor.userId) {
        await Notification.create({
          userId: doctor.userId,
          patientId: patient._id,
          healthEventId: eventDoc._id,
          type: 'doctor_assigned',
          title: 'New Patient Assigned',
          message: `${patient.fullName || 'Patient'} assigned to your queue with Token #${token.tokenNumber}.`,
        })
      }
    }
  }

  const doc = populated.toObject()
  doc.patients = doc.patientId
  doc.doctors = doc.doctorId
  doc.patient_id = doc.patientId ? doc.patientId._id : null
  doc.doctor_id = doc.doctorId ? doc.doctorId._id : null
  doc.token_number = doc.tokenNumber

  res.status(201).json({ success: true, data: doc })
}

async function updateQueueToken(req, res) {
  const { id } = req.params
  const token = await QueueToken.findByIdAndUpdate(id, req.body, { new: true })
    .populate('patientId')
    .populate('doctorId')
  if (!token) throw new AppError('Queue token not found', 404)

  const patient = await resolvePatientProfile(token.patientId)
  if (patient && req.body.status) {
    const event = await HealthEvent.create({
      patientId: patient._id,
      actorId: req.user ? req.user._id : patient.userId,
      actorRole: req.user ? req.user.role : 'doctor',
      eventType: `QUEUE_TOKEN_${req.body.status.toUpperCase()}`,
      entityType: 'queueToken',
      entityId: String(token._id),
      title: `Token #${token.tokenNumber} status: ${req.body.status}`,
      description: `Queue token status updated to ${req.body.status}`,
      severity: 'info',
      sourceModule: 'clinical',
    })

    if (patient.userId) {
      await Notification.create({
        userId: patient.userId,
        patientId: patient._id,
        healthEventId: event._id,
        type: 'queue_token',
        title: `Token #${token.tokenNumber} ${req.body.status.toUpperCase()}`,
        message: `Your consultation status is now ${req.body.status}.`,
      })
    }

    if (token.doctorId && req.body.status === 'completed') {
      const today = new Date().toISOString().split('T')[0]
      await Appointment.updateMany(
        { patientId: patient._id, doctorId: token.doctorId._id || token.doctorId, appointmentDate: today },
        { status: 'completed' }
      )
    }
  }

  const doc = token.toObject()
  doc.patients = doc.patientId
  doc.doctors = doc.doctorId
  doc.patient_id = doc.patientId ? doc.patientId._id : null
  doc.doctor_id = doc.doctorId ? doc.doctorId._id : null
  doc.token_number = doc.tokenNumber

  res.status(200).json({ success: true, data: doc })
}

module.exports = { listQueueTokens, createQueueToken, updateQueueToken }
