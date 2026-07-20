import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Download, ZoomIn, ZoomOut, Maximize2, CircleAlert as AlertCircle, FileText, RotateCcw } from 'lucide-react'

export interface ReportFile {
  id?: string
  _id?: string
  fileName?: string
  file_name?: string
  originalName?: string
  original_name?: string
  cloudinaryUrl?: string
  cloudinary_url?: string
  mimeType?: string
  mime_type?: string
  category?: string
  uploadedAt?: string
  uploaded_at?: string
  uploadedBy?: string
  uploaded_by?: string
  [key: string]: any
}

interface ReportViewerModalProps {
  open: boolean
  onClose: () => void
  file: ReportFile | null
}

export function ReportViewerModal({ open, onClose, file }: ReportViewerModalProps) {
  const [zoom, setZoom] = useState<number>(1)
  const [hasError, setHasError] = useState<boolean>(false)
  const [retryKey, setRetryKey] = useState<number>(0)

  useEffect(() => {
    if (open && file) {
      setZoom(1)
      setHasError(false)
    }
  }, [open, file, retryKey])

  if (!open || !file) return null

  const url = file.cloudinaryUrl || file.cloudinary_url || ''
  const fileName = file.fileName || file.file_name || file.originalName || file.original_name || 'Medical Report'
  const mimeType = (file.mimeType || file.mime_type || '').toLowerCase()
  const category = file.category || 'General'
  const uploadDate = file.uploadedAt || file.uploaded_at
    ? new Date(file.uploadedAt || file.uploaded_at!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Recent'

  const isPdf = mimeType === 'application/pdf' || url.toLowerCase().includes('.pdf')
  const isImage = mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(url)

  const handleRetry = () => {
    setHasError(false)
    setRetryKey(k => k + 1)
  }

  const isUrlInvalid = !url || !url.startsWith('http')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={fileName}
      subtitle={`Category: ${category} · Uploaded on ${uploadDate}`}
      size="full"
    >
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
          <div className="flex items-center gap-2">
            <Badge variant="primary">{isPdf ? 'PDF Report' : isImage ? 'Image Report' : 'Document'}</Badge>
            <span className="text-xs text-neutral-500 font-medium truncate max-w-xs">{fileName}</span>
          </div>

          <div className="flex items-center gap-2">
            {isImage && !hasError && !isUrlInvalid && (
              <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-xl px-2 py-1 shadow-2xs">
                <button
                  onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-neutral-700 min-w-[3.5rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-600 ml-1 transition-colors"
                  title="Fit to Screen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {isPdf && !hasError && !isUrlInvalid && (
              <span className="text-xs text-neutral-500 hidden sm:inline">Use built-in viewer controls to zoom & scroll</span>
            )}

            {url && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => window.open(url, '_blank')}
              >
                Download
              </Button>
            )}
          </div>
        </div>

        {/* Viewer Content Area */}
        <div key={retryKey} className="border border-neutral-200 rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center min-h-[65vh] max-h-[78vh] relative">
          {isUrlInvalid || hasError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white w-full h-[65vh]">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <h4 className="text-base font-semibold text-neutral-800">Unable to load medical report.</h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-md">
                {isUrlInvalid
                  ? 'The Cloudinary URL for this document is invalid or missing.'
                  : 'There was a problem rendering this file directly inside the browser viewer.'}
              </p>
              <div className="flex items-center gap-3 mt-6">
                <Button variant="outline" size="sm" leftIcon={<RotateCcw className="w-3.5 h-3.5" />} onClick={handleRetry}>
                  Retry
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : isImage ? (
            <div className="w-full h-[65vh] max-h-[78vh] overflow-auto flex items-center justify-center p-4">
              <img
                src={url}
                alt={fileName}
                onError={() => setHasError(true)}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
                className="max-h-full max-w-full object-contain select-none"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={url}
              title={fileName}
              onError={() => setHasError(true)}
              className="w-full h-[65vh] max-h-[78vh] border-0 bg-white"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white w-full h-[65vh]">
              <FileText className="w-12 h-12 text-neutral-400 mb-3" />
              <h4 className="text-base font-semibold text-neutral-800">{fileName}</h4>
              <p className="text-xs text-neutral-500 mt-1">
                This document format ({mimeType || 'unknown'}) cannot be previewed directly inside the browser.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-6"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => window.open(url, '_blank')}
              >
                Download Report
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
