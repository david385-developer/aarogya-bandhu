import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { ToastProvider } from './components/ui/Toast'
import { UserRole } from './lib/api'

import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { RoleRedirect } from './pages/auth/RoleRedirect'

import { PatientDashboard } from './pages/patient/PatientDashboard'
import { TimelinePage } from './pages/patient/TimelinePage'
import { MedicalRecordsPage } from './pages/patient/MedicalRecordsPage'
import { NotificationsPage } from './pages/patient/NotificationsPage'
import { ProfilePage } from './pages/patient/ProfilePage'

import { DoctorDashboard } from './pages/doctor/DoctorDashboard'
import { DoctorPatientsPage } from './pages/doctor/DoctorPatientsPage'
import { ClinicalWorkspace } from './pages/doctor/ClinicalWorkspace'

import { ReceptionDashboard } from './pages/reception/ReceptionDashboard'
import { ReceptionPatientsPage } from './pages/reception/ReceptionPatientsPage'
import { ReceptionQueuePage } from './pages/reception/ReceptionQueuePage'
import { ReceptionAppointmentsPage } from './pages/reception/ReceptionAppointmentsPage'

import { LabDashboard } from './pages/lab/LabDashboard'

import { AdminDashboard } from './pages/admin/AdminDashboard'

import { SettingsPage } from './pages/shared/SettingsPage'
import { DoctorNotificationsPage } from './pages/doctor/DoctorNotificationsPage'
import { DoctorProfilePage } from './pages/doctor/DoctorProfilePage'
import { ReceptionProfilePage } from './pages/reception/ReceptionProfilePage'
import { LabProfilePage } from './pages/lab/LabProfilePage'

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: UserRole[] }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="animate-spin h-8 w-8 border-3 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    )
  }

  if (!profile) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(profile.role)) return <Navigate to="/redirect" replace />

  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/redirect" element={<RoleRedirect />} />

          {/* Patient */}
          <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
          <Route path="/patient/timeline" element={<ProtectedRoute allowedRoles={['patient']}><TimelinePage /></ProtectedRoute>} />
          <Route path="/patient/records" element={<ProtectedRoute allowedRoles={['patient']}><MedicalRecordsPage /></ProtectedRoute>} />
          <Route path="/patient/notifications" element={<ProtectedRoute allowedRoles={['patient']}><NotificationsPage /></ProtectedRoute>} />
          <Route path="/patient/profile" element={<ProtectedRoute allowedRoles={['patient']}><ProfilePage /></ProtectedRoute>} />
          <Route path="/patient/settings" element={<ProtectedRoute allowedRoles={['patient']}><SettingsPage role="patient" /></ProtectedRoute>} />

          {/* Doctor */}
          <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/patients" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorPatientsPage /></ProtectedRoute>} />
          <Route path="/doctor/workspace" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/workspace/:patientId" element={<ProtectedRoute allowedRoles={['doctor']}><ClinicalWorkspace /></ProtectedRoute>} />
          <Route path="/doctor/notifications" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorNotificationsPage /></ProtectedRoute>} />
          <Route path="/doctor/profile" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorProfilePage /></ProtectedRoute>} />
          <Route path="/doctor/settings" element={<ProtectedRoute allowedRoles={['doctor']}><SettingsPage role="doctor" /></ProtectedRoute>} />

          {/* Reception */}
          <Route path="/reception" element={<ProtectedRoute allowedRoles={['receptionist']}><ReceptionDashboard /></ProtectedRoute>} />
          <Route path="/reception/patients" element={<ProtectedRoute allowedRoles={['receptionist']}><ReceptionPatientsPage /></ProtectedRoute>} />
          <Route path="/reception/queue" element={<ProtectedRoute allowedRoles={['receptionist']}><ReceptionQueuePage /></ProtectedRoute>} />
          <Route path="/reception/appointments" element={<ProtectedRoute allowedRoles={['receptionist']}><ReceptionAppointmentsPage /></ProtectedRoute>} />
          <Route path="/reception/profile" element={<ProtectedRoute allowedRoles={['receptionist']}><ReceptionProfilePage /></ProtectedRoute>} />
          <Route path="/reception/settings" element={<ProtectedRoute allowedRoles={['receptionist']}><SettingsPage role="receptionist" /></ProtectedRoute>} />

          {/* Laboratory */}
          <Route path="/lab" element={<ProtectedRoute allowedRoles={['laboratory']}><LabDashboard /></ProtectedRoute>} />
          <Route path="/lab/requests" element={<ProtectedRoute allowedRoles={['laboratory']}><LabDashboard /></ProtectedRoute>} />
          <Route path="/lab/reports" element={<ProtectedRoute allowedRoles={['laboratory']}><LabDashboard /></ProtectedRoute>} />
          <Route path="/lab/profile" element={<ProtectedRoute allowedRoles={['laboratory']}><LabProfilePage /></ProtectedRoute>} />
          <Route path="/lab/settings" element={<ProtectedRoute allowedRoles={['laboratory']}><SettingsPage role="laboratory" /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['administrator']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['administrator']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['administrator']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['administrator']}><SettingsPage role="administrator" /></ProtectedRoute>} />

          {/* Default */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
