import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Pill, FlaskConical, QrCode, Sparkles, ChevronRight, Activity, Heart, TrendingUp, CircleAlert as AlertCircle, FileText, Stethoscope } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton'
import { useAuth } from '../../lib/auth'
import { api, Patient, Appointment, Prescription, LabReport, TimelineEvent } from '../../lib/api'
import { QRPassport } from './QRPassport'
import { AISummary } from './AISummary'

export function PatientDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [consultation, setConsultation] = useState<any | null>(null)
  const [labReport, setLabReport] = useState<LabReport | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)

  const loadDashboardData = async (silent = false) => {
    if (!profile?.email) {
      if (profile?.profile) setPatient(profile.profile as Patient)
      if (!silent) setLoading(false)
      return
    }
    if (!silent && !patient) setLoading(true)
    try {
      const { data: pat } = await api.get(`/patients/by-email/${encodeURIComponent(profile.email)}`)
      const effectivePat = pat || profile?.profile || null
      if (!effectivePat) {
        if (!silent) setLoading(false)
        return
      }
      setPatient(effectivePat as Patient)

      const pid = effectivePat.id || (effectivePat as any)._id
      const [apptRes, prescRes, labRes, tlRes, consRes] = await Promise.all([
        api.get(`/appointments?patientId=${pid}`),
        api.get(`/prescriptions?patientId=${pid}`),
        api.get(`/lab-reports?patientId=${pid}`),
        api.get(`/timeline?patientId=${pid}`),
        api.get('/patients/me/consultations'),
      ])

      if (apptRes.data && apptRes.data.length > 0) setAppointment(apptRes.data[0] as Appointment)
      if (prescRes.data && prescRes.data.length > 0) setPrescription(prescRes.data[0] as Prescription)
      if (consRes.data && consRes.data.length > 0) setConsultation(consRes.data[0])
      if (labRes.data && labRes.data.length > 0) setLabReport(labRes.data[0] as LabReport)
      if (tlRes.data) setTimeline((tlRes.data as TimelineEvent[]).slice(0, 5))
    } catch {
      if (!patient && profile?.profile) setPatient(profile.profile as Patient)
    }
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    loadDashboardData()

    // Real-time synchronization without page reload
    const interval = setInterval(() => loadDashboardData(true), 8000)
    const handleFocus = () => loadDashboardData(true)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [profile])

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <>
      <AppShell
        role="patient"
        title={`Hello, ${firstName}`}
        subtitle="Your health at a glance"
        headerRight={
          <button onClick={() => setShowQR(true)} className="p-2 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors">
            <QrCode className="w-5 h-5" />
          </button>
        }
      >
        <div className="space-y-5 animate-fade-in">
          {/* Health Status Card */}
          {loading && !patient ? (
            <SkeletonCard />
          ) : !patient ? (
            <Card padding="md" className="border-l-4 border-l-error-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-800">Unable to load health details</p>
                  <p className="text-xs text-neutral-400">Please retry or check your connection</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => loadDashboardData()}>Retry</Button>
              </div>
            </Card>
          ) : (
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-5 text-white shadow-soft-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary-400/20 rounded-full translate-y-8 -translate-x-8" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-primary-100 font-medium">Patient ID</p>
                    <p className="text-sm font-semibold">{patient.patient_id || (patient as any).patientId || 'PT-XXXX'}</p>
                  </div>
                  <Badge variant="success" dot>Active</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-primary-100">Blood</p>
                    <p className="text-lg font-bold">{patient.blood_group || (patient as any).bloodGroup || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-100">Age</p>
                    <p className="text-lg font-bold">{(patient.date_of_birth || (patient as any).dateOfBirth) ? new Date().getFullYear() - new Date(patient.date_of_birth || (patient as any).dateOfBirth).getFullYear() : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-100">Status</p>
                    <p className="text-lg font-bold flex items-center gap-1"><Heart className="w-4 h-4 text-secondary-200" /> Stable</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Appointment */}
          {loading ? (
            <SkeletonCard />
          ) : appointment ? (
            <Card hover padding="md" className="cursor-pointer" onClick={() => navigate('/patient/timeline')}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Upcoming Appointment</p>
                    <p className="text-sm font-semibold text-neutral-800">{(appointment as any).doctors?.full_name || 'Your doctor'}</p>
                  </div>
                </div>
                <Badge variant={appointment.status === 'in_progress' ? 'warning' : 'primary'} dot>
                  {appointment.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-600">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  {new Date(appointment.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  {appointment.appointment_time.slice(0, 5)}
                </span>
                {appointment.token_number && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-100 font-medium">Token #{appointment.token_number}</span>
                  </span>
                )}
              </div>
              {appointment.reason && <p className="text-xs text-neutral-500 mt-2">{appointment.reason}</p>}
            </Card>
          ) : (
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700">No upcoming appointments</p>
                  <p className="text-xs text-neutral-400">You're all caught up</p>
                </div>
              </div>
            </Card>
          )}

          {/* AI Summary */}
          {patient && <AISummary patient={patient} />}

          {/* Latest Consultation Card */}
          {loading ? null : consultation ? (
            <Card hover onClick={() => navigate('/patient/records')} className="cursor-pointer border-l-4 border-l-primary-500">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Latest Doctor Consultation</p>
                    <p className="text-sm font-bold text-neutral-800">{consultation.diagnosis || 'Clinical Visit'}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300" />
              </div>
              {consultation.notes && <p className="text-xs text-neutral-600 mb-2">{consultation.notes}</p>}
              {consultation.followUpDate && (
                <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 text-xs text-warning-700 font-medium">
                  <Clock className="w-3.5 h-3.5" /> Follow-up Recommended: {consultation.followUpDate}
                </div>
              )}
            </Card>
          ) : null}

          {/* Latest Prescription */}
          {loading ? (
            <SkeletonCard />
          ) : prescription ? (
            <Card hover onClick={() => navigate('/patient/records')} className="cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Latest Prescription</p>
                    <p className="text-sm font-semibold text-neutral-800">{prescription.diagnosis}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300" />
              </div>
              <div className="space-y-1.5">
                {(prescription.medications || []).slice(0, 3).map((med, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-700 font-medium">{med.name || (med as any).medicineName}</span>
                    <span className="text-neutral-400">{med.dosage} · {med.frequency}</span>
                  </div>
                ))}
              </div>
              {prescription.follow_up_date && (
                <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-1.5 text-xs text-neutral-500">
                  <Clock className="w-3.5 h-3.5" />
                  Follow-up: {new Date(prescription.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </Card>
          ) : null}

          {/* Latest Lab Report */}
          {loading ? (
            <SkeletonCard />
          ) : labReport ? (
            <Card hover>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Latest Lab Report</p>
                    <p className="text-sm font-semibold text-neutral-800">{labReport.test_name}</p>
                  </div>
                </div>
                <Badge variant={labReport.status === 'completed' ? 'success' : labReport.status === 'pending' ? 'warning' : 'neutral'} dot>
                  {labReport.status}
                </Badge>
              </div>
              {labReport.notes && <p className="text-xs text-neutral-500">{labReport.notes}</p>}
            </Card>
          ) : null}

          {/* Health Timeline Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-700">Health Timeline</h3>
              <button onClick={() => navigate('/patient/timeline')} className="text-xs text-primary-600 font-medium hover:text-primary-700">
                View all
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : timeline.length > 0 ? (
              <div className="space-y-2">
                {timeline.slice(0, 3).map((event) => {
                  const isCons = event.event_type === 'consultation' || (event as any).eventType === 'CONSULTATION_CREATED'
                  const isRx = event.event_type === 'prescription' || (event as any).eventType === 'PRESCRIPTION_CREATED'
                  return (
                    <Card key={event.id || (event as any)._id} padding="sm" hover className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                        <TimelineIcon type={event.event_type || (isCons ? 'consultation' : isRx ? 'prescription' : 'visit')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{event.title}</p>
                        <p className="text-xs text-neutral-400">
                          {new Date(event.event_date || (event as any).createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {(event.event_time || '').slice(0, 5)}
                        </p>
                      </div>
                      <Badge variant={event.status === 'completed' ? 'success' : 'warning'}>{event.status || 'completed'}</Badge>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card><p className="text-sm text-neutral-400 text-center py-4">No timeline events yet</p></Card>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowQR(true)} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-soft-lg transition-all">
              <QrCode className="w-6 h-6 text-primary-600" />
              <span className="text-xs font-medium text-neutral-700">QR Passport</span>
            </button>
            <button onClick={() => navigate('/patient/records')} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-soft-lg transition-all">
              <FileText className="w-6 h-6 text-secondary-600" />
              <span className="text-xs font-medium text-neutral-700">Medical Records</span>
            </button>
          </div>
        </div>
      </AppShell>

      {showQR && patient && <QRPassport patient={patient} onClose={() => setShowQR(false)} />}
    </>
  )
}

function TimelineIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    registration: <Activity className="w-4 h-4 text-primary-500" />,
    visit: <Calendar className="w-4 h-4 text-primary-500" />,
    consultation: <Stethoscope className="w-4 h-4 text-primary-500" />,
    prescription: <Pill className="w-4 h-4 text-accent-500" />,
    laboratory: <FlaskConical className="w-4 h-4 text-secondary-500" />,
    report: <FileText className="w-4 h-4 text-secondary-500" />,
    follow_up: <Clock className="w-4 h-4 text-warning-500" />,
    upload: <TrendingUp className="w-4 h-4 text-neutral-500" />,
    notification: <AlertCircle className="w-4 h-4 text-neutral-500" />,
  }
  return <>{icons[type] || <Activity className="w-4 h-4 text-neutral-400" />}</>
}
