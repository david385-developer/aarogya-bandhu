import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Activity, ChevronRight } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { UserRole } from '../../lib/api'

const roles: { value: UserRole; label: string; description: string }[] = [
  { value: 'patient', label: 'Patient', description: 'Access your health records' },
  { value: 'doctor', label: 'Doctor', description: 'Manage patient consultations' },
  { value: 'receptionist', label: 'Receptionist', description: 'Manage appointments & queue' },
  { value: 'laboratory', label: 'Laboratory', description: 'Process test requests' },
  { value: 'administrator', label: 'Administrator', description: 'System administration' },
]

export function RegisterPage() {
  const { signUp } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<UserRole>('patient')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signUp(email, password, fullName, role)
    setLoading(false)
    if (error) {
      toast(error, 'error')
    } else {
      toast('Account created successfully', 'success')
      navigate('/redirect')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary-50 via-white to-white">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white shadow-glow mb-3">
            <Activity className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 font-display">Create your account</h1>
          <p className="text-sm text-neutral-500 mt-1">Join Arogya Bandhu health platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-neutral-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Select your role</label>
            <div className="space-y-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                    role === r.value
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div className="text-left">
                    <p className={`text-sm font-medium ${role === r.value ? 'text-primary-700' : 'text-neutral-700'}`}>{r.label}</p>
                    <p className="text-xs text-neutral-400">{r.description}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${role === r.value ? 'text-primary-500' : 'text-neutral-300'}`} />
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" size="lg" fullWidth loading={loading}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
