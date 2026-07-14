import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Activity } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'

export function LoginPage() {
  const { signIn } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      toast(error, 'error')
    } else {
      toast('Welcome back to Arogya Bandhu', 'success')
      navigate('/redirect')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary-50 via-white to-white">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white shadow-glow mb-4">
            <Activity className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 font-display">Arogya Bandhu</h1>
          <p className="text-sm text-neutral-500 mt-1">One Patient. One Longitudinal Health Record.</p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-800 mb-1">Welcome back</h2>
          <p className="text-sm text-neutral-500">Sign in to access your health dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Enter your password"
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
          <Button type="submit" size="lg" fullWidth loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          New to Arogya Bandhu?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:text-primary-700">
            Create an account
          </Link>
        </p>

        <div className="mt-8 p-4 bg-secondary-50 rounded-2xl border border-secondary-100">
          <p className="text-xs text-secondary-700 font-medium mb-2">Demo Accounts</p>
          <p className="text-xs text-secondary-600">Sign up with any email and select a role to explore. Your account is created instantly.</p>
        </div>
      </div>
    </div>
  )
}
