import { useEffect, useState } from 'react'
import { FlaskConical, CircleCheck as CheckCircle2, Clock, FileText, Upload, ChevronRight, Search } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { api, LabReport, Patient } from '../../lib/api'
import { useAuth } from '../../lib/auth'

export function LabDashboard() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [reports, setReports] = useState<(LabReport & { patients: Patient })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [selectedReport, setSelectedReport] = useState<(LabReport & { patients: Patient }) | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [resultText, setResultText] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    const { data } = await api.get('/lab-reports')
    setReports(data as any || [])
    setLoading(false)
  }

  const pending = reports.filter(r => r.status === 'pending' || r.status === 'in_progress')
  const completed = reports.filter(r => r.status === 'completed' || r.status === 'verified')

  const uploadResult = async () => {
    if (!selectedReport || !resultText.trim()) {
      toast('Enter result data', 'error')
      return
    }
    const resultObj: Record<string, string> = {}
    resultText.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim())
      if (key && value) resultObj[key] = value
    })

    const { error } = await api.patch(`/lab-reports/${selectedReport.id}`, {
      result: resultObj,
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes,
    })

    if (error) {
      toast('Failed to upload result', 'error')
    } else {
      await api.post('/timeline', {
        patient_id: selectedReport.patient_id,
        event_type: 'report',
        title: 'Lab Report Available',
        description: selectedReport.test_name,
        status: 'completed',
      })
      toast('Report uploaded successfully', 'success')
      setShowUpload(false)
      setResultText('')
      setNotes('')
      setSelectedReport(null)
      fetchReports()
    }
  }

  const verifyReport = async (id: string) => {
    await api.patch(`/lab-reports/${id}`, { status: 'verified' })
    toast('Report verified', 'success')
    fetchReports()
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Lab'

  return (
    <AppShell
      role="laboratory"
      title={`Hello, ${firstName}`}
      subtitle="Laboratory Operations"
      headerRight={
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white text-sm font-bold">
          {profile?.full_name?.charAt(0).toUpperCase() || 'L'}
        </div>
      }
    >
      <div className="space-y-5 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card padding="sm" className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-warning-500" />
              <p className="text-2xl font-bold text-neutral-900">{pending.length}</p>
            </div>
            <p className="text-xs text-neutral-400">Pending Requests</p>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-accent-500" />
              <p className="text-2xl font-bold text-neutral-900">{completed.length}</p>
            </div>
            <p className="text-xs text-neutral-400">Completed Reports</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-primary-600 text-white shadow-soft' : 'bg-white text-neutral-600 border border-neutral-200'}`}
          >
            Pending ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'completed' ? 'bg-primary-600 text-white shadow-soft' : 'bg-white text-neutral-600 border border-neutral-200'}`}
          >
            Completed ({completed.length})
          </button>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : activeTab === 'pending' ? (
          pending.length === 0 ? (
            <EmptyState icon={<FlaskConical className="w-8 h-8" />} title="No pending requests" description="All lab tests are completed" />
          ) : (
            <div className="space-y-2.5 animate-fade-in">
              {pending.map((r) => (
                <Card key={r.id} hover>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
                        <FlaskConical className="w-5 h-5 text-secondary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{r.test_name}</p>
                        <p className="text-xs text-neutral-400">{r.patients?.full_name} · {r.patients?.patient_id}</p>
                      </div>
                    </div>
                    <Badge variant="warning" dot>{r.status}</Badge>
                  </div>
                  <Button size="sm" fullWidth onClick={() => { setSelectedReport(r); setShowUpload(true) }} leftIcon={<Upload className="w-3.5 h-3.5" />}>
                    Upload Result
                  </Button>
                </Card>
              ))}
            </div>
          )
        ) : (
          completed.length === 0 ? (
            <EmptyState icon={<FileText className="w-8 h-8" />} title="No completed reports" description="Completed reports will appear here" />
          ) : (
            <div className="space-y-2.5 animate-fade-in">
              {completed.map((r) => (
                <Card key={r.id} hover onClick={() => setSelectedReport(r)} className="cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-accent-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{r.test_name}</p>
                        <p className="text-xs text-neutral-400">{r.patients?.full_name} · {new Date(r.completed_at || r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={r.status === 'verified' ? 'success' : 'primary'} dot>{r.status}</Badge>
                      {r.status === 'completed' && (
                        <button onClick={(e) => { e.stopPropagation(); verifyReport(r.id) }} className="text-xs text-primary-600 font-medium hover:text-primary-700">
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                  {r.notes && <p className="text-xs text-neutral-500">{r.notes}</p>}
                </Card>
              ))}
            </div>
          )
        )}
      </div>

      {/* Upload Result Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Lab Result" size="lg">
        {selectedReport && (
          <div className="space-y-4">
            <Card padding="sm">
              <p className="text-sm font-semibold text-neutral-800">{selectedReport.test_name}</p>
              <p className="text-xs text-neutral-400">{selectedReport.patients?.full_name} · {selectedReport.patients?.patient_id}</p>
            </Card>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Test Results</label>
              <p className="text-xs text-neutral-400 mb-2">Enter one result per line (format: Key: Value)</p>
              <textarea
                className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:bg-white resize-none font-mono"
                rows={5}
                placeholder={"Hemoglobin: 14.2 g/dL\nWBC: 6.8 x10^3/μL\nPlatelets: 245 x10^3/μL"}
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Notes</label>
              <textarea
                className="w-full px-4 py-3 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:bg-white resize-none"
                rows={2}
                placeholder="Clinical interpretation"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button fullWidth size="lg" onClick={uploadResult} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Submit Result
            </Button>
          </div>
        )}
      </Modal>

      {/* Report Detail Modal */}
      <Modal open={!!selectedReport && !showUpload} onClose={() => setSelectedReport(null)} title="Lab Report" size="lg">
        {selectedReport && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-800">{selectedReport.test_name}</p>
                <p className="text-xs text-neutral-400">{selectedReport.patients?.full_name}</p>
              </div>
              <Badge variant={selectedReport.status === 'verified' ? 'success' : 'primary'} dot>{selectedReport.status}</Badge>
            </div>
            {selectedReport.result && (
              <div className="space-y-2">
                {Object.entries(selectedReport.result).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <p className="text-sm text-neutral-600 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-semibold text-neutral-800">{value}</p>
                  </div>
                ))}
              </div>
            )}
            {selectedReport.notes && (
              <div>
                <p className="text-xs text-neutral-400 mb-1">Notes</p>
                <p className="text-sm text-neutral-600">{selectedReport.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
