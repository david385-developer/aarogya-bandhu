import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Clock, ChevronRight, Calendar, Stethoscope, Activity, QrCode, Camera, ShieldCheck, Search, Pill, FileText } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../lib/auth'
import { api, Patient, Appointment } from '../../lib/api'
import { useToast } from '../../components/ui/Toast'
import { PatientWorkspaceModal } from '../../components/PatientWorkspaceModal'
import { NotificationBell } from '../../components/NotificationBell'

export function DoctorDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [patients, setPatients] = useState<(Appointment & { patients: Patient })[]>([])
  const [loading, setLoading] = useState(true)
  const [doctorId, setDoctorId] = useState<string | null>(null)

  // Consultations & Prescriptions State
  const [recentConsultations, setRecentConsultations] = useState<any[]>([])
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([])
  const [historySearchQuery, setHistorySearchQuery] = useState('')

  // QR Scan Modal & Workspace Modal State
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [scannedPatientData, setScannedPatientData] = useState<any | null>(null)
  const [manualToken, setManualToken] = useState('')
  const [scanningLoading, setScanningLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const loadDoctorData = async (isBackground = false) => {
    if (!profile?.email) return
    if (!isBackground) setLoading(true)
    try {
      const dashboardRes = await api.get('/doctors/me/dashboard').catch(() => null)
      if (dashboardRes?.data) {
        const data = dashboardRes.data
        if (data.doctor?.id || data.doctor?._id) setDoctorId(data.doctor.id || data.doctor._id)
        const assigned = data.assignedPatients || data.todaysAppointments || []
        setPatients(assigned as any || [])
        setRecentConsultations(data.recentConsultations || [])
      } else {
        const { data: doc } = await api.get(`/doctors/by-email/${encodeURIComponent(profile.email)}`)
        if (!doc) {
          if (!isBackground) setLoading(false)
          return
        }
        setDoctorId(doc.id)
        const [apptRes, qRes, consRes, rxRes] = await Promise.all([
          api.get(`/appointments?doctorId=${doc.id}&date=${new Date().toISOString().split('T')[0]}`),
          api.get(`/queue?doctorId=${doc.id}&status=waiting`),
          api.get(`/consultations?doctorId=${doc.id}`),
          api.get(`/prescriptions?doctorId=${doc.id}`),
        ])
        const appts = (apptRes.data as any[]) || []
        const qs = (qRes.data as any[]) || []
        const combinedMap = new Map()
        appts.forEach((a) => combinedMap.set(String(a.patient_id || a.patientId?._id || a.id), a))
        qs.forEach((q) => {
          const pId = String(q.patient_id || q.patientId?._id || q.id)
          if (!combinedMap.has(pId)) combinedMap.set(pId, q)
        })
        setPatients(Array.from(combinedMap.values()))
        setRecentConsultations((consRes.data as any[]) || [])
        setRecentPrescriptions((rxRes.data as any[]) || [])
      }
    } catch {
      // ignore
    } finally {
      if (!isBackground) setLoading(false)
    }
  }

  useEffect(() => {
    loadDoctorData()
    const interval = setInterval(() => {
      loadDoctorData(true)
    }, 4000)
    const handleSync = () => loadDoctorData(true)
    window.addEventListener('sync-refresh', handleSync)
    return () => {
      clearInterval(interval)
      window.removeEventListener('sync-refresh', handleSync)
    }
  }, [profile])

  // Camera Barcode Scanner Loop
  useEffect(() => {
    let interval: any = null
    let stream: MediaStream | null = null

    if (showScannerModal && cameraActive && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((mediaStream) => {
          stream = mediaStream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
          if ('BarcodeDetector' in window) {
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
            interval = setInterval(async () => {
              if (videoRef.current && videoRef.current.readyState === 4) {
                try {
                  const barcodes = await detector.detect(videoRef.current)
                  if (barcodes.length > 0) {
                    const rawValue = barcodes[0].rawValue
                    stopCamera(stream, interval)
                    handleProcessToken(rawValue)
                  }
                } catch {}
              }
            }, 500)
          }
        })
        .catch(() => {
          setCameraActive(false)
          showToast('Camera not available or permission denied', 'warning')
        })
    }

    return () => {
      stopCamera(stream, interval)
    }
  }, [showScannerModal, cameraActive])

  const stopCamera = (stream: MediaStream | null, interval: any) => {
    if (interval) clearInterval(interval)
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
  }

  const handleProcessToken = async (tokenInput: string) => {
    if (!tokenInput || !tokenInput.trim()) return
    setScanningLoading(true)
    try {
      const res = await api.post('/passport/scan', { passportToken: tokenInput.trim() })
      setScanningLoading(false)
      if (res.error) {
        showToast(res.error, 'error')
      } else {
        showToast('Patient QR Passport verified successfully', 'success')
        setShowScannerModal(false)
        setManualToken('')
        setCameraActive(false)
        // STRICT REQUIREMENT: Open Patient Workspace Modal WITHOUT navigating to another page
        setScannedPatientData(res.data)
      }
    } catch (err: any) {
      setScanningLoading(false)
      showToast(err?.message || 'Failed to scan passport', 'error')
    }
  }

  const firstName = profile?.full_name?.split(' ')[0]?.replace('Dr. ', '') || 'Doctor'
  const todayCount = patients.length
  const waitingCount = patients.filter(p => p.status === 'scheduled' || p.status === 'in_progress').length
  const completedCount = patients.filter(p => p.status === 'completed').length

  const filteredConsultations = recentConsultations.filter(c => {
    if (!historySearchQuery.trim()) return true
    const q = historySearchQuery.toLowerCase()
    return (
      (c.diagnosis && c.diagnosis.toLowerCase().includes(q)) ||
      (c.patientId && String(c.patientId).toLowerCase().includes(q)) ||
      (c.chiefComplaint && c.chiefComplaint.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    )
  })

  return (
    <AppShell
      role="doctor"
      title={`Dr. ${firstName}`}
      subtitle="Today's Patient Queue"
      headerRight={
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            onClick={() => setShowScannerModal(true)}
            leftIcon={<QrCode className="w-4 h-4" />}
            size="sm"
            className="shadow-soft"
          >
            Scan QR
          </Button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold">
            {profile?.full_name?.charAt(profile.full_name.indexOf('Dr.') + 4)?.toUpperCase() || 'D'}
          </div>
        </div>
      }
    >
      <div className="space-y-5 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-neutral-900">{todayCount}</p>
            <p className="text-xs text-neutral-400 mt-0.5">Total Today</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-warning-600">{waitingCount}</p>
            <p className="text-xs text-neutral-400 mt-0.5">Waiting</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-2xl font-bold text-accent-600">{recentConsultations.length}</p>
            <p className="text-xs text-neutral-400 mt-0.5">Consultations</p>
          </Card>
        </div>

        {/* Patient Queue */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Patient Queue</h3>
          {loading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : patients.length === 0 ? (
            <EmptyState icon={<Users className="w-8 h-8" />} title="No patients today" description="Your patient queue is empty for today" />
          ) : (
            <div className="space-y-2.5">
              {patients.map((appt) => (
                <Card key={appt.id} hover onClick={() => navigate(`/doctor/workspace/${appt.patient_id}`)} className="cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {appt.patients?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800">{appt.patients?.full_name}</p>
                      <p className="text-xs text-neutral-400">
                        {appt.patients?.patient_id} · {appt.appointment_time.slice(0, 5)}
                      </p>
                      {appt.reason && <p className="text-xs text-neutral-500 mt-0.5 truncate">{appt.reason}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={appt.status === 'completed' ? 'success' : appt.status === 'in_progress' ? 'warning' : 'primary'} dot>
                        {appt.status === 'in_progress' ? 'Active' : appt.status}
                      </Badge>
                      {appt.token_number && <span className="text-xs text-neutral-400">#{appt.token_number}</span>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Consultations & Searchable Patient History */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-primary-600" /> Recent Consultations & Patient History
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search history by diagnosis..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {filteredConsultations.length === 0 ? (
            <Card className="p-6 text-center text-neutral-400 text-xs">
              No consultations match your search or history.
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredConsultations.slice(0, 5).map((cons: any, index: number) => (
                <Card key={cons._id || cons.id || index} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-neutral-800">{cons.diagnosis}</h4>
                    <span className="text-xs text-neutral-400">
                      {new Date(cons.createdAt || cons.appointmentDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {cons.notes && <p className="text-xs text-neutral-500">{cons.notes}</p>}
                  {cons.prescriptionSummary && (
                    <div className="flex items-center gap-1.5 pt-1 text-xs text-primary-700 font-medium">
                      <Pill className="w-3.5 h-3.5" /> Prescriptions: {cons.prescriptionSummary}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Previous Prescriptions Summary */}
        {recentPrescriptions.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-accent-600" /> Previous Prescriptions ({recentPrescriptions.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {recentPrescriptions.slice(0, 4).map((rx: any, idx: number) => (
                <Card key={rx._id || rx.id || idx} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-neutral-800">{rx.diagnosis || 'Prescription'}</p>
                    <span className="text-[10px] text-neutral-400">{new Date(rx.createdAt || Date.now()).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(rx.medications || []).map((m: any, i: number) => (
                      <Badge key={i} variant="neutral">{m.name || m.medicineName} ({m.dosage})</Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Access */}
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => setShowScannerModal(true)} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-soft-lg transition-all">
            <QrCode className="w-6 h-6 text-primary-600" />
            <span className="text-xs font-medium text-neutral-700">Scan QR</span>
          </button>
          <button onClick={() => navigate('/doctor/patients')} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-soft-lg transition-all">
            <Users className="w-6 h-6 text-primary-600" />
            <span className="text-xs font-medium text-neutral-700">All Patients</span>
          </button>
          <button onClick={() => navigate('/doctor/workspace')} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-soft-lg transition-all">
            <Stethoscope className="w-6 h-6 text-secondary-600" />
            <span className="text-xs font-medium text-neutral-700">Workspace</span>
          </button>
        </div>
      </div>

      {/* Scan QR Passport Modal */}
      <Modal open={showScannerModal} onClose={() => { setShowScannerModal(false); setCameraActive(false); }} title="Scan Patient QR Passport" size="md">
        <div className="space-y-4">
          <p className="text-xs text-neutral-500 text-center">
            Scan the patient's QR code or enter their Passport Token / Patient ID to instantly load their longitudinal record.
          </p>

          {/* Camera Scanner View */}
          <div className="border-2 border-neutral-200 border-dashed rounded-2xl overflow-hidden bg-neutral-900 flex flex-col items-center justify-center min-h-[220px] relative">
            {cameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-[220px] object-cover" />
            ) : (
              <div className="p-6 text-center text-white space-y-3">
                <Camera className="w-10 h-10 text-neutral-400 mx-auto animate-pulse" />
                <p className="text-xs text-neutral-300">Point your camera at the patient's Health Passport QR code</p>
                <Button size="sm" variant="outline" onClick={() => setCameraActive(true)} className="text-white border-white">
                  Enable Camera Scanner
                </Button>
              </div>
            )}
          </div>

          {/* Manual / Test Token Input */}
          <div className="pt-2 border-t border-neutral-200">
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Or Enter Passport Token / Patient ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="e.g. AB-684271 or passport UUID"
                disabled={scanningLoading}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
              <Button
                onClick={() => handleProcessToken(manualToken)}
                loading={scanningLoading}
                disabled={!manualToken.trim() || scanningLoading}
                leftIcon={<Search className="w-4 h-4" />}
              >
                Load
              </Button>
            </div>
          </div>

          {/* Quick Demo Selector for Testing */}
          <div className="bg-primary-50/50 p-3 rounded-xl border border-primary-100">
            <p className="text-xs font-semibold text-primary-800 mb-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-600" /> Quick Demo Scan Options
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['AB-684271', 'AB-492815', 'AB-931048'].map((sampleId) => (
                <button
                  key={sampleId}
                  onClick={() => handleProcessToken(sampleId)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-primary-200 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors"
                >
                  Scan {sampleId}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Patient Workspace Modal (Non-Navigational) */}
      {/* Opening: Doctor Dashboard -> Scan QR -> Modal Opens */}
      {/* Closing: Modal Closes -> Doctor Dashboard remains exactly where it was. No page refresh. No navigation. */}
      <PatientWorkspaceModal
        open={!!scannedPatientData}
        data={scannedPatientData}
        onClose={() => setScannedPatientData(null)}
        onConsultationSaved={(newCons) => {
          setRecentConsultations(prev => [newCons, ...prev])
          if (newCons.prescription) {
            setRecentPrescriptions(prev => [newCons.prescription, ...prev])
          }
        }}
      />
    </AppShell>
  )
}
