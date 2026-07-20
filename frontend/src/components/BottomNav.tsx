import { useLocation, useNavigate } from 'react-router-dom'
import { Chrome as Home, Clock, FileText, Bell, User, LayoutDashboard, Users, Stethoscope, ClipboardList, FlaskConical, ChartBar as BarChart3, Settings, CalendarDays } from 'lucide-react'
import { UserRole } from '../lib/api'
import { useNotifications } from '../lib/notifications'

interface NavItem {
  label: string
  icon: typeof Home
  path: string
}

const navConfig: Record<UserRole, NavItem[]> = {
  patient: [
    { label: 'Home', icon: Home, path: '/patient' },
    { label: 'Timeline', icon: Clock, path: '/patient/timeline' },
    { label: 'Records', icon: FileText, path: '/patient/records' },
    { label: 'Alerts', icon: Bell, path: '/patient/notifications' },
    { label: 'Profile', icon: User, path: '/patient/profile' },
  ],
  doctor: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/doctor' },
    { label: 'Patients', icon: Users, path: '/doctor/patients' },
    { label: 'Workspace', icon: Stethoscope, path: '/doctor/workspace' },
    { label: 'Alerts', icon: Bell, path: '/doctor/notifications' },
    { label: 'Profile', icon: User, path: '/doctor/profile' },
  ],
  receptionist: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/reception' },
    { label: 'Patients', icon: Users, path: '/reception/patients' },
    { label: 'Queue', icon: ClipboardList, path: '/reception/queue' },
    { label: 'Appts', icon: CalendarDays, path: '/reception/appointments' },
    { label: 'Profile', icon: User, path: '/reception/profile' },
  ],
  laboratory: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/lab' },
    { label: 'Requests', icon: ClipboardList, path: '/lab/requests' },
    { label: 'Reports', icon: FileText, path: '/lab/reports' },
    { label: 'Profile', icon: User, path: '/lab/profile' },
  ],
  administrator: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
  ],
}

export function BottomNav({ role }: { role: UserRole }) {
  const location = useLocation()
  const navigate = useNavigate()
  const items = navConfig[role]
  let unreadCount = 0
  try {
    const notif = useNotifications()
    unreadCount = notif.unreadCount || 0
  } catch {
    // fallback if outside provider
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-neutral-100 safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== `/${role}` && location.pathname.startsWith(item.path))
          const isExactActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 min-w-[56px] ${
                isExactActive || (isActive && item.path !== `/${role}`)
                  ? 'text-primary-600'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${isExactActive ? 'scale-110' : ''}`}
                  strokeWidth={isExactActive ? 2.5 : 2}
                />
                {item.label === 'Alerts' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 bg-error-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isExactActive ? 'font-semibold' : ''}`}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
