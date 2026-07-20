const DoctorProfile = require('../models/DoctorProfile')
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

module.exports = { listDoctors, getDoctorByEmail, getDoctorById, updateDoctor }
