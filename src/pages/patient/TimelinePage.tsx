import { useEffect, useState } from 'react'
import { Calendar, Clock, Pill, FlaskConical, Activity, FileText, Stethoscope, TrendingUp, CircleAlert as AlertCircle, UserPlus, Download, Eye } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../lib/auth'
import { api, TimelineEvent } from '../../lib/api'

const eventConfig: Record<string, { icon: typeof Calendar; color: string; bg: string }> = {
  registration: { icon: UserPlus, color: 'text-primary-600', bg: 'bg-primary-50' },
  visit: { icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50' },
  consultation: { icon: Stethoscope, color: 'text-primary-600', bg: 'bg-primary-50' },
  prescription: { icon: Pill, color: 'text-accent-600', bg: 'bg-accent-50' },
  laboratory: { icon: FlaskConical, color: 'text-secondary-600', bg: 'bg-secondary-50' },
  report: { icon: FileText, color: 'text-secondary-600', bg: 'bg-secondary-50' },
  follow_up: { icon: Clock, color: 'text-warning-600', bg: 'bg-warning-50' },
  upload: { icon: FileText, color: 'text-primary-600', bg: 'bg-primary-50' },
  notification: { icon: AlertCircle, color: 'text-neutral-600', bg: 'bg-neutral-100' },
}

export function TimelinePage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [previewEvent, setPreviewEvent] = useState<TimelineEvent | null>(null)

  const loadTimeline = async (silent = false) => {
    if (!profile?.email) return
    if (!silent && events.length === 0) setLoading(true)
    try {
      const { data } = await api.get('/patients/me/timeline')
      if (data) {
        setEvents((data as TimelineEvent[]) || [])
      }
    } catch {}
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    loadTimeline()

    // Real-time synchronization without page reload
    const interval = setInterval(() => loadTimeline(true), 8000)
    const handleFocus = () => loadTimeline(true)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [profile])

  return (
    <AppShell role="patient" title="Health Timeline" subtitle="Your complete health journey ordered Newest to Oldest">
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : events.length === 0 ? (
        <EmptyState icon={<Activity className="w-8 h-8" />} title="No timeline events" description="Your health events will appear here as you interact with the platform" />
      ) : (
        <div className="relative animate-fade-in">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-neutral-200" />

          <div className="space-y-4">
            {events.map((event) => {
              const isUpload = event.event_type === 'upload' || (event as any).eventType === 'MEDICAL_RECORD_UPLOADED'
              const isCons = event.event_type === 'consultation' || (event as any).eventType === 'CONSULTATION_CREATED'
              const isRx = event.event_type === 'prescription' || (event as any).eventType === 'PRESCRIPTION_CREATED' || (event as any).eventType === 'PRESCRIPTION_ISSUED'
              
              const config = eventConfig[event.event_type] || (isCons ? eventConfig.consultation : isRx ? eventConfig.prescription : eventConfig.notification)
              const Icon = config.icon
              const fileName = event.metadata?.fileName || event.metadata?.originalName || event.description
              const uploadedBy = event.metadata?.uploadedBy || event.doctor_name || 'Patient'
              const category = event.metadata?.category
              const meds = event.metadata?.medications

              return (
                <div key={event.id || (event as any)._id} className="relative flex gap-4">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <Card
                    className={`flex-1 ${event.metadata?.cloudinaryUrl ? 'cursor-pointer hover:border-primary-300' : ''}`}
                    hover={!!event.metadata?.cloudinaryUrl}
                    onClick={() => event.metadata?.cloudinaryUrl && setPreviewEvent(event)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-neutral-800">{isUpload ? 'Medical Record Uploaded' : event.title}</h3>
                        {category && <Badge variant="primary">{category}</Badge>}
                        {isCons && <Badge variant="success">Consultation</Badge>}
                        {isRx && <Badge variant="accent">Prescription</Badge>}
                      </div>
                      {event.status && (
                        <Badge variant={event.status === 'completed' ? 'success' : 'warning'} dot>
                          {event.status}
                        </Badge>
                      )}
                      {event.metadata?.cloudinaryUrl && (
                        <Badge variant="neutral" leftIcon={<Eye className="w-3 h-3" />}>
                          Preview
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs font-medium text-neutral-700 mb-2">
                      {isUpload ? `Document: ${fileName}` : event.description}
                    </p>

                    {meds && Array.isArray(meds) && meds.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {meds.map((m: any, idx: number) => (
                          <Badge key={idx} variant="primary">{m.name || m.medicineName} ({m.dosage})</Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.event_date || (event as any).createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {event.event_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.event_time.slice(0, 5)}
                        </span>
                      )}
                      {uploadedBy && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" />
                          By: {uploadedBy}
                        </span>
                      )}
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <Modal open={!!previewEvent} onClose={() => setPreviewEvent(null)} title={previewEvent?.metadata?.fileName || 'Document Preview'} size="lg">
        {previewEvent?.metadata?.cloudinaryUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
              <div>
                <p className="text-xs text-neutral-400">Category & Title</p>
                <p className="text-sm font-semibold text-neutral-800">{previewEvent.metadata.category || 'General'} · {previewEvent.metadata.fileName}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">Upload Date</p>
                <p className="text-sm font-medium text-neutral-800">
                  {new Date(previewEvent.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-neutral-900 flex items-center justify-center min-h-[400px]">
              {previewEvent.metadata.mimeType?.startsWith('image/') || previewEvent.metadata.cloudinaryUrl?.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                <img src={previewEvent.metadata.cloudinaryUrl} alt="Document" className="max-h-[60vh] object-contain" />
              ) : previewEvent.metadata.mimeType === 'application/pdf' || previewEvent.metadata.cloudinaryUrl?.endsWith('.pdf') ? (
                <iframe src={previewEvent.metadata.cloudinaryUrl} title="Preview" className="w-full h-[60vh] bg-white border-0" />
              ) : (
                <div className="p-8 text-center text-white space-y-3">
                  <FileText className="w-12 h-12 text-neutral-400 mx-auto" />
                  <p className="text-sm">Preview not directly viewable. Download to view.</p>
                  <Button variant="outline" onClick={() => window.open(previewEvent.metadata?.cloudinaryUrl, '_blank')} className="mt-2 text-white border-white">
                    Download File
                  </Button>
                </div>
              )}
            </div>

            <Button variant="primary" fullWidth leftIcon={<Download className="w-4 h-4" />} onClick={() => window.open(previewEvent.metadata?.cloudinaryUrl, '_blank')}>
              Download / Open Document
            </Button>
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
