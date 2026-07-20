export type UserRole = 'patient' | 'doctor' | 'receptionist' | 'laboratory' | 'administrator'

export interface Profile {
  id: string
  _id?: string
  email: string
  full_name: string
  fullName?: string
  role: UserRole
  phone: string | null
  avatar_url: string | null
  created_at: string
  [key: string]: any
}

export interface Patient {
  id: string
  _id?: string
  patient_id: string
  patientId?: string
  full_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  date_of_birth: string | null
  dateOfBirth?: string
  gender: string | null
  blood_group: string | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  allergies: string[]
  chronic_diseases: string[]
  current_medications: string[]
  photo_url: string | null
  [key: string]: any
}

export interface Doctor {
  id: string
  _id?: string
  doctor_id: string
  full_name: string
  fullName?: string
  email: string | null
  phone: string | null
  specialization: string | null
  avatar_url: string | null
  department: string | null
  [key: string]: any
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
  doctors?: Doctor
  patients?: Patient
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
  doctors?: Doctor
  patients?: Patient
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
  doctors?: Doctor
  patients?: Patient
}

export interface TimelineEvent {
  id: string
  patient_id: string
  event_type: string
  title: string
  description: string | null
  doctor_name: string | null
  status?: string
  event_date: string
  event_time: string
  metadata?: Record<string, any>
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  isRead?: boolean
  created_at: string
  createdAt?: string
  health_event_id?: string
  healthEventId?: string
}

export interface QueueToken {
  id: string
  patient_id: string
  doctor_id: string
  token_number: number
  status: string
  doctors?: Doctor
  patients?: Patient
}

export interface MedicalFile {
  id: string
  patient_id: string
  uploaded_by: string
  file_name: string
  original_name: string
  cloudinary_url: string
  resource_type: string
  mime_type: string
  file_size: number
  uploaded_at: string
  category?: string
}

export interface QRPassportData {
  patientId: string
  passportToken: string
  qrPayload: Record<string, any>
  status: string
  version: number
}

const SYNC_EVENT_NAME = 'sync-refresh'
const NOTIFICATION_EVENT_NAME = 'notification-refresh'

export function emitSyncRefresh() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(SYNC_EVENT_NAME))
}

export function emitNotificationRefresh() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(NOTIFICATION_EVENT_NAME))
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:4000/api/v1' : 'https://aarogya-bandhu.onrender.com/api/v1')

function normalizeResponseData(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data
  }
  if (Array.isArray(data)) {
    return data.map(item => normalizeResponseData(item))
  }
  const normalized: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    const normVal = normalizeResponseData(value)
    normalized[key] = normVal

    if (key === 'fullName' && normalized['full_name'] === undefined) normalized['full_name'] = normVal
    if (key === 'full_name' && normalized['fullName'] === undefined) normalized['fullName'] = normVal
    if (key === 'patientId' && normalized['patient_id'] === undefined) normalized['patient_id'] = normVal
    if (key === 'patient_id' && normalized['patientId'] === undefined) normalized['patientId'] = normVal
    if (key === 'doctorId' && normalized['doctor_id'] === undefined) normalized['doctor_id'] = normVal
    if (key === 'doctor_id' && normalized['doctorId'] === undefined) normalized['doctorId'] = normVal
    if (key === 'dateOfBirth' && normalized['date_of_birth'] === undefined) normalized['date_of_birth'] = normVal
    if (key === 'date_of_birth' && normalized['dateOfBirth'] === undefined) normalized['dateOfBirth'] = normVal
    if (key === 'avatarUrl' && normalized['avatar_url'] === undefined) normalized['avatar_url'] = normVal
    if (key === 'avatar_url' && normalized['avatarUrl'] === undefined) normalized['avatarUrl'] = normVal
    if (key === 'bloodGroup' && normalized['blood_group'] === undefined) normalized['blood_group'] = normVal
    if (key === 'blood_group' && normalized['bloodGroup'] === undefined) normalized['bloodGroup'] = normVal
    if (key === 'chronicDiseases' && normalized['chronic_diseases'] === undefined) normalized['chronic_diseases'] = normVal
    if (key === 'chronic_diseases' && normalized['chronicDiseases'] === undefined) normalized['chronicDiseases'] = normVal
    if (key === 'currentMedications' && normalized['current_medications'] === undefined) normalized['current_medications'] = normVal
    if (key === 'current_medications' && normalized['currentMedications'] === undefined) normalized['currentMedications'] = normVal
  }

  if (normalized.allergies === undefined || normalized.allergies === null) normalized.allergies = []
  if (normalized.chronic_diseases === undefined || normalized.chronic_diseases === null) normalized.chronic_diseases = []
  if (normalized.current_medications === undefined || normalized.current_medications === null) normalized.current_medications = []

  if (normalized._id && !normalized.id) normalized.id = normalized._id
  if (normalized.id && !normalized._id) normalized._id = normalized.id

  return normalized
}

class ApiClient {
  private token: string | null = null

  constructor() {
    this.getToken()
  }

  setToken(token: string | null) {
    this.token = token
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (token) {
          window.localStorage.setItem('arogya_access_token', token)
        } else {
          window.localStorage.removeItem('arogya_access_token')
        }
      }
    } catch {
      // Ignore
    }
  }

  getToken(): string | null {
    if (!this.token) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          this.token = window.localStorage.getItem('arogya_access_token')
        }
      } catch {
        // Ignore
      }
    }
    return this.token
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ data: T | null; error: string | null; [key: string]: any }> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }

    const token = this.getToken()
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const json = await response.json().catch(() => null)

      if (!response.ok) {
        return { data: null, error: json?.message || `HTTP ${response.status}: Request failed` }
      }

      const rawData = json?.data !== undefined ? json.data : json
      const normalizedData = normalizeResponseData(rawData)

      return {
        data: normalizedData,
        error: null,
        ...(typeof json === 'object' && json ? normalizeResponseData(json) : {}),
      }
    } catch (err: any) {
      return { data: null, error: err?.message || 'Network request failed' }
    }
  }

  async get<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  async upload<T = any>(endpoint: string, formData: FormData, options?: RequestInit): Promise<{ data: T | null; error: string | null; [key: string]: any }> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
    const headers: Record<string, string> = {
      ...((options?.headers as Record<string, string>) || {}),
    }

    const token = this.getToken()
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        headers,
        body: formData,
      })

      const json = await response.json().catch(() => null)

      if (!response.ok) {
        return { data: null, error: json?.message || `HTTP ${response.status}: Request failed` }
      }

      const rawData = json?.data !== undefined ? json.data : json
      const normalizedData = normalizeResponseData(rawData)

      return {
        data: normalizedData,
        error: null,
        ...(typeof json === 'object' && json ? normalizeResponseData(json) : {}),
      }
    } catch (err: any) {
      return { data: null, error: err?.message || 'Network request failed' }
    }
  }
}

export const api = new ApiClient()
