import { Bell, Calendar, FlaskConical, Pill, CircleAlert as AlertCircle, Info, Trash2 } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../lib/auth'
import { supabase, Notification } from '../../lib/supabase'
import { useEffect, useState } from 'react'

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  appointment: { icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50' },
  lab: { icon: FlaskConical, color: 'text-secondary-600', bg: 'bg-secondary-50' },
  prescription: { icon: Pill, color: 'text-accent-600', bg: 'bg-accent-50' },
  alert: { icon: AlertCircle, color: 'text-error-500', bg: 'bg-error-50' },
  info: { icon: Info, color: 'text-neutral-600', bg: 'bg-neutral-100' },
  system: { icon: Info, color: 'text-neutral-600', bg: 'bg-neutral-100' },
}

export function DoctorNotificationsPage() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      if (!profile?.id) return
      const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
      setNotifications(data as Notification[] || [])
      setLoading(false)
    })()
  }, [profile])

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <AppShell role="doctor" title="Notifications" subtitle={`${notifications.filter(n => !n.is_read).length} unread`}>
      {loading ? null : notifications.length === 0 ? (
        <EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications" description="You're all caught up" />
      ) : (
        <div className="space-y-2.5 animate-fade-in">
          {notifications.map((n) => {
            const config = typeConfig[n.type] || typeConfig.info
            const Icon = config.icon
            return (
              <Card key={n.id} className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-700">{n.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-neutral-300 mt-1">{new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <button onClick={() => deleteNotif(n.id)} className="p-1.5 text-neutral-300 hover:text-error-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </Card>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
