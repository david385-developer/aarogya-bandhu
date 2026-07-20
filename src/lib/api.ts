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
  created_at: string
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-render-backend.onrender.com/api/v1'

class ApiClient {
  private token: string | null = null

  constructor() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        this.token = window.localStorage.getItem('arogya_access_token')
      }
    } catch {
      // Fallback if private mode / mobile browser restricts localStorage
    }
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
      // Ignore security errors
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

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ data: T | null; error: string | null }> {
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

      return { data: json?.data !== undefined ? json.data : json, error: null }
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
}

export const api = new ApiClient()
