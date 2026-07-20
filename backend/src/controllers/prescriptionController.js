const Prescription = require('../models/Prescription')
const HealthEvent = require('../models/HealthEvent')
const Notification = require('../models/Notification')
const PatientProfile = require('../models/PatientProfile')
const { AppError } = require('../utils/appError')

async function listPrescriptions(req, res) {
  const { patientId, doctorId } = req.query
  const filter = {}
  if (patientId) filter.patientId = patientId
  if (doctorId) filter.doctorId = doctorId

  const prescriptions = await Prescription.find(filter)
    .populate('doctorId')
    .sort({ createdAt: -1 })

  const formatted = prescriptions.map((p) => {
    const doc = p.toObject()
    doc.doctors = doc.doctorId
    return doc
  })

  res.status(200).json({ success: true, data: formatted })
}

async function createPrescription(req, res) {
  const prescription = await Prescription.create(req.body)
  const populated = await Prescription.findById(prescription._id).populate('doctorId')

  const patient = await PatientProfile.findById(prescription.patientId)
  if (patient) {
    const event = await HealthEvent.create({
      patientId: patient._id,
      actorId: req.user._id,
      actorRole: req.user.role,
      eventType: 'PRESCRIPTION_ISSUED',
      entityType: 'prescription',
      entityId: String(prescription._id),
      title: 'New Prescription Issued',
      description: prescription.diagnosis || 'Prescription added by doctor',
      severity: 'info',
      sourceModule: 'clinical',
    })

    await Notification.create({
      userId: patient.userId,
      patientId: patient._id,
      healthEventId: event._id,
      type: 'prescription',
      title: 'New Prescription Available',
      message: 'A new prescription has been added to your longitudinal medical records.',
    })
  }

  const doc = populated.toObject()
  doc.doctors = doc.doctorId

  res.status(201).json({ success: true, data: doc })
}

module.exports = { listPrescriptions, createPrescription }
