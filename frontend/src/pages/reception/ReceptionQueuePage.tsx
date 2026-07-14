import { useEffect, useState } from 'react'
import { ClipboardList, ChevronRight, User } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { supabase, QueueToken, Patient, Doctor } from '../../lib/supabase'

export function ReceptionQueuePage() {
  const [queue, setQueue] = useState<(QueueToken & { patients: Patient; doctors: Doctor })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('queue_tokens').select('*, patients(*), doctors(*)').order('token_number')
      setQueue(data as any || [])
      setLoading(false)
    })()
  }, [])

  return (
    <AppShell role="receptionist" title="Today's Queue" subtitle={`${queue.filter(q => q.status === 'waiting').length} waiting`}>
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : queue.length === 0 ? (
        <EmptyState icon={<ClipboardList className="w-8 h-8" />} title="Queue is empty" description="Generate tokens from the dashboard" />
      ) : (
        <div className="space-y-2.5 animate-fade-in">
          {queue.map((q) => (
            <Card key={q.id} hover>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  q.status === 'waiting' ? 'bg-primary-50 text-primary-700' :
                  q.status === 'completed' ? 'bg-accent-50 text-accent-700' :
                  'bg-warning-50 text-warning-700'
                }`}>
                  #{q.token_number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800">{q.patients?.full_name}</p>
                  <p className="text-xs text-neutral-400">{q.doctors?.full_name}</p>
                </div>
                <Badge variant={q.status === 'waiting' ? 'warning' : q.status === 'completed' ? 'success' : 'neutral'} dot>
                  {q.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}
