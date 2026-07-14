import { useEffect, useState } from 'react'
import { Calendar, Clock, Pill, FlaskConical, Activity, FileText, Stethoscope, TrendingUp, CircleAlert as AlertCircle, UserPlus } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../lib/auth'
import { supabase, TimelineEvent } from '../../lib/supabase'

const eventConfig: Record<string, { icon: typeof Calendar; color: string; bg: string }> = {
  registration: { icon: UserPlus, color: 'text-primary-600', bg: 'bg-primary-50' },
  visit: { icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50' },
  consultation: { icon: Stethoscope, color: 'text-primary-600', bg: 'bg-primary-50' },
  prescription: { icon: Pill, color: 'text-accent-600', bg: 'bg-accent-50' },
  laboratory: { icon: FlaskConical, color: 'text-secondary-600', bg: 'bg-secondary-50' },
  report: { icon: FileText, color: 'text-secondary-600', bg: 'bg-secondary-50' },
  follow_up: { icon: Clock, color: 'text-warning-600', bg: 'bg-warning-50' },
  upload: { icon: TrendingUp, color: 'text-neutral-600', bg: 'bg-neutral-100' },
  notification: { icon: AlertCircle, color: 'text-neutral-600', bg: 'bg-neutral-100' },
}

export function TimelinePage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      if (!profile?.email) return
      const { data: pat } = await supabase.from('patients').select('id').eq('email', profile.email).maybeSingle()
      if (!pat) { setLoading(false); return }
      const { data } = await supabase.from('timeline_events').select('*').eq('patient_id', pat.id).order('event_date', { ascending: false })
      setEvents(data as TimelineEvent[] || [])
      setLoading(false)
    })()
  }, [profile])

  return (
    <AppShell role="patient" title="Health Timeline" subtitle="Your complete health journey">
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : events.length === 0 ? (
        <EmptyState icon={<Activity className="w-8 h-8" />} title="No timeline events" description="Your health events will appear here as you interact with the platform" />
      ) : (
        <div className="relative animate-fade-in">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-neutral-200" />

          <div className="space-y-4">
            {events.map((event) => {
              const config = eventConfig[event.event_type] || eventConfig.notification
              const Icon = config.icon
              return (
                <div key={event.id} className="relative flex gap-4">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <Card className="flex-1" hover>
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-semibold text-neutral-800">{event.title}</h3>
                      <Badge variant={event.status === 'completed' ? 'success' : 'warning'} dot>
                        {event.status}
                      </Badge>
                    </div>
                    {event.description && <p className="text-xs text-neutral-500 mb-2">{event.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.event_time.slice(0, 5)}
                      </span>
                      {event.doctor_name && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" />
                          {event.doctor_name}
                        </span>
                      )}
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </AppShell>
  )
}
