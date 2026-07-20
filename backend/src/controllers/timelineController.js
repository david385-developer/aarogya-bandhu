const HealthEvent = require('../models/HealthEvent')
const { AppError } = require('../utils/appError')

async function listTimelineEvents(req, res) {
  const { patientId, actorId } = req.query
  const filter = {}
  if (patientId) filter.patientId = patientId
  if (actorId) filter.actorId = actorId

  const events = await HealthEvent.find(filter).sort({ createdAt: -1 })

  const formatted = events.map((e) => {
    const doc = e.toObject()
    doc.event_type = doc.eventType
    doc.event_date = doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString()
    doc.patient_id = doc.patientId
    return doc
  })

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
  const doc = event.toObject()
  doc.event_type = doc.eventType
  doc.event_date = doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString()
  doc.patient_id = doc.patientId

  res.status(201).json({ success: true, data: doc })
}

module.exports = { listTimelineEvents, createTimelineEvent }
