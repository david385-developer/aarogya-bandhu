import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api, Notification } from './api'
import { useAuth } from './auth'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const pollingRef = useRef<any>(null)

  const refreshNotifications = useCallback(async () => {
    if (!profile) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications/me').catch(() => api.get('/notifications').catch(() => ({ data: [] }))),
        api.get('/notifications/me/unread-count').catch(() => api.get('/notifications/unread-count').catch(() => ({ count: 0 }))),
      ])
      const listResponse = listRes as { data?: Notification[] } | null | undefined
      const countResponse = countRes as { count?: number; data?: { count?: number } } | null | undefined
      const list = Array.isArray(listResponse?.data) ? (listResponse.data as Notification[]) : []
      setNotifications(list)

      let count = 0
      if (typeof countResponse?.count === 'number') {
        count = countResponse.count
      } else if (typeof countResponse?.data?.count === 'number') {
        count = countResponse.data.count
      } else {
        count = list.filter((n) => !n.is_read && !n.isRead).length
      }
      setUnreadCount(count)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    refreshNotifications()
    if (!profile) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }

    pollingRef.current = setInterval(() => {
      refreshNotifications()
    }, 4000)

    const handleRefreshEvent = () => {
      refreshNotifications()
    }
    window.addEventListener('notification-refresh', handleRefreshEvent)
    window.addEventListener('sync-refresh', handleRefreshEvent)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      window.removeEventListener('notification-refresh', handleRefreshEvent)
      window.removeEventListener('sync-refresh', handleRefreshEvent)
    }
  }, [profile, refreshNotifications])

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, isRead: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    await api.patch(`/notifications/${id}/read`, {}).catch(() =>
      api.patch(`/notifications/${id}`, { is_read: true })
    )
    refreshNotifications()
  }

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, isRead: true })))
    setUnreadCount(0)
    await api.patch('/notifications/me/read-all', {}).catch(() =>
      api.patch('/notifications/read-all', {})
    )
    refreshNotifications()
  }

  const deleteNotification = async (id: string) => {
    const target = notifications.find((n) => n.id === id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (target && !target.is_read && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    await api.delete(`/notifications/${id}`)
    refreshNotifications()
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
