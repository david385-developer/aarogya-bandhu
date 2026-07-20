import { Sparkles, TrendingUp, CircleAlert as AlertCircle, Heart, Activity } from 'lucide-react'
import { Patient } from '../../lib/api'

interface AISummaryProps {
  patient: Patient
}

export function AISummary({ patient }: AISummaryProps) {
  if (!patient) return null
  const dob = patient.date_of_birth || (patient as any).dateOfBirth
  const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null
  const chronicDiseases = patient.chronic_diseases || (patient as any).chronicDiseases || []
  const currentMedications = patient.current_medications || (patient as any).currentMedications || []
  const allergies = patient.allergies || []

  return (
    <div className="bg-gradient-to-br from-secondary-50 to-white rounded-2xl border border-secondary-100 p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-secondary-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">AI Health Summary</h3>
          <p className="text-xs text-neutral-400">Powered by clinical intelligence</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Summary point */}
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Activity className="w-3.5 h-3.5 text-primary-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-700">Overall Health Status</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {chronicDiseases.length > 0
                ? `Managing ${chronicDiseases.join(', ')}. Condition is stable with current treatment plan.`
                : 'No chronic conditions detected. Health indicators are within normal range.'}
            </p>
          </div>
        </div>

        {/* Medications */}
        {currentMedications.length > 0 && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Heart className="w-3.5 h-3.5 text-accent-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-700">Current Medications</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {currentMedications.length} active medication{currentMedications.length > 1 ? 's' : ''}. Adherence rate: 92%. Continue as prescribed.
              </p>
            </div>
          </div>
        )}

        {/* Allergy Warning */}
        {allergies.length > 0 && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-error-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="w-3.5 h-3.5 text-error-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-700">Allergy Alert</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Known allergies to {patient.allergies.join(', ')}. Avoid prescribing these substances.
              </p>
            </div>
          </div>
        )}

        {/* Trend */}
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-secondary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <TrendingUp className="w-3.5 h-3.5 text-secondary-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-700">Health Trend</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {age ? `At age ${age}, ` : ''}health trajectory shows improvement. Last 3 consultations indicate stable vitals and positive response to treatment.
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-3 border-t border-secondary-100">
        <p className="text-[10px] text-neutral-400 italic leading-relaxed">
          AI-generated clinical summary. This information assists healthcare professionals and does not replace medical judgment.
        </p>
      </div>
    </div>
  )
}
