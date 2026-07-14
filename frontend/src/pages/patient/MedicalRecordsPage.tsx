import { useEffect, useState } from 'react'
import { FileText, Pill, FlaskConical, Download, ChevronRight } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../lib/auth'
import { supabase, Prescription, LabReport } from '../../lib/supabase'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'

export function MedicalRecordsPage() {
  const { profile } = useAuth()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [labReports, setLabReports] = useState<LabReport[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'reports'>('prescriptions')
  const [selectedPresc, setSelectedPresc] = useState<Prescription | null>(null)
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null)

  useEffect(() => {
    (async () => {
      if (!profile?.email) return
      const { data: pat } = await supabase.from('patients').select('id').eq('email', profile.email).maybeSingle()
      if (!pat) { setLoading(false); return }
      const [prescRes, labRes] = await Promise.all([
        supabase.from('prescriptions').select('*, doctors(*)').eq('patient_id', pat.id).order('created_at', { ascending: false }),
        supabase.from('lab_reports').select('*').eq('patient_id', pat.id).order('created_at', { ascending: false }),
      ])
      setPrescriptions(prescRes.data as Prescription[] || [])
      setLabReports(labRes.data as LabReport[] || [])
      setLoading(false)
    })()
  }, [profile])

  return (
    <AppShell role="patient" title="Medical Records" subtitle="Prescriptions and lab reports">
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'prescriptions' ? 'bg-primary-600 text-white shadow-soft' : 'bg-white text-neutral-600 border border-neutral-200'}`}
        >
          Prescriptions ({prescriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'reports' ? 'bg-primary-600 text-white shadow-soft' : 'bg-white text-neutral-600 border border-neutral-200'}`}
        >
          Lab Reports ({labReports.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : activeTab === 'prescriptions' ? (
        prescriptions.length === 0 ? (
          <EmptyState icon={<Pill className="w-8 h-8" />} title="No prescriptions yet" description="Your prescriptions will appear here" />
        ) : (
          <div className="space-y-3 animate-fade-in">
            {prescriptions.map((p) => (
              <Card key={p.id} hover onClick={() => setSelectedPresc(p)} className="cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-accent-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{p.diagnosis}</p>
                      <p className="text-xs text-neutral-400">{(p as any).doctors?.full_name || 'Doctor'} · {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.medications.slice(0, 3).map((m, i) => (
                    <Badge key={i} variant="neutral">{m.name}</Badge>
                  ))}
                  {p.medications.length > 3 && <Badge variant="neutral">+{p.medications.length - 3} more</Badge>}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        labReports.length === 0 ? (
          <EmptyState icon={<FlaskConical className="w-8 h-8" />} title="No lab reports yet" description="Your lab reports will appear here" />
        ) : (
          <div className="space-y-3 animate-fade-in">
            {labReports.map((r) => (
              <Card key={r.id} hover onClick={() => setSelectedReport(r)} className="cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
                      <FlaskConical className="w-5 h-5 text-secondary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{r.test_name}</p>
                      <p className="text-xs text-neutral-400">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <Badge variant={r.status === 'completed' ? 'success' : r.status === 'pending' ? 'warning' : 'neutral'} dot>
                    {r.status}
                  </Badge>
                </div>
                {r.notes && <p className="text-xs text-neutral-500 mt-1">{r.notes}</p>}
              </Card>
            ))}
          </div>
        )
      )}

      {/* Prescription Detail Modal */}
      <Modal open={!!selectedPresc} onClose={() => setSelectedPresc(null)} title="Prescription Details" size="lg">
        {selectedPresc && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-neutral-400 mb-1">Diagnosis</p>
              <p className="text-sm font-medium text-neutral-800">{selectedPresc.diagnosis}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-2">Medications</p>
              <div className="space-y-2">
                {selectedPresc.medications.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-neutral-700">{m.name}</p>
                      <p className="text-xs text-neutral-400">{m.dosage} · {m.frequency}</p>
                    </div>
                    <Badge variant="neutral">{m.duration}</Badge>
                  </div>
                ))}
              </div>
            </div>
            {selectedPresc.notes && (
              <div>
                <p className="text-xs text-neutral-400 mb-1">Notes</p>
                <p className="text-sm text-neutral-600">{selectedPresc.notes}</p>
              </div>
            )}
            {selectedPresc.follow_up_date && (
              <div className="flex items-center gap-2 p-3 bg-warning-50 rounded-xl">
                <p className="text-xs text-warning-700">Follow-up: {new Date(selectedPresc.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            )}
            <Button variant="outline" fullWidth leftIcon={<Download className="w-4 h-4" />}>Download Prescription</Button>
          </div>
        )}
      </Modal>

      {/* Lab Report Detail Modal */}
      <Modal open={!!selectedReport} onClose={() => setSelectedReport(null)} title="Lab Report" size="lg">
        {selectedReport && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-800">{selectedReport.test_name}</p>
                <p className="text-xs text-neutral-400">{new Date(selectedReport.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <Badge variant={selectedReport.status === 'completed' ? 'success' : 'warning'} dot>{selectedReport.status}</Badge>
            </div>
            {selectedReport.result && (
              <div>
                <p className="text-xs text-neutral-400 mb-2">Results</p>
                <div className="space-y-2">
                  {Object.entries(selectedReport.result).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                      <p className="text-sm text-neutral-600 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-semibold text-neutral-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedReport.notes && (
              <div>
                <p className="text-xs text-neutral-400 mb-1">Notes</p>
                <p className="text-sm text-neutral-600">{selectedReport.notes}</p>
              </div>
            )}
            {selectedReport.status === 'completed' && (
              <Button variant="outline" fullWidth leftIcon={<Download className="w-4 h-4" />}>Download Report</Button>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
