import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, Profile, UserRole } from './api'

interface AuthContextType {
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const token = api.getToken()
      if (token) {
        const { data, error } = await api.get('/auth/me')
        if (!error && data?.user && mounted) {
          setProfile(data.user as Profile)
        } else if (error && mounted) {
          api.setToken(null)
          setProfile(null)
        }
      }
      if (mounted) setLoading(false)
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await api.post('/auth/login', { email, password })
    if (!error && data?.token) {
      api.setToken(data.token)
      setProfile(data.user as Profile)
    }
    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    const { data, error } = await api.post('/auth/register', { email, password, fullName, role })
    if (!error && data?.token) {
      api.setToken(data.token)
      setProfile(data.user as Profile)
    }
    return { error }
  }

  const signOut = async () => {
    await api.post('/auth/logout').catch(() => {})
    api.setToken(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
