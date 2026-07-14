import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, QrCode, ChevronRight, Mail, Phone, MapPin, Heart, Droplet, CircleAlert as AlertCircle, Pill, Calendar, Shield } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../lib/auth'
import { supabase, Patient } from '../../lib/supabase'
import { QRPassport } from './QRPassport'

export function ProfilePage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    (async () => {
      if (!profile?.email) return
      const { data } = await supabase.from('patients').select('*').eq('email', profile.email).maybeSingle()
      if (data) setPatient(data as Patient)
    })()
  }, [profile])

  const age = patient?.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : null

  return (
    <>
      <AppShell role="patient" title="Profile" subtitle="Your account and health info">
        <div className="space-y-5 animate-fade-in">
          {/* Profile Header */}
          <Card className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {profile?.full_name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">{profile?.full_name}</h2>
            <p className="text-sm text-neutral-400">{profile?.email}</p>
            <div className="flex justify-center gap-2 mt-3">
              <Badge variant="primary" dot>Patient</Badge>
              {patient && <Badge variant="success">{patient.patient_id}</Badge>}
            </div>
          </Card>

          {/* Health Info */}
          {patient && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 mb-3">Health Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Card padding="sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplet className="w-4 h-4 text-error-500" />
                      <span className="text-xs text-neutral-400">Blood Group</span>
                    </div>
                    <p className="text-lg font-bold text-neutral-800">{patient.blood_group || '—'}</p>
                  </Card>
                  <Card padding="sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-primary-500" />
                      <span className="text-xs text-neutral-400">Age</span>
                    </div>
                    <p className="text-lg font-bold text-neutral-800">{age} <span className="text-sm font-normal text-neutral-400">years</span></p>
                  </Card>
                  <Card padding="sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="w-4 h-4 text-accent-500" />
                      <span className="text-xs text-neutral-400">Gender</span>
                    </div>
                    <p className="text-sm font-bold text-neutral-800 capitalize">{patient.gender || '—'}</p>
                  </Card>
                  <Card padding="sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-secondary-500" />
                      <span className="text-xs text-neutral-400">Status</span>
                    </div>
                    <p className="text-sm font-bold text-accent-600">Active</p>
                  </Card>
                </div>
              </div>

              {/* Allergies */}
              {patient.allergies.length > 0 && (
                <Card>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-error-500" />
                    <h3 className="text-sm font-semibold text-neutral-700">Allergies</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((a, i) => (
                      <Badge key={i} variant="error">{a}</Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Chronic Diseases */}
              {patient.chronic_diseases.length > 0 && (
                <Card>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-warning-500" />
                    <h3 className="text-sm font-semibold text-neutral-700">Chronic Conditions</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {patient.chronic_diseases.map((d, i) => (
                      <Badge key={i} variant="warning">{d}</Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Current Medications */}
              {patient.current_medications.length > 0 && (
                <Card>
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="w-4 h-4 text-accent-500" />
                    <h3 className="text-sm font-semibold text-neutral-700">Current Medications</h3>
                  </div>
                  <div className="space-y-2">
                    {patient.current_medications.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-700">{m}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Emergency Contact */}
              {patient.emergency_contact_name && (
                <Card>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-primary-500" />
                    <h3 className="text-sm font-semibold text-neutral-700">Emergency Contact</h3>
                  </div>
                  <p className="text-sm text-neutral-700 font-medium">{patient.emergency_contact_name}</p>
                  <p className="text-sm text-neutral-400">{patient.emergency_contact_phone}</p>
                </Card>
              )}
            </>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button onClick={() => setShowQR(true)} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-soft-lg transition-all">
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-neutral-700">QR Health Passport</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300" />
            </button>
            <button onClick={() => navigate('/patient/settings')} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-100 shadow-card hover:shadow-soft-lg transition-all">
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

      {showQR && patient && <QRPassport patient={patient} onClose={() => setShowQR(false)} />}
    </>
  )
}
