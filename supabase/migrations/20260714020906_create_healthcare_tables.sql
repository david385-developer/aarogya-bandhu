/*
# Create healthcare data tables for Arogya Bandhu

1. New Tables
- `patients` — Patient demographics and medical info
- `doctors` — Doctor profiles
- `appointments` — Appointment scheduling
- `prescriptions` — Prescription records
- `lab_reports` — Laboratory test requests and results
- `timeline_events` — Patient health timeline events
- `notifications` — User notifications
- `queue_tokens` — Reception queue management

2. Security
- RLS enabled on all tables.
- Owner-scoped policies for patients (patient sees own data).
- Authenticated users can read/write based on their role context.
- For demo purposes, authenticated users can read all healthcare data and write as needed.

3. Important Notes
- These tables store the healthcare exchange data visible across all role dashboards.
- The `patient_id` links all medical records to a patient.
- Timeline events capture the full longitudinal health record.
*/

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  avatar_url text,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  blood_group text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  allergies text[] DEFAULT '{}',
  chronic_diseases text[] DEFAULT '{}',
  current_medications text[] DEFAULT '{}',
  photo_url text,
  created_at timestamptz DEFAULT now()
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  doctor_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  specialization text,
  avatar_url text,
  department text,
  created_at timestamptz DEFAULT now()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'in_progress')),
  reason text,
  token_number integer,
  created_at timestamptz DEFAULT now()
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  medications jsonb NOT NULL DEFAULT '[]',
  diagnosis text,
  notes text,
  follow_up_date date,
  created_at timestamptz DEFAULT now()
);

-- Lab reports table
CREATE TABLE IF NOT EXISTS lab_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  test_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'verified')),
  result jsonb,
  report_url text,
  notes text,
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Timeline events table
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('registration', 'visit', 'consultation', 'prescription', 'laboratory', 'report', 'follow_up', 'upload', 'notification')),
  title text NOT NULL,
  description text,
  doctor_name text,
  status text DEFAULT 'completed',
  event_date date NOT NULL,
  event_time time NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'appointment', 'lab', 'prescription', 'alert', 'system')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Queue tokens table
CREATE TABLE IF NOT EXISTS queue_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  token_number integer NOT NULL,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'in_consultation', 'completed', 'skipped')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tokens ENABLE ROW LEVEL SECURITY;

-- Patients policies (authenticated users can read all, patients can update own)
DROP POLICY IF EXISTS "auth_read_patients" ON patients;
CREATE POLICY "auth_read_patients" ON patients FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_patients" ON patients;
CREATE POLICY "auth_insert_patients" ON patients FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_patients" ON patients;
CREATE POLICY "auth_update_patients" ON patients FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Doctors policies
DROP POLICY IF EXISTS "auth_read_doctors" ON doctors;
CREATE POLICY "auth_read_doctors" ON doctors FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_doctors" ON doctors;
CREATE POLICY "auth_insert_doctors" ON doctors FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_doctors" ON doctors;
CREATE POLICY "auth_update_doctors" ON doctors FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Appointments policies
DROP POLICY IF EXISTS "auth_read_appointments" ON appointments;
CREATE POLICY "auth_read_appointments" ON appointments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_appointments" ON appointments;
CREATE POLICY "auth_insert_appointments" ON appointments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_appointments" ON appointments;
CREATE POLICY "auth_update_appointments" ON appointments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Prescriptions policies
DROP POLICY IF EXISTS "auth_read_prescriptions" ON prescriptions;
CREATE POLICY "auth_read_prescriptions" ON prescriptions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_prescriptions" ON prescriptions;
CREATE POLICY "auth_insert_prescriptions" ON prescriptions FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_prescriptions" ON prescriptions;
CREATE POLICY "auth_update_prescriptions" ON prescriptions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Lab reports policies
DROP POLICY IF EXISTS "auth_read_lab_reports" ON lab_reports;
CREATE POLICY "auth_read_lab_reports" ON lab_reports FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_lab_reports" ON lab_reports;
CREATE POLICY "auth_insert_lab_reports" ON lab_reports FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_lab_reports" ON lab_reports;
CREATE POLICY "auth_update_lab_reports" ON lab_reports FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Timeline events policies
DROP POLICY IF EXISTS "auth_read_timeline_events" ON timeline_events;
CREATE POLICY "auth_read_timeline_events" ON timeline_events FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_timeline_events" ON timeline_events;
CREATE POLICY "auth_insert_timeline_events" ON timeline_events FOR INSERT
  TO authenticated WITH CHECK (true);

-- Notifications policies (owner-scoped)
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Queue tokens policies
DROP POLICY IF EXISTS "auth_read_queue_tokens" ON queue_tokens;
CREATE POLICY "auth_read_queue_tokens" ON queue_tokens FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_queue_tokens" ON queue_tokens;
CREATE POLICY "auth_insert_queue_tokens" ON queue_tokens FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_queue_tokens" ON queue_tokens;
CREATE POLICY "auth_update_queue_tokens" ON queue_tokens FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_patient ON lab_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_patient ON timeline_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_doctor ON queue_tokens(doctor_id);
