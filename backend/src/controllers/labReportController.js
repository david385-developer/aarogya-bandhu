const LabReport = require('../models/LabReport')
const HealthEvent = require('../models/HealthEvent')
const Notification = require('../models/Notification')
const PatientProfile = require('../models/PatientProfile')
const { AppError } = require('../utils/appError')

async function listLabReports(req, res) {
  const { patientId, status } = req.query
  const filter = {}
  if (patientId) filter.patientId = patientId
  if (status) filter.status = status

  const reports = await LabReport.find(filter)
    .populate('patientId')
    .populate('doctorId')
    .sort({ createdAt: -1 })

  const formatted = reports.map((r) => {
    const doc = r.toObject()
    doc.patients = doc.patientId
    doc.doctors = doc.doctorId
    return doc
  })

  res.status(200).json({ success: true, data: formatted })
}

async function createLabReport(req, res) {
  const report = await LabReport.create(req.body)
  const populated = await LabReport.findById(report._id).populate('patientId').populate('doctorId')

  const patient = await PatientProfile.findById(report.patientId)
  if (patient) {
    const event = await HealthEvent.create({
      patientId: patient._id,
      actorId: req.user._id,
      actorRole: req.user.role,
      eventType: 'LAB_REPORT_UPLOADED',
      entityType: 'labReport',
      entityId: String(report._id),
      title: `Lab Report Uploaded: ${report.testName}`,
      description: `Report status: ${report.status}. URL: ${report.reportUrl || 'N/A'}`,
      severity: 'info',
      sourceModule: 'laboratory',
    })

    await Notification.create({
      userId: patient.userId,
      patientId: patient._id,
      healthEventId: event._id,
      type: 'lab_report',
      title: 'New Lab Report Available',
      message: `Your lab report for ${report.testName} is now available.`,
    })
  }

  const doc = populated.toObject()
  doc.patients = doc.patientId
  doc.doctors = doc.doctorId

  res.status(201).json({ success: true, data: doc })
}

async function updateLabReport(req, res) {
  const { id } = req.params
  const report = await LabReport.findByIdAndUpdate(id, req.body, { new: true })
    .populate('patientId')
    .populate('doctorId')
  if (!report) throw new AppError('Lab report not found', 404)

  const patient = await PatientProfile.findById(report.patientId)
  if (patient && req.body.status) {
    const event = await HealthEvent.create({
      patientId: patient._id,
      actorId: req.user._id,
      actorRole: req.user.role,
      eventType: req.body.status === 'verified' ? 'LAB_REPORT_VERIFIED' : 'LAB_REPORT_UPDATED',
      entityType: 'labReport',
      entityId: String(report._id),
      title: `Lab Report ${req.body.status.toUpperCase()}: ${report.testName}`,
      description: `Report status changed to ${req.body.status}`,
      severity: 'info',
      sourceModule: 'laboratory',
    })

    await Notification.create({
      userId: patient.userId,
      patientId: patient._id,
      healthEventId: event._id,
      type: 'lab_report',
      title: `Lab Report ${req.body.status === 'verified' ? 'Verified' : 'Updated'}`,
      message: `Your lab report for ${report.testName} status is now ${report.status}.`,
    })
  }

  const doc = report.toObject()
  doc.patients = doc.patientId
  doc.doctors = doc.doctorId

  res.status(200).json({ success: true, data: doc })
}

module.exports = { listLabReports, createLabReport, updateLabReport }
