const HealthEvent = require('../models/HealthEvent')
const PatientProfile = require('../models/PatientProfile')
const { AppError } = require('../utils/appError')

function formatEvent(e) {
  const doc = e.toObject()
  if (doc.eventType === 'MEDICAL_RECORD_UPLOADED' || doc.eventType === 'upload') {
    doc.event_type = 'upload'
    doc.title = 'Medical Record Uploaded'
    doc.doctor_name = doc.metadata?.uploadedBy || doc.actorRole || 'Patient'
    doc.description = doc.metadata?.fileName || doc.metadata?.originalName || doc.description || 'Medical Document'
  } else if (doc.eventType === 'CONSULTATION_CREATED') {
    doc.event_type = 'consultation'
    doc.title = doc.title || (`Consultation with ${doc.metadata?.doctorName || 'Doctor'}`)
    doc.doctor_name = doc.metadata?.doctorName || doc.doctor_name || 'Doctor'
    doc.description = doc.metadata?.diagnosis ? (doc.metadata.diagnosis + (doc.metadata.notes ? ` · ${doc.metadata.notes}` : '')) : doc.description
  } else if (doc.eventType === 'PRESCRIPTION_CREATED' || doc.eventType === 'PRESCRIPTION_ISSUED') {
    doc.event_type = 'prescription'
    doc.title = doc.title || 'Prescription Added'
    doc.doctor_name = doc.metadata?.doctorName || doc.doctor_name || 'Doctor'
    const meds = doc.metadata?.medications
    doc.description = meds && Array.isArray(meds) ? meds.map(m => `${m.name || m.medicineName} (${m.dosage})`).join(', ') : doc.description
  } else {
    doc.event_type = doc.eventType || 'visit'
  }
  doc.event_date = doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString()
  doc.event_time = doc.createdAt ? doc.createdAt.toISOString().split('T')[1].slice(0, 5) : '12:00'
  doc.patient_id = doc.patientId
  return doc
}

async function listTimelineEvents(req, res) {
  const { patientId, actorId } = req.query
  const filter = {}
  if (patientId) {
    const patient =
      (await PatientProfile.findById(patientId).catch(() => null)) ||
      (await PatientProfile.findOne({ patientId: patientId })) ||
      (await PatientProfile.findOne({ userId: patientId }))
    filter.patientId = patient ? patient._id : patientId
  }
  if (actorId) filter.actorId = actorId

  const events = await HealthEvent.find(filter).sort({ createdAt: -1 })
  const formatted = events.map(formatEvent)

  res.status(200).json({ success: true, data: formatted })
}

async function listMyTimelineEvents(req, res) {
  let patient = await PatientProfile.findOne({ userId: req.user._id })
  if (!patient && req.query.patientId) {
    patient =
      (await PatientProfile.findById(req.query.patientId).catch(() => null)) ||
      (await PatientProfile.findOne({ patientId: req.query.patientId })) ||
      (await PatientProfile.findOne({ userId: req.query.patientId }))
  }
  if (!patient) {
    return res.status(200).json({ success: true, data: [] })
  }

  const events = await HealthEvent.find({ patientId: patient._id }).sort({ createdAt: -1 })
  const formatted = events.map(formatEvent)

  res.status(200).json({ success: true, data: formatted })
}

async function createTimelineEvent(req, res) {
  const payload = {
    patientId: req.body.patient_id || req.body.patientId,
    actorId: req.user._id,
    actorRole: req.user.role,
    eventType: req.body.event_type || req.body.eventType || 'MANUAL_ENTRY',
    entityType: req.body.entityType || 'timeline',
    entityId: req.body.entityId || String(req.user._id),
    title: req.body.title,
    description: req.body.description || null,
    metadata: req.body.metadata || {},
    severity: req.body.severity || 'info',
    sourceModule: req.body.sourceModule || 'timeline',
  }

  const event = await HealthEvent.create(payload)
  const doc = formatEvent(event)

  res.status(201).json({ success: true, data: doc })
}

module.exports = { listTimelineEvents, listMyTimelineEvents, createTimelineEvent }
