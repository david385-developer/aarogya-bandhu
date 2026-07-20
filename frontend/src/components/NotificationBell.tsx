import { useState } from 'react'
import { Bell, CheckCheck, Trash2, Calendar, FlaskConical, Pill, Info, CircleAlert as AlertCircle, Stethoscope, FileText, Ticket } from 'lucide-react'
import { useNotifications } from '../lib/notifications'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { EmptyState } from './ui/EmptyState'

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  appointment: { icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50' },
  lab: { icon: FlaskConical, color: 'text-secondary-600', bg: 'bg-secondary-50' },
  lab_report: { icon: FlaskConical, color: 'text-secondary-600', bg: 'bg-secondary-50' },
  prescription: { icon: Pill, color: 'text-accent-600', bg: 'bg-accent-50' },
  queue_token: { icon: Ticket, color: 'text-primary-600', bg: 'bg-primary-50' },
  check_in: { icon: Ticket, color: 'text-primary-600', bg: 'bg-primary-50' },
  doctor_assigned: { icon: Stethoscope, color: 'text-secondary-600', bg: 'bg-secondary-50' },
  CONSULTATION_CREATED: { icon: Stethoscope, color: 'text-primary-600', bg: 'bg-primary-50' },
  MEDICAL_RECORD_UPLOADED: { icon: FileText, color: 'text-accent-600', bg: 'bg-accent-50' },
  alert: { icon: AlertCircle, color: 'text-error-500', bg: 'bg-error-50' },
  info: { icon: Info, color: 'text-neutral-600', bg: 'bg-neutral-100' },
  system: { icon: Info, color: 'text-neutral-600', bg: 'bg-neutral-100' },
}

export function NotificationBell({ className = '' }: { className?: string }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2 rounded-xl text-neutral-600 hover:text-primary-600 hover:bg-neutral-100/80 transition-all duration-200 ${className}`}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-error-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse border-2 border-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Notifications"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
          <span className="text-xs font-semibold text-neutral-500">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-8 h-8 text-neutral-300" />}
            title="No notifications"
            description="You're all caught up! New alerts and workflow updates will appear here."
          />
        ) : (
          <div className="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
            {notifications.map((n) => {
              const config = typeConfig[n.type] || typeConfig.info
              const Icon = config.icon
              const isUnread = !n.is_read && !n.isRead

              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isUnread
                      ? 'bg-primary-50/40 border-primary-200 shadow-soft'
                      : 'bg-white border-neutral-100 hover:border-neutral-200'
                  }`}
                  onClick={() => {
                    if (isUnread) markAsRead(n.id)
                  }}
                >
                  <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${isUnread ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'}`}>
                        {n.title}
                      </p>
                      {isUnread && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-neutral-400 mt-1.5">
                      {new Date(n.created_at || n.createdAt || Date.now()).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(n.id)
                    }}
                    className="p-1.5 text-neutral-300 hover:text-error-500 rounded-lg hover:bg-neutral-50 transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </>
  )
}
