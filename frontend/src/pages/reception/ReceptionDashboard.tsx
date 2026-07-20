import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, ClipboardList, Calendar, ChevronRight, Users, QrCode, Ticket } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { api, Patient, Doctor, QueueToken, emitSyncRefresh, emitNotificationRefresh } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { NotificationBell } from '../../components/NotificationBell'

export function ReceptionDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [filtered, setFiltered] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [queue, setQueue] = useState<(QueueToken & { patients: Patient; doctors: Doctor })[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [assignDoctor, setAssignDoctor] = useState<string>('')
  const [showAssign, setShowAssign] = useState(false)

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [patRes, docRes, qRes] = await Promise.all([
        api.get('/patients').catch(() => ({ data: [] })),
        api.get('/doctors').catch(() => ({ data: [] })),
        api.get('/queue?status=waiting').catch(() => ({ data: [] })),
      ])
      const pats = (patRes?.data as Patient[]) || []
      setPatients(pats)
      setFiltered(pats)
      setDoctors((docRes?.data as Doctor[]) || [])
      setQueue((qRes?.data as any) || [])
    } catch {
      // Ignore
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(() => loadData(true), 4000)
    const handleSync = () => loadData(true)
    window.addEventListener('sync-refresh', handleSync)
    return () => {
      clearInterval(interval)
      window.removeEventListener('sync-refresh', handleSync)
    }
  }, [])

  useEffect(() => {
    const q = (search || '').toLowerCase()
    setFiltered((patients || []).filter(p => {
      if (!p) return false
      const name = (p.full_name || (p as any).fullName || '').toLowerCase()
      const id = (p.patient_id || (p as any).patientId || '').toLowerCase()
      const phone = (p.phone || '').toLowerCase()
      return name.includes(q) || id.includes(q) || phone.includes(q)
    }))
  }, [search, patients])

  const generateToken = async () => {
    if (!selectedPatient || !assignDoctor) {
      toast('Select a doctor first', 'error')
      return
    }
    const maxToken = queue.length > 0 ? Math.max(...queue.map(q => q.token_number)) : 0
    const patientId = selectedPatient.id || (selectedPatient as any)._id || (selectedPatient as any).patientId
    const doctorId = assignDoctor
    const { error, message } = await api.post('/queue', {
      patient_id: patientId,
      doctor_id: doctorId,
      token_number: maxToken + 1,
      status: 'waiting',
    })

    if (error) {
      toast(message || error || 'Failed to generate token', 'error')
    } else {
      toast(`Token #${maxToken + 1} generated for ${selectedPatient.full_name}`, 'success')
      setShowAssign(false)
      setAssignDoctor('')
      emitNotificationRefresh()
      emitSyncRefresh()
      const { data } = await api.get('/queue?status=waiting')
      setQueue(data as any || [])
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Reception'

  return (
    <AppShell
      role="receptionist"
      title={`Hello, ${firstName}`}
      subtitle="Front desk operations"
      headerRight={
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white text-sm font-bold">
          {profile?.full_name?.charAt(0).toUpperCase() || 'R'}
        </div>
      }
    >
      <div className="space-y-5 animate-fade-in">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/reception/patients')} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-soft-lg transition-all">
            <UserPlus className="w-6 h-6 text-primary-600" />
            <span className="text-xs font-medium text-neutral-700">Search Patient</span>
          </button>
          <button onClick={() => navigate('/reception/queue')} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-soft-lg transition-all">
            <ClipboardList className="w-6 h-6 text-secondary-600" />
            <span className="text-xs font-medium text-neutral-700">Today's Queue</span>
          </button>
        </div>

        {/* Search */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Find Patient</h3>
          <Input
            placeholder="Search by name, ID, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Patient Results */}
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users className="w-8 h-8" />} title="No patients found" description={search ? "Try a different search" : "No patients registered"} />
        ) : (
          <div className="space-y-2.5">
            {filtered.slice(0, 5).map((p) => {
              const pName = p.full_name || (p as any).fullName || 'Patient'
              const pId = p.patient_id || (p as any).patientId || 'PT-XXXX'
              return (
              <Card key={p.id} hover onClick={() => { setSelectedPatient(p); setShowAssign(true) }} className="cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {pName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-800">{pName}</p>
                    <p className="text-xs text-neutral-400">{pId} · {p.phone || 'No phone'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                </div>
              </Card>
            )})}
          </div>
        )}

        {/* Today's Queue */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-700">Today's Queue</h3>
            <Badge variant="primary">{queue.length} waiting</Badge>
          </div>
          {queue.length === 0 ? (
            <Card><p className="text-sm text-neutral-400 text-center py-4">Queue is empty</p></Card>
          ) : (
            <div className="space-y-2.5">
              {queue.map((q) => {
                const patName = q.patients?.full_name || (q.patients as any)?.fullName || 'Patient'
                const docName = q.doctors?.full_name || (q.doctors as any)?.fullName || 'Doctor'
                return (
                <Card key={q.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                    #{q.token_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-800">{patName}</p>
                    <p className="text-xs text-neutral-400">{docName}</p>
                  </div>
                  <Badge variant="warning" dot>Waiting</Badge>
                </Card>
              )})}
            </div>
          )}
        </div>
      </div>

      {/* Assign Doctor Modal */}
      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="Assign Doctor & Generate Token">
        {selectedPatient && (
          <div className="space-y-4">
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                  {(selectedPatient.full_name || (selectedPatient as any).fullName || 'P').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-800">{selectedPatient.full_name || (selectedPatient as any).fullName || 'Patient'}</p>
                  <p className="text-xs text-neutral-400">{selectedPatient.patient_id || (selectedPatient as any).patientId || 'PT-XXXX'}</p>
                </div>
              </div>
            </Card>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Select Doctor</label>
              <div className="space-y-2">
                {doctors.map((d) => {
                  const docName = d.full_name || (d as any).fullName || 'Doctor'
                  return (
                  <button
                    key={d.id}
                    onClick={() => setAssignDoctor(d.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${assignDoctor === d.id ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100' : 'border-neutral-200 hover:bg-neutral-50'}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-bold text-sm">
                      {(docName.replace('Dr. ', '').charAt(0) || 'D').toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-neutral-700">{docName}</p>
                      <p className="text-xs text-neutral-400">{d.specialization}</p>
                    </div>
                  </button>
                )})}
              </div>
            </div>

            <Button fullWidth size="lg" onClick={generateToken} leftIcon={<Ticket className="w-4 h-4" />}>
              Generate Queue Token
            </Button>
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
