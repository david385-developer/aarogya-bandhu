import { useEffect, useState } from 'react'
import { FileText, Pill, FlaskConical, Download, ChevronRight, Upload, Eye, Plus, CheckCircle2, Stethoscope, Calendar } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../lib/auth'
import { api, Prescription, LabReport, MedicalFile, emitSyncRefresh, emitNotificationRefresh } from '../../lib/api'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { ReportViewerModal } from '../../components/ReportViewerModal'

export function MedicalRecordsPage() {
  const { profile } = useAuth()
  const { showToast } = useToast()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [labReports, setLabReports] = useState<LabReport[]>([])
  const [files, setFiles] = useState<MedicalFile[]>([])
  const [consultations, setConsultations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'files' | 'prescriptions' | 'consultations' | 'reports'>('files')
  const [selectedPresc, setSelectedPresc] = useState<Prescription | null>(null)
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null)
  const [previewFile, setPreviewFile] = useState<MedicalFile | null>(null)

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [category, setCategory] = useState('Lab Report')
  const [customFileName, setCustomFileName] = useState('')
  const [uploading, setUploading] = useState(false)

  const loadData = async (silent = false) => {
    if (!profile?.email) return
    if (!silent && files.length === 0 && prescriptions.length === 0) setLoading(true)
    try {
      const { data: pat } = await api.get(`/patients/by-email/${encodeURIComponent(profile.email)}`)
      if (!pat) { setLoading(false); return }
      const [prescRes, labRes, filesRes, consRes] = await Promise.all([
        api.get(`/prescriptions?patientId=${pat.id}`),
        api.get(`/lab-reports?patientId=${pat.id}`),
        api.get('/patients/me/medical-files'),
        api.get('/patients/me/consultations'),
      ])
      if (prescRes.data) setPrescriptions((prescRes.data as Prescription[]) || [])
      if (labRes.data) setLabReports((labRes.data as LabReport[]) || [])
      if (filesRes.data) setFiles((filesRes.data as MedicalFile[]) || [])
      if (consRes.data) setConsultations((consRes.data as any[]) || [])
    } catch {}
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    loadData()

    // Real-time synchronization without page reload
    const interval = setInterval(() => loadData(true), 8000)
    const handleFocus = () => loadData(true)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [profile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0]
      setSelectedFile(f)
      if (!customFileName) {
        setCustomFileName(f.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('fileName', customFileName || selectedFile.name)
    formData.append('category', category)

    const res = await api.upload('/patients/me/medical-files', formData)
    setUploading(false)

    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast('Medical record uploaded successfully', 'success')
      setShowUploadModal(false)
      setSelectedFile(null)
      setCustomFileName('')
      loadData()
      emitNotificationRefresh()
      emitSyncRefresh()
    }
  }

  return (
    <AppShell
      role="patient"
      title="Medical Records"
      subtitle="Your uploaded documents, consultations, prescriptions, and lab reports"
      headerRight={
        <Button
          onClick={() => setShowUploadModal(true)}
          leftIcon={<Upload className="w-4 h-4" />}
          size="sm"
          className="shadow-soft"
        >
          Upload Medical File
        </Button>
      }
    >
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'files'
              ? 'bg-primary-600 text-white shadow-soft'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          Uploaded Files ({files.length})
        </button>
        <button
          onClick={() => setActiveTab('consultations')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'consultations'
              ? 'bg-primary-600 text-white shadow-soft'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          Consultations ({consultations.length})
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'prescriptions'
              ? 'bg-primary-600 text-white shadow-soft'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          Prescriptions ({prescriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'reports'
              ? 'bg-primary-600 text-white shadow-soft'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          Lab Reports ({labReports.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : activeTab === 'files' ? (
        files.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="No medical documents uploaded"
            description="Upload lab reports, prescriptions, scans, or discharge summaries securely to Cloudinary"
            action={
              <Button onClick={() => setShowUploadModal(true)} leftIcon={<Upload className="w-4 h-4" />}>
                Upload Medical File
              </Button>
            }
          />
        ) : (
          <div className="space-y-3 animate-fade-in">
            {files.map((file) => (
              <Card key={file.id} hover className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 border border-primary-100">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-neutral-800 truncate">{file.file_name || file.original_name}</h4>
                      {file.category && <Badge variant="primary">{file.category}</Badge>}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Uploaded on {new Date(file.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {(file.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setPreviewFile(file)}
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.cloudinary_url, '_blank')}
                    title="Download / Open File"
                  >
                    <Download className="w-4 h-4 text-neutral-600" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : activeTab === 'consultations' ? (
        consultations.length === 0 ? (
          <EmptyState icon={<Stethoscope className="w-8 h-8" />} title="No consultation records yet" description="Your clinical consultations and doctor notes will appear here" />
        ) : (
          <div className="space-y-3 animate-fade-in">
            {consultations.map((c, idx) => {
              const docName = c.doctorName || c.doctor_name || c.doctors?.fullName || 'Doctor'
              const dateStr = new Date(c.createdAt || c.appointmentDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              const meds = c.medications || c.prescription?.medications || []

              return (
                <Card key={c.id || c._id || idx} className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900">{c.diagnosis || 'Consultation'}</h4>
                        <p className="text-xs text-neutral-400">By {docName} · {dateStr}</p>
                      </div>
                    </div>
                    {c.followUpDate && (
                      <Badge variant="warning" leftIcon={<Calendar className="w-3 h-3" />}>Follow-up: {c.followUpDate}</Badge>
                    )}
                  </div>

                  {(c.chiefComplaint || c.symptoms) && (
                    <div className="text-xs bg-neutral-50 p-2 rounded-lg border border-neutral-100 text-neutral-700 space-y-0.5">
                      {c.chiefComplaint && <p><span className="font-semibold">Chief Complaint:</span> {c.chiefComplaint}</p>}
                      {c.symptoms && <p><span className="font-semibold">Symptoms:</span> {c.symptoms}</p>}
                    </div>
                  )}

                  {c.notes && <p className="text-xs text-neutral-600"><span className="font-semibold">Doctor Notes:</span> {c.notes}</p>}

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
            })}
          </div>
        )
      ) : activeTab === 'prescriptions' ? (
        prescriptions.length === 0 ? (
          <EmptyState icon={<Pill className="w-8 h-8" />} title="No prescriptions yet" description="Your prescriptions will appear here" />
        ) : (
          <div className="space-y-3 animate-fade-in">
            {prescriptions.map((p) => (
              <Card key={p.id} hover onClick={() => setSelectedPresc(p)} className="cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-accent-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{p.diagnosis}</p>
                      <p className="text-xs text-neutral-400">
                        {(p as any).doctors?.full_name || 'Doctor'} · {new Date((p as any).createdAt || p.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(p.medications || []).slice(0, 3).map((m, i) => (
                    <Badge key={i} variant="neutral">
                      {m.name || (m as any).medicineName}
                    </Badge>
                  ))}
                  {(p.medications || []).length > 3 && <Badge variant="neutral">+{(p.medications || []).length - 3} more</Badge>}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        labReports.length === 0 ? (
          <EmptyState icon={<FlaskConical className="w-8 h-8" />} title="No lab reports yet" description="Your lab reports will appear here" />
        ) : (
          <div className="space-y-3 animate-fade-in">
            {labReports.map((r) => (
              <Card key={r.id} hover onClick={() => setSelectedReport(r)} className="cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
                      <FlaskConical className="w-5 h-5 text-secondary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{r.test_name}</p>
                      <p className="text-xs text-neutral-400">
                        {new Date((r as any).createdAt || r.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={r.status === 'completed' ? 'success' : r.status === 'pending' ? 'warning' : 'neutral'} dot>
                    {r.status}
                  </Badge>
                </div>
                {r.notes && <p className="text-xs text-neutral-500 mt-1">{r.notes}</p>}
              </Card>
            ))}
          </div>
        )
      )}

      {/* Upload Medical File Modal */}
      <Modal open={showUploadModal} onClose={() => !uploading && setShowUploadModal(false)} title="Upload Medical File" size="md">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Document Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={uploading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            >
              <option value="Lab Report">Lab Report</option>
              <option value="Prescription">Prescription</option>
              <option value="Discharge Summary">Discharge Summary</option>
              <option value="Scan/X-Ray">Scan/X-Ray</option>
              <option value="General">General Medical Document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Document Title</label>
            <input
              type="text"
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder="e.g. Complete Blood Count - July 2026"
              disabled={uploading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Select File (Cloudinary Storage)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-2xl hover:border-primary-400 bg-neutral-50 transition-colors">
              <div className="space-y-2 text-center">
                <Upload className="mx-auto h-8 w-8 text-neutral-400" />
                <div className="flex text-sm text-neutral-600 justify-center">
                  <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                    <span>{selectedFile ? selectedFile.name : 'Choose file to upload'}</span>
                    <input type="file" className="sr-only" onChange={handleFileSelect} disabled={uploading} />
                  </label>
                </div>
                <p className="text-xs text-neutral-400">Supported: PDF, PNG, JPG up to 15MB</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="outline"
              fullWidth
              disabled={uploading}
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              loading={uploading}
              disabled={!selectedFile || uploading}
            >
              Upload to Cloudinary
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview File Modal */}
      <ReportViewerModal
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      {/* Prescription Detail Modal */}
      <Modal open={!!selectedPresc} onClose={() => setSelectedPresc(null)} title="Prescription Details" size="lg">
        {selectedPresc && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-neutral-400 mb-1">Diagnosis</p>
              <p className="text-sm font-medium text-neutral-800">{selectedPresc.diagnosis}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-2">Medications</p>
              <div className="space-y-2">
                {(selectedPresc.medications || []).map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-neutral-700">{m.name || m.medicineName}</p>
                      <p className="text-xs text-neutral-400">
                        {m.dosage} · {m.frequency}
                      </p>
                    </div>
                    {m.duration && <Badge variant="neutral">{m.duration}</Badge>}
                  </div>
                ))}
              </div>
            </div>
            {selectedPresc.notes && (
              <div>
                <p className="text-xs text-neutral-400 mb-1">Notes</p>
                <p className="text-sm text-neutral-600">{selectedPresc.notes}</p>
              </div>
            )}
            {selectedPresc.follow_up_date && (
              <div className="flex items-center gap-2 p-3 bg-warning-50 rounded-xl">
                <p className="text-xs text-warning-700">
                  Follow-up: {new Date(selectedPresc.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
            <Button variant="outline" fullWidth leftIcon={<Download className="w-4 h-4" />}>
              Download Prescription
            </Button>
          </div>
        )}
      </Modal>

      {/* Lab Report Detail Modal */}
      <Modal open={!!selectedReport} onClose={() => setSelectedReport(null)} title="Lab Report" size="lg">
        {selectedReport && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-800">{selectedReport.test_name}</p>
                <p className="text-xs text-neutral-400">
                  {new Date((selectedReport as any).createdAt || selectedReport.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <Badge variant={selectedReport.status === 'completed' ? 'success' : selectedReport.status === 'pending' ? 'warning' : 'neutral'} dot>
                {selectedReport.status}
              </Badge>
            </div>
            {selectedReport.result && (
              <div>
                <p className="text-xs text-neutral-400 mb-2">Results</p>
                <div className="space-y-2">
                  {Object.entries(selectedReport.result).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                      <p className="text-sm text-neutral-600 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-semibold text-neutral-800">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedReport.notes && (
              <div>
                <p className="text-xs text-neutral-400 mb-1">Notes</p>
                <p className="text-sm text-neutral-600">{selectedReport.notes}</p>
              </div>
            )}
            {selectedReport.status === 'completed' && (
              <Button variant="outline" fullWidth leftIcon={<Download className="w-4 h-4" />}>
                Download Report
              </Button>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
