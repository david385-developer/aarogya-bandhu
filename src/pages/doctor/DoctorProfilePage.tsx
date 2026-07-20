import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, Mail, Phone, Stethoscope, ChevronRight, Shield } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../lib/auth'
import { useEffect, useState } from 'react'
import { api, Doctor } from '../../lib/api'

export function DoctorProfilePage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState<Doctor | null>(null)

  useEffect(() => {
    (async () => {
      if (!profile?.email) return
      const { data } = await api.get(`/doctors/by-email/${encodeURIComponent(profile.email)}`)
      if (data) setDoctor(data as Doctor)
    })()
  }, [profile])

  return (
    <AppShell role="doctor" title="Profile" subtitle="Your professional account">
      <div className="space-y-5 animate-fade-in">
        <Card className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
            {profile?.full_name?.replace('Dr. ', '').charAt(0).toUpperCase() || 'D'}
          </div>
          <h2 className="text-lg font-semibold text-neutral-900">{profile?.full_name}</h2>
          <p className="text-sm text-neutral-400">{profile?.email}</p>
          <div className="flex justify-center gap-2 mt-3">
            <Badge variant="primary" dot>Doctor</Badge>
            {doctor && <Badge variant="secondary">{doctor.specialization}</Badge>}
          </div>
        </Card>

        {doctor && (
          <Card>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-700">{doctor.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-700">{doctor.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Stethoscope className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-700">{doctor.specialization}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-700">{doctor.doctor_id}</span>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          <button onClick={() => navigate('/doctor/settings')} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-soft-lg transition-all">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
          </button>
          <button onClick={signOut} className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-error-100 shadow-card hover:bg-error-50 transition-all">
            <LogOut className="w-5 h-5 text-error-500" />
            <span className="text-sm font-medium text-error-600">Sign Out</span>
          </button>
        </div>
      </div>
    </AppShell>
  )
}
