import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, User, Droplet, Heart, Phone, CircleAlert as AlertCircle, Pill, FlaskConical, Clock, Activity, Sparkles, FileText, Stethoscope, Check, Plus, Calendar, Eye } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { api, Patient, Prescription, LabReport, TimelineEvent } from '../../lib/api'
import { ReportViewerModal } from '../../components/ReportViewerModal'

export function ClinicalWorkspace() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [labReports, setLabReports] = useState<LabReport[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [medicalFiles, setMedicalFiles] = useState<any[]>([])
  const [previewFile, setPreviewFile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'snapshot' | 'timeline' | 'history' | 'ai' | 'consult'>('snapshot')
  const [showConsultForm, setShowConsultForm] = useState(false)
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '', duration: '' }])
  const [followUpDate, setFollowUpDate] = useState('')

  useEffect(() => {
    (async () => {
      if (!patientId) { setLoading(false); return }

      const { data: pat } = await api.get(`/patients/${patientId}`)
      if (!pat) { setLoading(false); return }
      setPatient(pat as Patient)

      const [prescRes, labRes, tlRes, filesRes] = await Promise.all([
        api.get(`/prescriptions?patientId=${patientId}`),
        api.get(`/lab-reports?patientId=${patientId}`),
        api.get(`/timeline?patientId=${patientId}`),
        api.get(`/patients/${patientId}/medical-files`),
      ])

      setPrescriptions(prescRes.data as Prescription[] || [])
      setLabReports(labRes.data as LabReport[] || [])
      setTimeline(tlRes.data as TimelineEvent[] || [])
      setMedicalFiles((filesRes.data as any[]) || [])
      setLoading(false)
    })()
  }, [patientId])

  const age = patient?.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : null

  const addMedication = () => setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }])

  const submitConsultation = async () => {
    if (!patient || !diagnosis) {
      toast('Please enter a diagnosis', 'error')
      return
    }

    const { data: { user } } = await api.get('/auth/me')
    const { data: doc } = await api.get(`/doctors/by-email/${encodeURIComponent(user?.email || '')}`)

    const validMeds = medications.filter(m => m.name.trim())
    const { error } = await api.post('/prescriptions', {
      patient_id: patient.id,
      doctor_id: doc?.id || null,
      medications: validMeds,
      diagnosis,
      notes,
      follow_up_date: followUpDate || null,
    })

    if (error) {
      toast('Failed to save consultation', 'error')
    } else {
      await api.post('/timeline', {
        patient_id: patient.id,
        event_type: 'consultation',
        title: 'Consultation Completed',
        description: diagnosis,
        doctor_name: user?.full_name || 'Doctor',
        status: 'completed',
      })

      toast('Consultation completed successfully', 'success')
      setShowConsultForm(false)
      setDiagnosis('')
      setNotes('')
      setMedications([{ name: '', dosage: '', frequency: '', duration: '' }])
      setFollowUpDate('')

      const [prescRes, tlRes] = await Promise.all([
        api.get(`/prescriptions?patientId=${patient.id}`),
        api.get(`/timeline?patientId=${patient.id}`),
      ])
      setPrescriptions(prescRes.data as Prescription[] || [])
      setTimeline(tlRes.data as TimelineEvent[] || [])
    }
  }

  const sections = [
    { id: 'snapshot' as const, label: 'Snapshot', icon: User },
    { id: 'timeline' as const, label: 'Timeline', icon: Clock },
    { id: 'history' as const, label: 'History', icon: FileText },
    { id: 'ai' as const, label: 'AI Summary', icon: Sparkles },
    { id: 'consult' as const, label: 'Consult', icon: Stethoscope },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 max-w-md mx-auto px-4 pt-4">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <p className="text-sm text-neutral-500">Patient not found</p>
          <Button variant="outline" onClick={() => navigate('/doctor')} className="mt-4">Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-neutral-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/doctor')} className="p-1.5 -ml-1.5 rounded-lg hover:bg-neutral-100">
            <ChevronLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-neutral-900">{patient.full_name}</h1>
            <p className="text-xs text-neutral-400">{patient.patient_id}</p>
          </div>
          <Badge variant="primary" dot>Active</Badge>
        </div>

        {/* Section tabs */}
        <div className="max-w-md mx-auto px-4 pb-2">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {sections.map(s => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeSection === s.id ? 'bg-primary-600 text-white' : 'text-neutral-500 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-5">
        {/* SNAPSHOT */}
        {activeSection === 'snapshot' && (
          <div className="space-y-4 animate-fade-in">
            <Card>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                  {patient.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-neutral-900">{patient.full_name}</h2>
                  <p className="text-xs text-neutral-400">{patient.patient_id}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <Badge variant="neutral">{age}y</Badge>
                    <Badge variant="neutral"><span className="capitalize">{patient.gender}</span></Badge>
                    <Badge variant="error"><Droplet className="w-3 h-3 mr-0.5" />{patient.blood_group}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-100">
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Allergies</p>
                  {patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patient.allergies.map((a, i) => <Badge key={i} variant="error">{a}</Badge>)}
                    </div>
                  ) : <p className="text-sm text-neutral-500">None</p>}
                </div>
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Chronic Diseases</p>
                  {patient.chronic_diseases.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patient.chronic_diseases.map((d, i) => <Badge key={i} variant="warning">{d}</Badge>)}
                    </div>
                  ) : <p className="text-sm text-neutral-500">None</p>}
                </div>
              </div>
            </Card>

            {/* Current Medications */}
            {patient.current_medications.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="w-4 h-4 text-accent-600" />
                  <h3 className="text-sm font-semibold text-neutral-700">Current Medications</h3>
                </div>
                <div className="space-y-2">
                  {patient.current_medications.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl">
                      <span className="text-sm text-neutral-700">{m}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Emergency Contact */}
            {patient.emergency_contact_name && (
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-primary-500" />
                  <h3 className="text-sm font-semibold text-neutral-700">Emergency Contact</h3>
                </div>
                <p className="text-sm text-neutral-700 font-medium">{patient.emergency_contact_name}</p>
                <p className="text-sm text-neutral-400">{patient.emergency_contact_phone}</p>
              </Card>
            )}

            {/* Pending Tests */}
            {labReports.filter(r => r.status === 'pending').length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <FlaskConical className="w-4 h-4 text-secondary-600" />
                  <h3 className="text-sm font-semibold text-neutral-700">Pending Tests</h3>
                </div>
                <div className="space-y-2">
                  {labReports.filter(r => r.status === 'pending').map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2.5 bg-warning-50 rounded-xl">
                      <span className="text-sm text-neutral-700">{r.test_name}</span>
                      <Badge variant="warning" dot>Pending</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Latest Visit */}
            {timeline[0] && (
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-primary-500" />
                  <h3 className="text-sm font-semibold text-neutral-700">Latest Visit</h3>
                </div>
                <p className="text-sm text-neutral-700">{timeline[0].title}</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {new Date(timeline[0].event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · {timeline[0].doctor_name}
                </p>
              </Card>
            )}
          </div>
        )}

        {/* TIMELINE */}
        {activeSection === 'timeline' && (
          <div className="relative animate-fade-in">
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-neutral-200" />
            <div className="space-y-4">
              {timeline.map((event) => (
                <div key={event.id} className="relative flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm">
                    <Activity className="w-5 h-5 text-primary-600" />
                  </div>
                  <Card className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-semibold text-neutral-800">{event.title}</h3>
                      <Badge variant={event.status === 'completed' ? 'success' : 'warning'} dot>{event.status}</Badge>
                    </div>
                    {event.description && <p className="text-xs text-neutral-500 mb-2">{event.description}</p>}
                    <p className="text-xs text-neutral-400">{new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {event.event_time.slice(0, 5)}{event.doctor_name ? ` · ${event.doctor_name}` : ''}</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY - Previous consultations, prescriptions, reports */}
        {activeSection === 'history' && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">Previous Prescriptions</h3>
              {prescriptions.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">No prescriptions yet</p>
              ) : (
                <div className="space-y-2.5">
                  {prescriptions.map((p) => (
                    <Card key={p.id}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-neutral-800">{p.diagnosis}</p>
                          <p className="text-xs text-neutral-400">{(p as any).doctors?.full_name || 'Doctor'} · {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {p.medications.map((m, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-neutral-700 font-medium">{m.name}</span>
                            <span className="text-neutral-400">{m.dosage} · {m.frequency}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">Uploaded Medical Records</h3>
              {medicalFiles.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">No medical records uploaded yet</p>
              ) : (
                <div className="space-y-2.5">
                  {medicalFiles.map((file) => (
                    <Card key={file.id || file._id} hover className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 border border-primary-100">
                          <FileText className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-neutral-800 truncate">{file.file_name || file.fileName || 'Report'}</p>
                            <Badge variant="primary">{file.category || 'General'}</Badge>
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            Uploaded on {new Date(file.uploaded_at || file.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} by {file.uploaded_by || file.uploadedBy || 'Patient'} · {file.mime_type || file.mimeType}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={() => setPreviewFile(file)}>
                        View
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">Previous Lab Reports</h3>
              {labReports.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">No lab reports yet</p>
              ) : (
                <div className="space-y-2.5">
                  {labReports.map((r) => (
                    <Card key={r.id}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-neutral-800">{r.test_name}</p>
                          <p className="text-xs text-neutral-400">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <Badge variant={r.status === 'completed' ? 'success' : 'warning'} dot>{r.status}</Badge>
                      </div>
                      {r.notes && <p className="text-xs text-neutral-500">{r.notes}</p>}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI SUMMARY */}
        {activeSection === 'ai' && (
          <div className="bg-gradient-to-br from-secondary-50 to-white rounded-2xl border border-secondary-100 p-5 shadow-card animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-secondary-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-800">AI Clinical Summary</h3>
                <p className="text-xs text-neutral-400">Patient history analysis</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-700">Patient Overview</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {age}y {patient.gender} with {patient.chronic_diseases.length > 0 ? patient.chronic_diseases.join(', ') : 'no chronic conditions'}. {patient.allergies.length > 0 ? `Allergic to ${patient.allergies.join(', ')}.` : 'No known allergies.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-accent-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Pill className="w-3.5 h-3.5 text-accent-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-700">Medication History</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {patient.current_medications.length} active medications. {prescriptions.length} total prescriptions. Treatment adherence appears consistent.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-secondary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FlaskConical className="w-3.5 h-3.5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-700">Lab Trends</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {labReports.length} total tests. {labReports.filter(r => r.status === 'completed').length} completed, {labReports.filter(r => r.status === 'pending').length} pending. Results indicate stable health trajectory.
                  </p>
                </div>
              </div>

              {patient.chronic_diseases.length > 0 && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-warning-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-700">Clinical Warnings</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Monitor {patient.chronic_diseases.join(', ')} closely. Regular follow-ups recommended every 30-90 days.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-secondary-100">
              <p className="text-[10px] text-neutral-400 italic leading-relaxed">
                AI-generated clinical summary. This information assists healthcare professionals and does not replace medical judgment.
              </p>
            </div>
          </div>
        )}

        {/* CONSULT */}
        {activeSection === 'consult' && (
          <div className="space-y-4 animate-fade-in">
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="w-5 h-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-neutral-700">New Consultation</h3>
              </div>
              <p className="text-sm text-neutral-500 mb-4">Complete the consultation form below for {patient.full_name}.</p>
              <Button fullWidth onClick={() => setShowConsultForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
                Start Consultation
              </Button>
            </Card>

            {/* Lab Request Quick Action */}
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical className="w-5 h-5 text-secondary-600" />
                <h3 className="text-sm font-semibold text-neutral-700">Request Lab Test</h3>
              </div>
              <LabRequestForm patientId={patient.id} onDone={() => toast('Lab test requested', 'success')} />
            </Card>
          </div>
        )}
      </main>

      {/* Consultation Form Modal */}
      <Modal open={showConsultForm} onClose={() => setShowConsultForm(false)} title="Consultation Form" size="lg">
        <div className="space-y-4">
          <Input label="Diagnosis" placeholder="Enter diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Medications</label>
            <div className="space-y-2">
              {medications.map((med, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <Input placeholder="Medicine name" value={med.name} onChange={(e) => setMedications(prev => prev.map((m, j) => j === i ? { ...m, name: e.target.value } : m))} />
                  <Input placeholder="Dosage" value={med.dosage} onChange={(e) => setMedications(prev => prev.map((m, j) => j === i ? { ...m, dosage: e.target.value } : m))} />
                  <Input placeholder="Frequency (e.g. Twice daily)" value={med.frequency} onChange={(e) => setMedications(prev => prev.map((m, j) => j === i ? { ...m, frequency: e.target.value } : m))} />
                  <Input placeholder="Duration (e.g. 30 days)" value={med.duration} onChange={(e) => setMedications(prev => prev.map((m, j) => j === i ? { ...m, duration: e.target.value } : m))} />
                </div>
              ))}
            </div>
            <button onClick={addMedication} className="mt-2 text-sm text-primary-600 font-medium flex items-center gap-1 hover:text-primary-700">
              <Plus className="w-4 h-4" /> Add medication
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Notes</label>
            <textarea
              className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:bg-white resize-none"
              rows={3}
              placeholder="Clinical notes and observations"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Input label="Follow-up Date" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />

          <Button fullWidth size="lg" onClick={submitConsultation} leftIcon={<Check className="w-4 h-4" />}>
            Complete Consultation
          </Button>
        </div>
      </Modal>

      <ReportViewerModal
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  )
}

function LabRequestForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [testName, setTestName] = useState('')
  const { toast } = useToast()

  const submit = async () => {
    if (!testName.trim()) {
      toast('Enter a test name', 'error')
      return
    }
    const { data: { user } } = await api.get('/auth/me')
    const { data: doc } = await api.get(`/doctors/by-email/${encodeURIComponent(user?.email || '')}`)

    await api.post('/lab-reports', {
      patient_id: patientId,
      doctor_id: doc?.id || null,
      test_name: testName,
      status: 'pending',
    })

    await api.post('/timeline', {
      patient_id: patientId,
      event_type: 'laboratory',
      title: 'Lab Test Requested',
      description: testName,
      doctor_name: user?.full_name || 'Doctor',
      status: 'pending',
    })

    setTestName('')
    onDone()
  }

  return (
    <div className="flex gap-2">
      <Input placeholder="Test name (e.g. CBC, Lipid Profile)" value={testName} onChange={(e) => setTestName(e.target.value)} />
      <Button onClick={submit} size="md">Request</Button>
    </div>
  )
}
