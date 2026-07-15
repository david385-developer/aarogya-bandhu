import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type UserRole = 'patient' | 'doctor' | 'receptionist' | 'laboratory' | 'administrator'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone: string | null
  avatar_url: string | null
  created_at: string
}

export interface Patient {
  id: string
  patient_id: string
  full_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  date_of_birth: string | null
  gender: string | null
  blood_group: string | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  allergies: string[]
  chronic_diseases: string[]
  current_medications: string[]
  photo_url: string | null
}

export interface Doctor {
  id: string
  doctor_id: string
  full_name: string
  email: string | null
  phone: string | null
  specialization: string | null
  avatar_url: string | null
  department: string | null
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  status: string
  reason: string | null
  token_number: number | null
}

export interface Prescription {
  id: string
  patient_id: string
  doctor_id: string
  medications: Medication[]
  diagnosis: string | null
  notes: string | null
  follow_up_date: string | null
  created_at: string
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
}

export interface LabReport {
  id: string
  patient_id: string
  doctor_id: string
  test_name: string
  status: string
  result: Record<string, string> | null
  report_url: string | null
  notes: string | null
  requested_at: string
  completed_at: string | null
  created_at: string
}

export interface TimelineEvent {
  id: string
  patient_id: string
  event_type: string
  title: string
  description: string | null
  doctor_name: string | null
  status: string
  event_date: string
  event_time: string
  metadata: Record<string, unknown>
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export interface QueueToken {
  id: string
  patient_id: string
  doctor_id: string
  token_number: number
  status: string
}
