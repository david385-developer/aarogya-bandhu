const DoctorProfile = require('../models/DoctorProfile')
const QueueToken = require('../models/QueueToken')
const Appointment = require('../models/Appointment')
const Consultation = require('../models/Consultation')
const Notification = require('../models/Notification')
const { AppError } = require('../utils/appError')

async function listDoctors(req, res) {
  const doctors = await DoctorProfile.find().sort({ fullName: 1 })
  res.status(200).json({ success: true, data: doctors })
}

async function getDoctorByEmail(req, res) {
  const { email } = req.params
  const doctor = await DoctorProfile.findOne({ email: email.toLowerCase() })
  res.status(200).json({ success: true, data: doctor })
}

async function getDoctorDashboard(req, res) {
  let doctor = await DoctorProfile.findOne({ userId: req.user._id })
  if (!doctor && req.user.email) {
    doctor = await DoctorProfile.findOne({ email: req.user.email.toLowerCase() })
    if (doctor && !doctor.userId) {
      doctor.userId = req.user._id
      await doctor.save()
    }
  }
  if (!doctor) {
    throw new AppError('Doctor profile not found for this user', 404)
  }

  const today = new Date().toISOString().split('T')[0]

  const [queueTokens, todaysAppointments, recentConsultations, notificationCount] = await Promise.all([
    QueueToken.find({ doctorId: doctor._id, status: { $in: ['waiting', 'in_progress'] } })
      .populate('patientId')
      .populate('doctorId')
      .sort({ tokenNumber: 1 }),
    Appointment.find({ doctorId: doctor._id, appointmentDate: today })
      .populate('patientId')
      .populate('doctorId'),
    Consultation.find({ doctorId: doctor._id })
      .populate('patientId')
      .sort({ createdAt: -1 })
      .limit(10),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ])

  const formattedQueue = queueTokens.map((t) => {
    const doc = t.toObject()
    doc.patients = doc.patientId
    doc.doctors = doc.doctorId
    doc.patient_id = doc.patientId ? doc.patientId._id : null
    doc.doctor_id = doc.doctorId ? doc.doctorId._id : null
    doc.token_number = doc.tokenNumber
    return doc
  })

  const formattedAppointments = todaysAppointments.map((a) => {
    const doc = a.toObject()
    doc.patients = doc.patientId
    doc.doctors = doc.doctorId
    doc.patient_id = doc.patientId ? doc.patientId._id : null
    doc.doctor_id = doc.doctorId ? doc.doctorId._id : null
    return doc
  })

  const assignedPatientsMap = new Map()
  formattedQueue.forEach((item) => {
    if (item.patient_id) {
      assignedPatientsMap.set(String(item.patient_id), {
        ...item,
        isQueueToken: true,
      })
    }
  })
  formattedAppointments.forEach((item) => {
    if (item.patient_id && !assignedPatientsMap.has(String(item.patient_id))) {
      assignedPatientsMap.set(String(item.patient_id), {
        ...item,
        isAppointment: true,
      })
    }
  })
  const assignedPatients = Array.from(assignedPatientsMap.values())

  const formattedConsultations = recentConsultations.map((c) => {
    const doc = c.toObject()
    doc.patients = doc.patientId
    return doc
  })

  const waitingCount = await QueueToken.countDocuments({ doctorId: doctor._id, status: 'waiting' })
  const inProgressCount = await QueueToken.countDocuments({ doctorId: doctor._id, status: 'in_progress' })
  const completedCount = await QueueToken.countDocuments({ doctorId: doctor._id, status: 'completed' })
  const queueStatistics = {
    waiting: waitingCount,
    in_progress: inProgressCount,
    completed: completedCount,
    total: waitingCount + inProgressCount + completedCount,
  }

  res.status(200).json({
    success: true,
    data: {
      doctor,
      assignedPatients,
      currentQueue: formattedQueue,
      todaysAppointments: formattedAppointments,
      recentConsultations: formattedConsultations,
      notificationCount,
      queueStatistics,
    },
  })
}

async function getDoctorById(req, res) {
  const { id } = req.params
  const doctor = await DoctorProfile.findById(id)
  if (!doctor) throw new AppError('Doctor not found', 404)
  res.status(200).json({ success: true, data: doctor })
}

async function updateDoctor(req, res) {
  const { id } = req.params
  const doctor = await DoctorProfile.findByIdAndUpdate(id, req.body, { new: true })
  if (!doctor) throw new AppError('Doctor not found', 404)
  res.status(200).json({ success: true, data: doctor })
}

module.exports = {
  listDoctors,
  getDoctorByEmail,
  getDoctorDashboard,
  getDoctorById,
  updateDoctor,
}
