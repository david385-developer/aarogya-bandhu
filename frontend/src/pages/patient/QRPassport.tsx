import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Phone, Droplet, CircleAlert as AlertCircle, Activity } from 'lucide-react'
import { Patient, api } from '../../lib/api'

interface QRPassportProps {
  patient: Patient
  onClose: () => void
}

export function QRPassport({ patient, onClose }: QRPassportProps) {
  const [passportToken, setPassportToken] = useState<string>('')
  const [encryptedId, setEncryptedId] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    (async () => {
      const res = await api.get('/passport/my-qr')
      if (res.data?.passport) {
        setPassportToken(res.data.passport.passportToken)
        setEncryptedId(res.data.passport.qrPayload?.checksum || '')
      } else {
        setPassportToken(patient.patient_id)
      }
      setLoading(false)
    })()
  }, [patient])

  const age = patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : '—'

  // STRICT REQUIREMENT: Patient QR MUST NOT contain medical records.
  // QR should contain ONLY passportToken or encryptedPatientIdentifier
  const qrValue = JSON.stringify({
    passportToken: passportToken || patient.patient_id,
    ...(encryptedId ? { encryptedPatientIdentifier: encryptedId } : {}),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-slide-up">
        <button onClick={onClose} className="absolute -top-12 right-0 text-white p-2">
          <X className="w-6 h-6" />
        </button>

        {/* Health Card */}
        <div className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 rounded-3xl p-6 shadow-soft-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-secondary-400/10 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500/20 rounded-full translate-y-12 -translate-x-12" />

          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-secondary-300" />
                <span className="text-sm font-semibold tracking-wide">AROGYA BANDHU</span>
              </div>
              <span className="text-xs text-primary-200">Health Passport</span>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-5">
              <div className="bg-white p-4 rounded-2xl flex items-center justify-center min-w-[192px] min-h-[192px]">
                {loading ? (
                  <div className="animate-spin h-8 w-8 border-3 border-primary-200 border-t-primary-600 rounded-full" />
                ) : (
                  <QRCodeSVG value={qrValue} size={160} level="H" />
                )}
              </div>
            </div>

            {/* Patient Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <div>
                  <p className="text-xs text-primary-200">Patient</p>
                  <p className="text-base font-semibold">{patient.full_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-primary-200">Patient ID</p>
                  <p className="text-sm font-mono font-semibold">{patient.patient_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-primary-200 flex items-center gap-1"><Droplet className="w-3 h-3" /> Blood</p>
                  <p className="text-sm font-bold">{patient.blood_group || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-200">Age</p>
                  <p className="text-sm font-bold">{age}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-200">Gender</p>
                  <p className="text-sm font-bold capitalize">{patient.gender || '—'}</p>
                </div>
              </div>

              {patient.allergies && patient.allergies.length > 0 && (
                <div className="pt-3 border-t border-white/15">
                  <p className="text-xs text-error-300 flex items-center gap-1 mb-1">
                    <AlertCircle className="w-3 h-3" /> Allergies
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {patient.allergies.map((a, i) => (
                      <span key={i} className="text-xs bg-error-500/20 text-error-200 px-2 py-0.5 rounded-md">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {patient.emergency_contact_name && (
                <div className="pt-3 border-t border-white/15">
                  <p className="text-xs text-primary-200 flex items-center gap-1 mb-1">
                    <Phone className="w-3 h-3" /> Emergency Contact
                  </p>
                  <p className="text-sm font-medium">{patient.emergency_contact_name}</p>
                  <p className="text-xs text-primary-200">{patient.emergency_contact_phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-4">
          Show this QR code to healthcare providers for secure token-based longitudinal record access
        </p>
      </div>
    </div>
  )
}
