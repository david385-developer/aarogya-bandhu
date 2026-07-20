import { useState } from 'react'
import { User, FileText, Activity, Pill, FlaskConical, ShieldCheck, Download, Eye, Phone, Droplet, Calendar, Clock, Plus, Stethoscope, CheckCircle, Trash2 } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { EmptyState } from './ui/EmptyState'
import { api, emitSyncRefresh, emitNotificationRefresh } from '../lib/api'
import { useToast } from './ui/Toast'
import { useAuth } from '../lib/auth'
import { ReportViewerModal } from './ReportViewerModal'

interface PatientWorkspaceModalProps {
  open: boolean
  onClose: () => void
  data: any
  onConsultationSaved?: (newConsultation: any) => void
}

interface MedicationFormItem {
  medicineName: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export function PatientWorkspaceModal({ open, onClose, data, onConsultationSaved }: PatientWorkspaceModalProps) {
  const { profile } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'info' | 'consultations' | 'newConsultation' | 'files' | 'timeline' | 'prescriptions' | 'labReports' | 'passport'>('info')
  const [previewFile, setPreviewFile] = useState<any | null>(null)
  const [savingLoading, setSavingLoading] = useState(false)

  // Consultation Form State
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [notes, setNotes] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [medications, setMedications] = useState<MedicationFormItem[]>([
    { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ])

  if (!open || !data) return null

  const { patient, passport, medicalFiles = [], timeline = [], prescriptions = [], labReports = [], consultations = [], appointments = [] } = data
  const age = patient?.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : (patient?.age || '—')
  const allConsultations = consultations && consultations.length > 0 ? consultations : appointments

  const handleAddMedicationRow = () => {
    setMedications([...medications, { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }])
  }

  const handleRemoveMedicationRow = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  const handleMedicationChange = (index: number, field: keyof MedicationFormItem, value: string) => {
    const updated = [...medications]
    updated[index][field] = value
    setMedications(updated)
  }

  const handleSaveConsultation = async () => {
    if (!diagnosis.trim()) {
      showToast('Diagnosis is required to save consultation', 'warning')
      return
    }

    setSavingLoading(true)
    try {
      const validMeds = medications.filter(m => m.medicineName.trim())
      const payload = {
        patientId: patient?._id || patient?.id || patient?.patientId,
        doctorId: profile?._id || profile?.id,
        doctorName: profile?.full_name || profile?.fullName || 'Dr. Doctor',
        chiefComplaint: chiefComplaint.trim(),
        diagnosis: diagnosis.trim(),
        symptoms: symptoms.trim(),
        notes: notes.trim(),
        medications: validMeds,
        followUpDate: followUpDate || null,
      }

      const res = await api.post('/consultations', payload)
      setSavingLoading(false)

      if (res.error) {
        showToast(res.error, 'error')
      } else {
        showToast('Consultation and prescription saved successfully!', 'success')
        
        // STRICT REQUIREMENT: After saving, refresh only the modal content. Do NOT close the modal.
        const newCons = res.data || res.consultation
        if (newCons) {
          data.consultations = [newCons, ...allConsultations]
        }
        if (res.prescription) {
          data.prescriptions = [res.prescription, ...prescriptions]
        }
        if (res.events && Array.isArray(res.events)) {
          data.timeline = [...res.events, ...timeline]
        } else if (res.events) {
          data.timeline = [res.events, ...timeline]
        }

        // Reset form
        setChiefComplaint('')
        setDiagnosis('')
        setSymptoms('')
        setNotes('')
        setFollowUpDate('')
        setMedications([{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }])

        // Switch to consultations history inside modal without closing
        setActiveTab('consultations')

        // Notify parent to sync dashboard/state without reloading
        if (onConsultationSaved) {
          onConsultationSaved(newCons)
        }
        emitNotificationRefresh()
        emitSyncRefresh()
      }
    } catch (err: any) {
      setSavingLoading(false)
      showToast(err?.message || 'Failed to save consultation', 'error')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Patient Workspace"
      subtitle={`Longitudinal Health Record & Clinical Dashboard for ${patient?.fullName || 'Patient'}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-1 p-1 bg-neutral-100 rounded-2xl border border-neutral-200 items-center justify-between">
          <div className="flex overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'info' ? 'bg-white text-primary-700 shadow-soft' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Patient Info
            </button>
            <button
              onClick={() => setActiveTab('consultations')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'consultations' ? 'bg-white text-primary-700 shadow-soft' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" /> Consultations ({allConsultations.length})
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'prescriptions' ? 'bg-white text-primary-700 shadow-soft' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Pill className="w-3.5 h-3.5" /> Prescriptions ({prescriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'timeline' ? 'bg-white text-primary-700 shadow-soft' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Timeline ({timeline.length})
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'files' ? 'bg-white text-primary-700 shadow-soft' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Medical Records ({medicalFiles.length})
            </button>
            <button
              onClick={() => setActiveTab('labReports')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'labReports' ? 'bg-white text-primary-700 shadow-soft' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" /> Lab Reports ({labReports.length})
            </button>
            <button
              onClick={() => setActiveTab('passport')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'passport' ? 'bg-white text-primary-700 shadow-soft' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Passport Summary
            </button>
          </div>

          <button
            onClick={() => setActiveTab('newConsultation')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ml-1 ${
              activeTab === 'newConsultation' ? 'bg-primary-600 text-white shadow-soft' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> New Consultation
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[380px] max-h-[60vh] overflow-y-auto pr-1">
          {activeTab === 'info' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl border border-primary-100">
                <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white font-bold text-xl flex items-center justify-center flex-shrink-0 shadow-soft">
                  {patient?.photoUrl ? (
                    <img src={patient.photoUrl} alt="Patient Photo" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    patient?.fullName?.slice(0, 2).toUpperCase() || 'PA'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-neutral-900">{patient?.fullName}</h3>
                    <Badge variant="success">Active Patient</Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">Patient ID: <span className="font-mono font-semibold">{patient?.patientId}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-3.5">
                  <p className="text-xs text-neutral-400">Age</p>
                  <p className="text-base font-bold text-neutral-800">{age} years</p>
                </Card>
                <Card className="p-3.5">
                  <p className="text-xs text-neutral-400">Gender</p>
                  <p className="text-base font-bold text-neutral-800 capitalize">{patient?.gender || '—'}</p>
                </Card>
                <Card className="p-3.5">
                  <p className="text-xs text-neutral-400 flex items-center gap-1"><Droplet className="w-3.5 h-3.5 text-error-500" /> Blood Group</p>
                  <p className="text-base font-bold text-neutral-800">{patient?.bloodGroup || '—'}</p>
                </Card>
                <Card className="p-3.5">
                  <p className="text-xs text-neutral-400">Phone</p>
                  <p className="text-base font-bold text-neutral-800">{patient?.phone || '—'}</p>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="p-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-primary-600" /> Emergency Contact
                  </p>
                  {patient?.emergencyContactName || patient?.emergencyContactPhone ? (
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{patient?.emergencyContactName || 'Emergency Contact'}</p>
                      <p className="text-xs text-neutral-500">{patient?.emergencyContactPhone}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 italic">No emergency contact provided</p>
                  )}
                </Card>
                <Card className="p-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Known Allergies</p>
                  {patient?.allergies && patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {patient.allergies.map((a: string, i: number) => (
                        <Badge key={i} variant="error">{a}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 italic">No known allergies</p>
                  )}
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'newConsultation' && (
            <div className="space-y-4 animate-fade-in p-1">
              <div className="p-4 bg-primary-50/50 rounded-2xl border border-primary-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-primary-900">New Clinical Consultation</h4>
                  <p className="text-xs text-primary-700">Record chief complaint, diagnosis, and prescribe medicines for {patient?.fullName}</p>
                </div>
                <Badge variant="primary" leftIcon={<Stethoscope className="w-3 h-3" />}>Active Session</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">Chief Complaint</label>
                  <input
                    type="text"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="e.g. Severe headache and fever for 3 days"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">Diagnosis <span className="text-error-500">*</span></label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Viral Upper Respiratory Infection"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">Symptoms</label>
                  <textarea
                    rows={2}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g. Chills, sore throat, mild body aches"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">Clinical Notes & Remarks</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Patient advised complete rest and hydration. Monitor temperature."
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </div>

              {/* Medicines Section */}
              <div className="space-y-2.5 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-primary-600" /> Prescribe Medicines
                  </label>
                  <Button size="sm" variant="outline" onClick={handleAddMedicationRow} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                    Add Medicine
                  </Button>
                </div>

                <div className="space-y-2">
                  {medications.map((med, index) => (
                    <div key={index} className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2 relative">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            value={med.medicineName}
                            onChange={(e) => handleMedicationChange(index, 'medicineName', e.target.value)}
                            placeholder="Medicine Name (e.g. Paracetamol 500mg)"
                            className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                            placeholder="Dosage (e.g. 1 Tablet)"
                            className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                            placeholder="Frequency (e.g. 1-0-1)"
                            className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          {medications.length > 1 && (
                            <button onClick={() => handleRemoveMedicationRow(index)} className="p-1.5 text-neutral-400 hover:text-error-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            value={med.duration}
                            onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                            placeholder="Duration (e.g. 5 days)"
                            className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={med.instructions}
                            onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                            placeholder="Instructions (e.g. After food)"
                            className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow up Date */}
              <div className="pt-2 border-t border-neutral-200 flex items-center justify-between gap-4">
                <div className="flex-1 max-w-xs">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">Follow-up Date (Optional)</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  />
                </div>
                <div className="pt-5">
                  <Button
                    variant="primary"
                    onClick={handleSaveConsultation}
                    loading={savingLoading}
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                    className="px-6 shadow-soft"
                  >
                    Save Consultation & Prescription
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'consultations' && (
            <div className="space-y-3 animate-fade-in">
              {allConsultations.length === 0 ? (
                <EmptyState icon={<Stethoscope className="w-8 h-8" />} title="No consultation history" description="No previous consultations recorded for this patient" />
              ) : (
                allConsultations.map((cons: any, idx: number) => {
                  const docName = cons.doctorName || cons.doctor_name || cons.doctors?.fullName || cons.doctorId?.fullName || 'Doctor'
                  const diag = cons.diagnosis || cons.reason || 'General Consultation'
                  const dateStr = new Date(cons.createdAt || cons.appointmentDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  const meds = cons.medications || cons.prescription?.medications || []

                  return (
                    <Card key={cons.id || cons._id || idx} className="space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-neutral-900">{diag}</h4>
                            {cons.followUpDate && (
                              <Badge variant="warning" leftIcon={<Calendar className="w-3 h-3" />}>Follow-up: {cons.followUpDate}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">By {docName} · {dateStr}</p>
                        </div>
                        <Badge variant="success">Completed</Badge>
                      </div>

                      {(cons.chiefComplaint || cons.symptoms) && (
                        <div className="text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-100 text-neutral-700 space-y-0.5">
                          {cons.chiefComplaint && <p><span className="font-semibold">Chief Complaint:</span> {cons.chiefComplaint}</p>}
                          {cons.symptoms && <p><span className="font-semibold">Symptoms:</span> {cons.symptoms}</p>}
                        </div>
                      )}

                      {cons.notes && <p className="text-xs text-neutral-600"><span className="font-semibold">Clinical Notes:</span> {cons.notes}</p>}

                      {meds.length > 0 && (
                        <div className="pt-1.5 border-t border-neutral-100">
                          <p className="text-xs font-semibold text-neutral-500 mb-1">Prescribed Medicines:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {meds.map((m: any, i: number) => (
                              <Badge key={i} variant="primary">
                                {m.name || m.medicineName} ({m.dosage} · {m.frequency}{m.duration ? ` · ${m.duration}` : ''})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-3 animate-fade-in">
              {medicalFiles.length === 0 ? (
                <EmptyState icon={<FileText className="w-8 h-8" />} title="No medical files uploaded" description="No documents have been uploaded to Cloudinary for this patient yet" />
              ) : (
                medicalFiles.map((file: any) => (
                  <Card key={file.id || file._id} hover className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 border border-primary-100">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-neutral-800 truncate">{file.file_name || file.fileName || file.original_name || file.originalName}</h4>
                          <Badge variant="primary">{file.category || 'General'}</Badge>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Uploaded on {new Date(file.uploaded_at || file.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} by {file.uploaded_by || file.uploadedBy || 'Patient'} · {file.mime_type || file.mimeType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={() => setPreviewFile(file)}>
                        View
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => window.open(file.cloudinary_url || file.cloudinaryUrl, '_blank')} title="Download File">
                        <Download className="w-4 h-4 text-neutral-600" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-3 animate-fade-in">
              {timeline.length === 0 ? (
                <EmptyState icon={<Activity className="w-8 h-8" />} title="No timeline events" description="No health events recorded yet" />
              ) : (
                timeline.map((event: any) => {
                  const isUpload = event.event_type === 'upload' || event.eventType === 'MEDICAL_RECORD_UPLOADED' || event.title === 'Medical Record Uploaded'
                  const isCons = event.eventType === 'CONSULTATION_CREATED' || event.event_type === 'consultation'
                  const isRx = event.eventType === 'PRESCRIPTION_CREATED' || event.eventType === 'PRESCRIPTION_ISSUED' || event.event_type === 'prescription'
                  const fileName = event.metadata?.fileName || event.metadata?.originalName || event.description
                  const uploadedBy = event.metadata?.uploadedBy || event.doctor_name || event.actorRole || 'Patient'

                  return (
                    <Card key={event.id || event._id} hover={!!event.metadata?.cloudinaryUrl} onClick={() => event.metadata?.cloudinaryUrl && setPreviewFile({ file_name: fileName, cloudinary_url: event.metadata.cloudinaryUrl, mime_type: event.metadata.mimeType || 'Document' })} className={event.metadata?.cloudinaryUrl ? 'cursor-pointer' : ''}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-neutral-800">{event.title}</h4>
                          {event.metadata?.category && <Badge variant="primary">{event.metadata.category}</Badge>}
                          {isCons && <Badge variant="success">Consultation</Badge>}
                          {isRx && <Badge variant="accent">Prescription</Badge>}
                        </div>
                        {event.metadata?.cloudinaryUrl && (
                          <Badge variant="neutral" leftIcon={<Eye className="w-3 h-3" />}>Preview Document</Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 mb-2">{isUpload ? `Uploaded Document: ${fileName}` : event.description}</p>
                      <div className="flex items-center gap-3 text-xs text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.event_date || event.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {uploadedBy && <span>By: {uploadedBy}</span>}
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-3 animate-fade-in">
              {prescriptions.length === 0 ? (
                <EmptyState icon={<Pill className="w-8 h-8" />} title="No prescriptions found" description="No prescriptions have been issued yet" />
              ) : (
                prescriptions.map((p: any) => (
                  <Card key={p.id || p._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-neutral-800">{p.diagnosis || 'Prescription'}</h4>
                      <span className="text-xs text-neutral-400">{new Date(p.created_at || p.createdAt || Date.now()).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(p.medications || []).map((m: any, i: number) => (
                        <Badge key={i} variant="neutral">{m.name || m.medicineName} ({m.dosage}{m.frequency ? ` · ${m.frequency}` : ''}{m.instructions ? ` · ${m.instructions}` : ''})</Badge>
                      ))}
                    </div>
                    {p.notes && <p className="text-xs text-neutral-500 mt-1">{p.notes}</p>}
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'labReports' && (
            <div className="space-y-3 animate-fade-in">
              {labReports.length === 0 ? (
                <EmptyState icon={<FlaskConical className="w-8 h-8" />} title="No lab reports found" description="No lab reports have been recorded yet" />
              ) : (
                labReports.map((r: any) => (
                  <Card key={r.id || r._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-neutral-800">{r.test_name || r.testName}</h4>
                      <Badge variant={r.status === 'completed' ? 'success' : 'warning'}>{r.status}</Badge>
                    </div>
                    {r.notes && <p className="text-xs text-neutral-500">{r.notes}</p>}
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'passport' && (
            <div className="space-y-4 animate-fade-in">
              <Card className="p-4 bg-neutral-50 border border-neutral-200">
                <div className="flex items-center gap-3 mb-3">
                  <ShieldCheck className="w-6 h-6 text-success-600" />
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">QR Passport Status: Active & Validated</h4>
                    <p className="text-xs text-neutral-500">Token cryptographically verified by QR scan</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200 text-xs">
                  <div>
                    <span className="text-neutral-400">Passport Token</span>
                    <p className="font-mono font-semibold text-neutral-800 truncate">{passport?.passportToken || '—'}</p>
                  </div>
                  <div>
                    <span className="text-neutral-400">Version</span>
                    <p className="font-semibold text-neutral-800">v{passport?.version || 1}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Modal Footer / Close Button */}
        {/* CLOSING THE MODAL RETURNS DOCTOR BACK TO DASHBOARD. NO PAGE REFRESH. NO NAVIGATION. */}
        <div className="pt-3 border-t border-neutral-200 flex justify-end">
          <Button variant="primary" onClick={onClose} className="px-8 shadow-soft">
            Close & Return to Dashboard
          </Button>
        </div>
      </div>

      {/* Document Preview Modal inside Workspace */}
      <ReportViewerModal
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </Modal>
  )
}
