import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, ChevronRight, Mail, Phone, Shield } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../lib/auth'

export function ReceptionProfilePage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <AppShell role="receptionist" title="Profile" subtitle="Your reception account">
      <div className="space-y-5 animate-fade-in">
        <Card className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary-500 to-secondary-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
            {profile?.full_name?.charAt(0).toUpperCase() || 'R'}
          </div>
          <h2 className="text-lg font-semibold text-neutral-900">{profile?.full_name}</h2>
          <p className="text-sm text-neutral-400">{profile?.email}</p>
          <div className="flex justify-center gap-2 mt-3">
            <Badge variant="secondary" dot>Receptionist</Badge>
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-700">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-700">{profile?.phone || '—'}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          <button onClick={() => navigate('/reception/settings')} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-soft-lg transition-all">
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
