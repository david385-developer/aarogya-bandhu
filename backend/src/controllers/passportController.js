const Passport = require('../models/Passport')
const PatientProfile = require('../models/PatientProfile')
const Appointment = require('../models/Appointment')
const Prescription = require('../models/Prescription')
const LabReport = require('../models/LabReport')
const HealthEvent = require('../models/HealthEvent')
const MedicalFile = require('../models/MedicalFile')
const Consultation = require('../models/Consultation')
const { AppError } = require('../utils/appError')
const { ensurePassport } = require('../services/passportService')

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

async function scanPassport(req, res) {
  const { passportToken } = req.body
  if (!passportToken) throw new AppError('Passport token is required', 400)

  let tokenStr = String(passportToken || '').trim()
  if (tokenStr.startsWith('{') && tokenStr.endsWith('}')) {
    try {
      const parsed = JSON.parse(tokenStr)
      if (parsed.passportToken) tokenStr = parsed.passportToken
      else if (parsed.token) tokenStr = parsed.token
      else if (parsed.encryptedPatientIdentifier) tokenStr = parsed.encryptedPatientIdentifier
    } catch {}
  }

  let passport = await Passport.findOne({
    $or: [
      { passportToken: tokenStr },
      { 'qrPayload.token': tokenStr },
      { 'qrPayload.checksum': tokenStr },
    ],
    status: 'active',
  })

  // Fallback for development/testing if token matches patient ID or ObjectID directly
  if (!passport && (tokenStr.startsWith('AB-') || tokenStr.length === 24)) {
    const fallbackPatient = await PatientProfile.findOne({
      $or: [{ patientId: tokenStr.toUpperCase() }, { _id: tokenStr.length === 24 ? tokenStr : null }],
    })
    if (fallbackPatient) {
      passport = await ensurePassport(fallbackPatient)
    }
  }

  if (!passport) throw new AppError('Invalid or expired QR Passport', 404)

  const patient = await PatientProfile.findById(passport.patientId)
  if (!patient) throw new AppError('Patient profile not found', 404)

  const [appointments, prescriptions, labReports, rawTimeline, rawFiles, rawConsultations] = await Promise.all([
    Appointment.find({ patientId: patient._id }).populate('doctorId').sort({ appointmentDate: -1 }),
    Prescription.find({ patientId: patient._id }).populate('doctorId').sort({ createdAt: -1 }),
    LabReport.find({ patientId: patient._id }).populate('doctorId').sort({ createdAt: -1 }),
    HealthEvent.find({ patientId: patient._id }).sort({ createdAt: -1 }).limit(100),
    MedicalFile.find({ patientId: patient._id }).sort({ uploadedAt: -1 }),
    Consultation.find({ patientId: patient._id }).populate('prescriptionId').populate('doctorId').sort({ createdAt: -1 }),
  ])

  const formattedTimeline = rawTimeline.map(formatEvent)
  const formattedFiles = rawFiles.map((f) => {
    const doc = f.toObject()
    doc.id = doc._id
    doc.patient_id = doc.patientId
    doc.file_name = doc.fileName
    doc.original_name = doc.originalName
    doc.cloudinary_url = doc.cloudinaryUrl
    doc.resource_type = doc.resourceType
    doc.mime_type = doc.mimeType
    doc.file_size = doc.fileSize
    doc.uploaded_at = doc.uploadedAt ? doc.uploadedAt.toISOString() : new Date().toISOString()
    return doc
  })

  const formattedConsultations = rawConsultations.map((c) => {
    const doc = c.toObject()
    if (doc.prescriptionId) {
      doc.prescription = doc.prescriptionId
      doc.medications = doc.prescriptionId.medications || []
      doc.prescriptionSummary = (doc.prescriptionId.medications || []).map(m => `${m.name || m.medicineName} (${m.dosage})`).join(', ')
    }
    return doc
  })

  res.status(200).json({
    success: true,
    patient,
    passport,
    medicalFiles: formattedFiles,
    timeline: formattedTimeline,
    prescriptions,
    labReports,
    consultations: formattedConsultations.length > 0 ? formattedConsultations : appointments,
    longitudinalRecord: {
      appointments,
      consultations: formattedConsultations,
      prescriptions,
      labReports,
      timelineEvents: formattedTimeline,
      medicalFiles: formattedFiles,
    },
  })
}

async function getMyQr(req, res) {
  const patient = await PatientProfile.findOne({ userId: req.user._id })
  if (!patient) throw new AppError('Patient profile not found', 404)

  const passport = await ensurePassport(patient)
  res.status(200).json({ success: true, passport })
}

module.exports = { scanPassport, getMyQr }
