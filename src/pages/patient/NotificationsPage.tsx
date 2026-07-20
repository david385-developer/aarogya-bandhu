import { useEffect, useState } from 'react'
import { Bell, Calendar, FlaskConical, Pill, CircleAlert as AlertCircle, Info, Trash2 } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../lib/auth'
import { api, Notification, emitNotificationRefresh, emitSyncRefresh } from '../../lib/api'

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  appointment: { icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50' },
  lab: { icon: FlaskConical, color: 'text-secondary-600', bg: 'bg-secondary-50' },
  prescription: { icon: Pill, color: 'text-accent-600', bg: 'bg-accent-50' },
  alert: { icon: AlertCircle, color: 'text-error-500', bg: 'bg-error-50' },
  info: { icon: Info, color: 'text-neutral-600', bg: 'bg-neutral-100' },
  system: { icon: Info, color: 'text-neutral-600', bg: 'bg-neutral-100' },
}

export function NotificationsPage() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      if (!profile?.id) return
      const { data } = await api.get('/notifications')
      setNotifications(data as Notification[] || [])
      setLoading(false)
    })()
  }, [profile])

  const markAsRead = async (id: string) => {
    await api.patch(`/notifications/${id}`, { is_read: true })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    emitNotificationRefresh()
  }

  const deleteNotif = async (id: string) => {
    await api.delete(`/notifications/${id}`)
    setNotifications(prev => prev.filter(n => n.id !== id))
    emitNotificationRefresh()
    emitSyncRefresh()
  }

  return (
    <AppShell role="patient" title="Notifications" subtitle={`${notifications.filter(n => !n.is_read).length} unread`}>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications" description="You're all caught up. New notifications will appear here." />
      ) : (
        <div className="space-y-2.5 animate-fade-in">
          {notifications.map((n) => {
            const config = typeConfig[n.type] || typeConfig.info
            const Icon = config.icon
            return (
              <Card key={n.id} hover className={`flex items-start gap-3 ${!n.is_read ? 'border-primary-200 bg-primary-50/30' : ''}`}>
                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0" onClick={() => !n.is_read && markAsRead(n.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-neutral-800' : 'font-medium text-neutral-600'}`}>{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-neutral-300 mt-1">{new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <button onClick={() => deleteNotif(n.id)} className="p-1.5 text-neutral-300 hover:text-error-500 transition-colors">
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
