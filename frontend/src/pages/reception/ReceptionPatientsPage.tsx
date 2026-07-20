import { useEffect, useState } from 'react'
import { Search, ChevronRight, Users, UserPlus } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { api, Patient } from '../../lib/api'

export function ReceptionPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [filtered, setFiltered] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/patients').catch(() => ({ data: [] }))
        const list = (data as Patient[]) || []
        setPatients(list)
        setFiltered(list)
      } catch {
        // Ignore
      } finally {
        setLoading(false)
      }
    })()
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

  return (
    <AppShell role="receptionist" title="Patients" subtitle={`${patients.length} registered`}>
      <div className="mb-4">
        <Input
          placeholder="Search by name, ID, or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="No patients found" description={search ? "Try a different search" : "No patients registered"} />
      ) : (
        <div className="space-y-2.5 animate-fade-in">
          {filtered.map((p) => {
            const pName = p.full_name || (p as any).fullName || 'Patient'
            const pId = p.patient_id || (p as any).patientId || 'PT-XXXX'
            const conditions = p.chronic_diseases || (p as any).chronicDiseases || []
            return (
            <Card key={p.id} hover>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {pName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800">{pName}</p>
                  <p className="text-xs text-neutral-400">{pId} · {p.phone || 'No phone'}</p>
                </div>
                {conditions.length > 0 && <Badge variant="warning">{conditions.length} conditions</Badge>}
                <ChevronRight className="w-4 h-4 text-neutral-300" />
              </div>
            </Card>
          )})}
        </div>
      )}
    </AppShell>
  )
}
