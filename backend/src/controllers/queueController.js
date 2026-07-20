const QueueToken = require('../models/QueueToken')
const HealthEvent = require('../models/HealthEvent')
const Notification = require('../models/Notification')
const PatientProfile = require('../models/PatientProfile')
const { AppError } = require('../utils/appError')

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
  const payload = {
    patientId: req.body.patient_id || req.body.patientId,
    doctorId: req.body.doctor_id || req.body.doctorId,
    tokenNumber: req.body.token_number || req.body.tokenNumber || 1,
    status: req.body.status || 'waiting',
  }

  const token = await QueueToken.create(payload)
  const populated = await QueueToken.findById(token._id).populate('patientId').populate('doctorId')

  const patient = await PatientProfile.findById(token.patientId)
  if (patient) {
    const event = await HealthEvent.create({
      patientId: patient._id,
      actorId: req.user._id,
      actorRole: req.user.role,
      eventType: 'CHECKED_IN',
      entityType: 'queueToken',
      entityId: String(token._id),
      title: 'Patient Checked In',
      description: `Token number #${token.tokenNumber} assigned for consultation.`,
      severity: 'info',
      sourceModule: 'reception',
    })

    await Notification.create({
      userId: patient.userId,
      patientId: patient._id,
      healthEventId: event._id,
      type: 'check_in',
      title: 'Token Assigned',
      message: `You have been checked in with Token #${token.tokenNumber}. Please wait for your turn.`,
    })
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

  const doc = token.toObject()
  doc.patients = doc.patientId
  doc.doctors = doc.doctorId
  doc.patient_id = doc.patientId ? doc.patientId._id : null
  doc.doctor_id = doc.doctorId ? doc.doctorId._id : null
  doc.token_number = doc.tokenNumber

  res.status(200).json({ success: true, data: doc })
}

module.exports = { listQueueTokens, createQueueToken, updateQueueToken }
