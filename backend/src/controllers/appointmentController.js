const Appointment = require('../models/Appointment')
const HealthEvent = require('../models/HealthEvent')
const Notification = require('../models/Notification')
const PatientProfile = require('../models/PatientProfile')
const DoctorProfile = require('../models/DoctorProfile')
const { AppError } = require('../utils/appError')

async function listAppointments(req, res) {
  const { patientId, doctorId } = req.query
  const filter = {}
  if (patientId) filter.patientId = patientId
  if (doctorId) filter.doctorId = doctorId

  const appointments = await Appointment.find(filter)
    .populate('patientId')
    .populate('doctorId')
    .sort({ appointmentDate: -1, appointmentTime: -1 })

  // Transform populates to `patients` and `doctors` keys for frontend compatibility if needed
  const formatted = appointments.map((app) => {
    const doc = app.toObject()
    doc.patients = doc.patientId
    doc.doctors = doc.doctorId
    return doc
  })

  res.status(200).json({ success: true, data: formatted })
}

async function createAppointment(req, res) {
  const appointment = await Appointment.create(req.body)
  const populated = await Appointment.findById(appointment._id).populate('patientId').populate('doctorId')

  const patient = await PatientProfile.findById(appointment.patientId)
  if (patient) {
    const event = await HealthEvent.create({
      patientId: patient._id,
      actorId: req.user._id,
      actorRole: req.user.role,
      eventType: 'APPOINTMENT_SCHEDULED',
      entityType: 'appointment',
      entityId: String(appointment._id),
      title: 'Appointment Scheduled',
      description: `Appointment scheduled on ${appointment.appointmentDate} at ${appointment.appointmentTime}`,
      severity: 'info',
      sourceModule: 'appointment',
    })

    if (patient.userId) {
      await Notification.create({
        userId: patient.userId,
        patientId: patient._id,
        healthEventId: event._id,
        type: 'appointment',
        title: 'New Appointment Scheduled',
        message: `Your appointment is scheduled for ${appointment.appointmentDate} at ${appointment.appointmentTime}.`,
      })
    }

    if (appointment.doctorId) {
      const doctor = await DoctorProfile.findById(appointment.doctorId).catch(() => null)
      if (doctor && doctor.userId) {
        await Notification.create({
          userId: doctor.userId,
          patientId: patient._id,
          healthEventId: event._id,
          type: 'appointment',
          title: 'New Appointment Scheduled',
          message: `Appointment scheduled with ${patient.fullName || 'Patient'} on ${appointment.appointmentDate} at ${appointment.appointmentTime}.`,
        })
      }
    }
  }

  const doc = populated.toObject()
  doc.patients = doc.patientId
  doc.doctors = doc.doctorId

  res.status(201).json({ success: true, data: doc })
}

async function updateAppointment(req, res) {
  const { id } = req.params
  const appointment = await Appointment.findByIdAndUpdate(id, req.body, { new: true })
    .populate('patientId')
    .populate('doctorId')
  if (!appointment) throw new AppError('Appointment not found', 404)

  const doc = appointment.toObject()
  doc.patients = doc.patientId
  doc.doctors = doc.doctorId

  res.status(200).json({ success: true, data: doc })
}

module.exports = { listAppointments, createAppointment, updateAppointment }
