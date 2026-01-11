import React from 'react'
import ReactDOM from 'react-dom/client'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Admin from '../features/admin/Admin'
import { colors } from '../components/ui/styles'
import '../lib/i18n'
import '../index.css'

export default function AdminEntry() {
  const [view, setView] = useState<'loading' | 'admin' | 'error'>('loading')
  const [token, setToken] = useState<string>('')
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (!t) {
      setError("No token provided.")
      setView('error')
      return
    }
    setToken(t)
    checkToken(t)
  }, [])

  const checkToken = async (t: string) => {
    try {
      const res = await fetch('/api/check-token', {
        method: 'POST',
        body: JSON.stringify({ token: t })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Invalid Token")

      if (data.type !== 'ADMIN_ACCESS') {
        if (data.type === 'LOGIN') window.location.href = `/login.html?token=${t}`
        else if (data.type === 'REGISTER') window.location.href = `/register.html?token=${t}`
        else throw new Error("Not an admin token")
        return
      }

      setView('admin')

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setView('error')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bgDark,
      color: colors.textPrimary
    }}>
      {view === 'loading' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Loader2 className="animate-spin" /> <span style={{ marginLeft: '0.5rem' }}>Loading...</span>
        </div>
      )}
      {view === 'error' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div style={{ color: colors.error, background: 'rgba(255,107,107,0.1)', padding: '1rem', borderRadius: '4px' }}>{error}</div>
        </div>
      )}
      {view === 'admin' && <Admin token={token} onSuccess={() => { }} />}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminEntry />
  </React.StrictMode>,
)
