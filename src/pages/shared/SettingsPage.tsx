import { useState } from 'react'
import { Bell, Globe, Shield, Moon, CircleHelp as HelpCircle, ChevronRight } from 'lucide-react'
import { AppShell } from '../../components/AppShell'
import { Card } from '../../components/ui/Card'

export function SettingsPage({ role }: { role: 'patient' | 'doctor' | 'receptionist' | 'laboratory' | 'administrator' }) {
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState('English')

  const rolePath = role === 'laboratory' ? '/lab' : role === 'administrator' ? '/admin' : `/${role}`

  return (
    <AppShell role={role} title="Settings" subtitle="App preferences">
      <div className="space-y-5 animate-fade-in">
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Preferences</h3>
          <Card padding="none">
            <div className="divide-y divide-neutral-100">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-neutral-500" />
                  <span className="text-sm text-neutral-700">Push Notifications</span>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${notifications ? 'bg-primary-600' : 'bg-neutral-200'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-neutral-500" />
                  <span className="text-sm text-neutral-700">Dark Mode</span>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary-600' : 'bg-neutral-200'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <button className="w-full flex items-center justify-between p-4 hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-neutral-500" />
                  <span className="text-sm text-neutral-700">Language</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-400">{language}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                </div>
              </button>
            </div>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">Privacy & Security</h3>
          <Card padding="none">
            <div className="divide-y divide-neutral-100">
              <button className="w-full flex items-center justify-between p-4 hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-neutral-500" />
                  <span className="text-sm text-neutral-700">Privacy Policy</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300" />
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-neutral-500" />
                  <span className="text-sm text-neutral-700">Help & Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300" />
              </button>
            </div>
          </Card>
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-neutral-400">Arogya Bandhu v1.0.0</p>
          <p className="text-xs text-neutral-300 mt-1">One Patient. One Longitudinal Health Record.</p>
        </div>
      </div>
    </AppShell>
  )
}
