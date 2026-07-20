import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { UserRole } from '../../lib/api'

const roleRoutes: Record<string, string> = {
  patient: '/patient',
  doctor: '/doctor',
  receptionist: '/reception',
  laboratory: '/lab',
  administrator: '/admin',
}

export function RoleRedirect() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin h-8 w-8 border-3 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    )
  }

  if (!profile) return <Navigate to="/login" replace />

  const roleKey = (profile.role || '').toLowerCase()
  const target = roleRoutes[roleKey] || (profile as any).redirectTo || (roleKey === 'patient' ? '/patient' : roleKey === 'receptionist' ? '/reception' : roleKey === 'doctor' ? '/doctor' : roleKey === 'laboratory' ? '/lab' : roleKey === 'administrator' ? '/admin' : '/login')

  return <Navigate to={target} replace />
}
