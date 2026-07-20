const MedicalFile = require('../models/MedicalFile')
const PatientProfile = require('../models/PatientProfile')
const HealthEvent = require('../models/HealthEvent')
const Notification = require('../models/Notification')
const { cloudinary } = require('../config/cloudinary')
const { AppError } = require('../utils/appError')

function uploadStreamToCloudinary(fileBuffer, resourceType = 'auto', folder = 'arogya_bandhu/medical_files') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )
    stream.end(fileBuffer)
  })
}

async function uploadMedicalFile(req, res) {
  if (!req.file) {
    throw new AppError('No file uploaded', 400)
  }

  let patient = await PatientProfile.findOne({ userId: req.user._id })
  if (!patient && req.body.patientId && req.user.role !== 'patient') {
    patient = await PatientProfile.findById(req.body.patientId)
  }
  if (!patient) {
    throw new AppError('Patient profile not found', 404)
  }

  const uploadResult = await uploadStreamToCloudinary(req.file.buffer, 'auto')

  const medicalFile = await MedicalFile.create({
    patientId: patient._id,
    uploadedBy: req.user._id,
    fileName: req.body.fileName || req.file.originalname,
    originalName: req.file.originalname,
    cloudinaryUrl: uploadResult.secure_url,
    resourceType: uploadResult.resource_type || 'auto',
    mimeType: req.file.mimetype,
    fileSize: req.file.size || uploadResult.bytes || 0,
    uploadedAt: new Date(),
    category: req.body.category || 'General',
  })

  const healthEvent = await HealthEvent.create({
    patientId: patient._id,
    actorId: req.user._id,
    actorRole: req.user.role,
    eventType: 'MEDICAL_RECORD_UPLOADED',
    entityType: 'medicalFile',
    entityId: String(medicalFile._id),
    title: 'Medical Record Uploaded',
    description: `${medicalFile.fileName || medicalFile.originalName} uploaded by ${req.user.fullName || 'Patient'}`,
    metadata: {
      fileName: medicalFile.fileName || medicalFile.originalName,
      originalName: medicalFile.originalName,
      cloudinaryUrl: medicalFile.cloudinaryUrl,
      category: medicalFile.category,
      mimeType: medicalFile.mimeType,
      uploadedBy: req.user.fullName || 'Patient',
      uploadDate: medicalFile.uploadedAt.toISOString(),
    },
    severity: 'info',
    sourceModule: 'medical_files',
  })

  await Notification.create({
    userId: req.user._id,
    patientId: patient._id,
    healthEventId: healthEvent._id,
    type: 'MEDICAL_RECORD_UPLOADED',
    title: 'Medical Record Uploaded',
    message: 'Medical record uploaded successfully',
    isRead: false,
  })

  res.status(201).json({
    success: true,
    data: medicalFile,
    event: healthEvent,
  })
}

async function listMyMedicalFiles(req, res) {
  const targetId = req.params.patientId || req.query.patientId
  let patient = null

  if (targetId) {
    patient =
      (await PatientProfile.findById(targetId).catch(() => null)) ||
      (await PatientProfile.findOne({ patientId: targetId })) ||
      (await PatientProfile.findOne({ userId: targetId })) ||
      (await PatientProfile.findOne({ email: targetId.toLowerCase() }))
  }

  if (!patient) {
    patient = await PatientProfile.findOne({ userId: req.user._id })
  }
  if (!patient) {
    return res.status(200).json({ success: true, data: [] })
  }

  const files = await MedicalFile.find({ patientId: patient._id }).sort({ uploadedAt: -1 })
  const formatted = files.map((f) => {
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
    doc.uploaded_by = doc.uploadedBy
    return doc
  })

  res.status(200).json({ success: true, data: formatted })
}

module.exports = {
  uploadMedicalFile,
  listMyMedicalFiles,
}
