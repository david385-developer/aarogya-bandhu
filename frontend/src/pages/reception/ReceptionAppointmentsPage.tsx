import { useEffect, useState } from 'react'
import { Calendar, Clock, ChevronRight } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { api, Appointment, Patient, Doctor } from '../../lib/api'

export function ReceptionAppointmentsPage() {
  const [appointments, setAppointments] = useState<(Appointment & { patients: Patient; doctors: Doctor })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/appointments')
      setAppointments(data as any || [])
      setLoading(false)
    })()
  }, [])

  return (
    <AppShell role="receptionist" title="Appointments" subtitle={`${appointments.length} total`}>
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState icon={<Calendar className="w-8 h-8" />} title="No appointments" description="Schedule appointments from the dashboard" />
      ) : (
        <div className="space-y-2.5 animate-fade-in">
          {appointments.map((a) => (
            <Card key={a.id} hover>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {a.patients?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800">{a.patients?.full_name}</p>
                  <p className="text-xs text-neutral-400">{a.doctors?.full_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(a.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {a.appointment_time.slice(0, 5)}
                    </span>
                  </div>
                </div>
                <Badge variant={a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'warning' : 'primary'} dot>
                  {a.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}
