const PatientProfile = require('../models/PatientProfile')
const HealthEvent = require('../models/HealthEvent')
const { AppError } = require('../utils/appError')

async function listPatients(req, res) {
  const patients = await PatientProfile.find().sort({ fullName: 1 })
  res.status(200).json({ success: true, data: patients })
}

async function getPatientByEmail(req, res) {
  const { email } = req.params
  const patient = await PatientProfile.findOne({ email: email.toLowerCase() })
  res.status(200).json({ success: true, data: patient })
}

async function getPatientById(req, res) {
  const { id } = req.params
  const patient = await PatientProfile.findById(id)
  if (!patient) throw new AppError('Patient not found', 404)
  res.status(200).json({ success: true, data: patient })
}

async function updatePatient(req, res) {
  const { id } = req.params
  const patient = await PatientProfile.findByIdAndUpdate(id, req.body, { new: true })
  if (!patient) throw new AppError('Patient not found', 404)

  await HealthEvent.create({
    patientId: patient._id,
    actorId: req.user._id,
    actorRole: req.user.role,
    eventType: 'PROFILE_UPDATED',
    entityType: 'patientProfile',
    entityId: String(patient._id),
    title: 'Profile Updated',
    severity: 'info',
    sourceModule: 'patient',
  })

  res.status(200).json({ success: true, data: patient })
}

module.exports = { listPatients, getPatientByEmail, getPatientById, updatePatient }
