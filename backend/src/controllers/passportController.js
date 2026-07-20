const Passport = require('../models/Passport')
const PatientProfile = require('../models/PatientProfile')
const Appointment = require('../models/Appointment')
const Prescription = require('../models/Prescription')
const LabReport = require('../models/LabReport')
const HealthEvent = require('../models/HealthEvent')
const { AppError } = require('../utils/appError')
const { ensurePassport } = require('../services/passportService')

async function scanPassport(req, res) {
  const { passportToken } = req.body
  if (!passportToken) throw new AppError('Passport token is required', 400)

  const passport = await Passport.findOne({ passportToken, status: 'active' })
  if (!passport) throw new AppError('Invalid or expired QR Passport', 404)

  const patient = await PatientProfile.findById(passport.patientId)
  if (!patient) throw new AppError('Patient profile not found', 404)

  const [appointments, prescriptions, labReports, timelineEvents] = await Promise.all([
    Appointment.find({ patientId: patient._id }).populate('doctorId').sort({ appointmentDate: -1 }),
    Prescription.find({ patientId: patient._id }).populate('doctorId').sort({ createdAt: -1 }),
    LabReport.find({ patientId: patient._id }).populate('doctorId').sort({ createdAt: -1 }),
    HealthEvent.find({ patientId: patient._id }).sort({ createdAt: -1 }).limit(50),
  ])

  res.status(200).json({
    success: true,
    patient,
    longitudinalRecord: {
      appointments,
      prescriptions,
      labReports,
      timelineEvents,
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
