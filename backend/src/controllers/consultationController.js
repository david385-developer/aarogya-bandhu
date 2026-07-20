const Consultation = require('../models/Consultation')
const Prescription = require('../models/Prescription')
const HealthEvent = require('../models/HealthEvent')
const Notification = require('../models/Notification')
const PatientProfile = require('../models/PatientProfile')
const DoctorProfile = require('../models/DoctorProfile')
const { AppError } = require('../utils/appError')

async function createConsultation(req, res) {
  const {
    patientId,
    doctorId,
    doctorName: rawDoctorName,
    chiefComplaint,
    diagnosis,
    symptoms,
    notes,
    clinicalNotes,
    medications = [],
    medicines = [],
    followUpDate,
  } = req.body

  if (!patientId) {
    throw new AppError('patientId is required', 400)
  }
  if (!diagnosis) {
    throw new AppError('diagnosis is required', 400)
  }

  // Find patient
  const patient =
    (await PatientProfile.findById(patientId).catch(() => null)) ||
    (await PatientProfile.findOne({ patientId: patientId })) ||
    (await PatientProfile.findOne({ userId: patientId })) ||
    (await PatientProfile.findOne({ email: patientId.toLowerCase() }))

  if (!patient) {
    throw new AppError('Patient not found', 404)
  }

  // Find or determine doctor
  let doctorProfile = null
  if (req.user && req.user._id) {
    doctorProfile = await DoctorProfile.findOne({ userId: req.user._id })
  }
  if (!doctorProfile && doctorId) {
    doctorProfile = await DoctorProfile.findById(doctorId).catch(() => null)
  }

  const doctorName =
    rawDoctorName ||
    (doctorProfile ? doctorProfile.fullName : null) ||
    (req.user ? req.user.fullName : null) ||
    'Dr. Doctor'

  const docId = doctorProfile ? doctorProfile._id : (doctorId || req.user?._id)

  const consultation = await Consultation.create({
    patientId: patient._id,
    doctorId: docId,
    doctorName,
    chiefComplaint: chiefComplaint || null,
    diagnosis,
    symptoms: symptoms || null,
    notes: notes || clinicalNotes || null,
    followUpDate: followUpDate || null,
  })

  // Check if medications or medicines array is passed
  const medsList = medications.length > 0 ? medications : medicines
  let prescription = null

  if (medsList && medsList.length > 0) {
    const formattedMeds = medsList.map((m) => ({
      name: m.name || m.medicineName || m.medicine || 'Medicine',
      medicineName: m.medicineName || m.name || m.medicine || 'Medicine',
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      duration: m.duration || '',
      instructions: m.instructions || '',
    }))

    prescription = await Prescription.create({
      consultationId: consultation._id,
      patientId: patient._id,
      doctorId: docId,
      medications: formattedMeds,
      diagnosis: consultation.diagnosis,
      notes: consultation.notes,
      followUpDate: consultation.followUpDate,
    })

    consultation.prescriptionId = prescription._id
    await consultation.save()
  }

  // Generate CONSULTATION_CREATED HealthEvent
  const event1 = await HealthEvent.create({
    patientId: patient._id,
    actorId: req.user ? req.user._id : docId,
    actorRole: req.user ? req.user.role : 'doctor',
    eventType: 'CONSULTATION_CREATED',
    entityType: 'consultation',
    entityId: String(consultation._id),
    title: `Consultation with ${doctorName}`,
    description: consultation.diagnosis + (consultation.notes ? ` · ${consultation.notes}` : ''),
    metadata: {
      consultationId: consultation.consultationId,
      _id: consultation._id,
      doctorName,
      diagnosis: consultation.diagnosis,
      chiefComplaint: consultation.chiefComplaint,
      symptoms: consultation.symptoms,
      notes: consultation.notes,
      followUpDate: consultation.followUpDate,
      prescriptionSummary: prescription ? prescription.medications.map((m) => `${m.name} (${m.dosage})`).join(', ') : null,
      medications: prescription ? prescription.medications : [],
    },
    severity: 'info',
    sourceModule: 'clinical',
  })

  // Generate PRESCRIPTION_CREATED HealthEvent if prescription exists
  let event2 = null
  if (prescription) {
    event2 = await HealthEvent.create({
      patientId: patient._id,
      actorId: req.user ? req.user._id : docId,
      actorRole: req.user ? req.user.role : 'doctor',
      eventType: 'PRESCRIPTION_CREATED',
      entityType: 'prescription',
      entityId: String(prescription._id),
      title: `Prescription Added by ${doctorName}`,
      description: prescription.medications.map((m) => `${m.name} (${m.dosage})`).join(', '),
      metadata: {
        prescriptionId: prescription.prescriptionId || String(prescription._id),
        consultationId: consultation.consultationId,
        doctorName,
        diagnosis: consultation.diagnosis,
        medications: prescription.medications,
        followUpDate: consultation.followUpDate,
      },
      severity: 'info',
      sourceModule: 'clinical',
    })
  }

  // Notifications
  if (patient.userId) {
    await Notification.create({
      userId: patient.userId,
      patientId: patient._id,
      healthEventId: event1._id,
      type: 'CONSULTATION_CREATED',
      title: 'New Consultation Added',
      message: `Dr. ${doctorName.replace(/^Dr\.\s*/i, '')} has added a new consultation.`,
    })
  }

  if (req.user && req.user._id) {
    await Notification.create({
      userId: req.user._id,
      patientId: patient._id,
      healthEventId: event1._id,
      type: 'CONSULTATION_CREATED',
      title: 'Consultation Saved',
      message: 'Consultation saved successfully.',
    })
  }

  const resultObj = consultation.toObject()
  if (prescription) {
    resultObj.prescription = prescription
    resultObj.medications = prescription.medications
  }

  res.status(201).json({
    success: true,
    data: resultObj,
    consultation: resultObj,
    prescription,
    events: [event1, event2].filter(Boolean),
  })
}

async function listConsultations(req, res) {
  const patientId = req.params.patientId || req.query.patientId
  const doctorId = req.query.doctorId
  const filter = {}

  if (patientId) {
    const patient =
      (await PatientProfile.findById(patientId).catch(() => null)) ||
      (await PatientProfile.findOne({ patientId: patientId })) ||
      (await PatientProfile.findOne({ userId: patientId }))
    if (patient) {
      filter.patientId = patient._id
    } else {
      filter.patientId = patientId
    }
  } else if (req.user && req.user.role === 'patient') {
    const patient = await PatientProfile.findOne({ userId: req.user._id })
    if (patient) filter.patientId = patient._id
  }

  if (doctorId) filter.doctorId = doctorId

  const consultations = await Consultation.find(filter)
    .populate('prescriptionId')
    .populate('doctorId')
    .sort({ createdAt: -1 })

  const formatted = consultations.map((c) => {
    const doc = c.toObject()
    if (doc.prescriptionId) {
      doc.prescription = doc.prescriptionId
      doc.medications = doc.prescriptionId.medications || []
      doc.prescriptionSummary = (doc.prescriptionId.medications || [])
        .map((m) => `${m.name || m.medicineName} (${m.dosage})`)
        .join(', ')
    }
    return doc
  })

  res.status(200).json({ success: true, data: formatted })
}

async function getConsultationById(req, res) {
  const { id } = req.params
  const consultation = await Consultation.findById(id).populate('prescriptionId').populate('doctorId')
  if (!consultation) {
    throw new AppError('Consultation not found', 404)
  }
  res.status(200).json({ success: true, data: consultation })
}

module.exports = {
  createConsultation,
  listConsultations,
  getConsultationById,
}
