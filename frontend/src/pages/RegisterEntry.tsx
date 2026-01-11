import React from 'react'
import ReactDOM from 'react-dom/client'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Register from '../features/register/Register'
import Authorized from '../components/Authorized'
import { colors } from '../components/ui/styles'
import { TokenInfo } from '../lib/types'
import '../lib/i18n'
import '../index.css'

export default function RegisterEntry() {
  const [view, setView] = useState<'loading' | 'register' | 'authorized' | 'error'>('loading')
  const [token, setToken] = useState<string>('')
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
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
      const sessionId = localStorage.getItem('session_id')
      if (sessionId && !window.location.search.includes('no_session_check')) {
        window.location.href = `/sessionauth.html?token=${t}`
        return
      }

      const res = await fetch('/api/check-token', {
        method: 'POST',
        body: JSON.stringify({ token: t })
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Invalid Token")

      setTokenInfo(data)

      if (data.type === 'ADMIN_ACCESS') {
        window.location.href = `/admin.html?token=${t}`
        return
      }
      if (data.type === 'LOGIN') {
        window.location.href = `/login.html?token=${t}`
        return
      }

      setView('register')

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setView('error')
    }
  }

  const onAuthorized = (sid: string | null) => {
    if (sid) localStorage.setItem('session_id', sid)
    setView('authorized')
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
      backgroundColor: colors.bgDark, color: colors.textPrimary, padding: '1rem'
    }}>
      <div style={{
        backgroundColor: colors.bgCard, padding: '2rem', borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)', width: '100%', maxWidth: '400px', textAlign: 'center'
      }}>
        {view === 'loading' && <div style={{ display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" /> Loading...</div>}
        {view === 'error' && <div style={{ color: colors.error, background: 'rgba(255,107,107,0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
        {view === 'register' && <Register token={token} username={tokenInfo?.username ?? ''} onSuccess={onAuthorized} />}
        {view === 'authorized' && <Authorized />}
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RegisterEntry />
  </React.StrictMode>,
)
