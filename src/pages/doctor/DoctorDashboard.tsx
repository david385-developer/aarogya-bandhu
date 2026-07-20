import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Clock, ChevronRight, Calendar, Stethoscope, Activity } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../lib/auth'
import { api, Patient, Appointment } from '../../lib/api'

export function DoctorDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState<(Appointment & { patients: Patient })[]>([])
  const [loading, setLoading] = useState(true)
  const [doctorId, setDoctorId] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      if (!profile?.email) return
      const { data: doc } = await api.get(`/doctors/by-email/${encodeURIComponent(profile.email)}`)
      if (!doc) { setLoading(false); return }
      setDoctorId(doc.id)
      const { data } = await api.get(`/appointments?doctorId=${doc.id}&date=${new Date().toISOString().split('T')[0]}`)
      setPatients(data as any || [])
      setLoading(false)
    })()
  }, [profile])

  const firstName = profile?.full_name?.split(' ')[0]?.replace('Dr. ', '') || 'Doctor'
  const todayCount = patients.length
  const waitingCount = patients.filter(p => p.status === 'scheduled' || p.status === 'in_progress').length
  const completedCount = patients.filter(p => p.status === 'completed').length

  return (
    <AppShell
      role="doctor"
      title={`Dr. ${firstName}`}
      subtitle="Today's Patient Queue"
      headerRight={
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold">
          {profile?.full_name?.charAt(profile.full_name.indexOf('Dr.') + 4)?.toUpperCase() || 'D'}
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
            <p className="text-2xl font-bold text-accent-600">{completedCount}</p>
            <p className="text-xs text-neutral-400 mt-0.5">Completed</p>
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

        {/* Quick Access */}
        <div className="grid grid-cols-2 gap-3">
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
    </AppShell>
  )
}
