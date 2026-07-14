import { useEffect, useState } from 'react'
import { Users, Building2, FileText, ChartBar as BarChart3, Server, Shield, Activity, TrendingUp, CircleAlert as AlertCircle, Database, Cpu, HardDrive, Wifi } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

export function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ patients: 0, doctors: 0, appointments: 0, prescriptions: 0, labReports: 0, pendingLabs: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const [patRes, docRes, apptRes, prescRes, labRes, pendLabRes] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('doctors').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
        supabase.from('prescriptions').select('id', { count: 'exact', head: true }),
        supabase.from('lab_reports').select('id', { count: 'exact', head: true }),
        supabase.from('lab_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      setStats({
        patients: patRes.count || 0,
        doctors: docRes.count || 0,
        appointments: apptRes.count || 0,
        prescriptions: prescRes.count || 0,
        labReports: labRes.count || 0,
        pendingLabs: pendLabRes.count || 0,
      })
      setLoading(false)
    })()
  }, [])

  const firstName = profile?.full_name?.split(' ')[0] || 'Admin'

  return (
    <AppShell
      role="administrator"
      title={`Hello, ${firstName}`}
      subtitle="System Administration"
      headerRight={
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center text-white text-sm font-bold">
          {profile?.full_name?.charAt(0).toUpperCase() || 'A'}
        </div>
      }
    >
      <div className="space-y-5 animate-fade-in">
        {/* System Health */}
        <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-5 text-white shadow-soft-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-accent-100 font-medium">System Health</p>
              <p className="text-2xl font-bold">All Systems Operational</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-accent-100">Uptime</p>
              <p className="text-sm font-bold">99.98%</p>
            </div>
            <div>
              <p className="text-xs text-accent-100">API</p>
              <p className="text-sm font-bold flex items-center gap-1"><Wifi className="w-3 h-3" /> Online</p>
            </div>
            <div>
              <p className="text-xs text-accent-100">Database</p>
              <p className="text-sm font-bold flex items-center gap-1"><Database className="w-3 h-3" /> Healthy</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Platform Statistics</h3>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Card padding="sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-xs text-neutral-400">Patients</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{stats.patients}</p>
                <p className="text-xs text-accent-600 flex items-center gap-0.5 mt-0.5"><TrendingUp className="w-3 h-3" /> Registered</p>
              </Card>
              <Card padding="sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-secondary-600" />
                  </div>
                  <span className="text-xs text-neutral-400">Doctors</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{stats.doctors}</p>
                <p className="text-xs text-neutral-400 mt-0.5">Active</p>
              </Card>
              <Card padding="sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-accent-600" />
                  </div>
                  <span className="text-xs text-neutral-400">Appointments</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{stats.appointments}</p>
                <p className="text-xs text-neutral-400 mt-0.5">Total</p>
              </Card>
              <Card padding="sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-warning-50 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-warning-600" />
                  </div>
                  <span className="text-xs text-neutral-400">Prescriptions</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{stats.prescriptions}</p>
                <p className="text-xs text-neutral-400 mt-0.5">Issued</p>
              </Card>
              <Card padding="sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Database className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-xs text-neutral-400">Lab Reports</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{stats.labReports}</p>
                <p className="text-xs text-neutral-400 mt-0.5">Total</p>
              </Card>
              <Card padding="sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-error-50 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-error-500" />
                  </div>
                  <span className="text-xs text-neutral-400">Pending Labs</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{stats.pendingLabs}</p>
                <p className="text-xs text-warning-600 mt-0.5">Awaiting</p>
              </Card>
            </div>
          )}
        </div>

        {/* Admin Sections */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Management</h3>
          <Card padding="none">
            <div className="divide-y divide-neutral-100">
              <AdminLink icon={Users} label="User Management" description="Manage all platform users" />
              <AdminLink icon={Building2} label="Hospitals" description="Registered healthcare facilities" />
              <AdminLink icon={FileText} label="Audit Logs" description="System activity logs" />
              <AdminLink icon={BarChart3} label="Analytics" description="Platform usage analytics" />
              <AdminLink icon={Server} label="System Health" description="Infrastructure monitoring" />
              <AdminLink icon={Shield} label="Role Management" description="Manage user roles & permissions" />
            </div>
          </Card>
        </div>

        {/* System Resources */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">System Resources</h3>
          <div className="space-y-2.5">
            <Card padding="sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary-500" />
                  <span className="text-sm text-neutral-700">CPU Usage</span>
                </div>
                <span className="text-sm font-semibold text-neutral-800">34%</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: '34%' }} />
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-secondary-500" />
                  <span className="text-sm text-neutral-700">Storage</span>
                </div>
                <span className="text-sm font-semibold text-neutral-800">62%</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-secondary-500 rounded-full" style={{ width: '62%' }} />
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-accent-500" />
                  <span className="text-sm text-neutral-700">Database</span>
                </div>
                <span className="text-sm font-semibold text-neutral-800">48%</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent-500 rounded-full" style={{ width: '48%' }} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function AdminLink({ icon: Icon, label, description }: { icon: typeof Users; label: string; description: string }) {
  return (
    <button className="w-full flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors text-left">
      <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-neutral-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-neutral-700">{label}</p>
        <p className="text-xs text-neutral-400">{description}</p>
      </div>
      <Badge variant="neutral">View</Badge>
    </button>
  )
}
