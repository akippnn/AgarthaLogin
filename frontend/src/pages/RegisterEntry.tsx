import React from 'react'
import ReactDOM from 'react-dom/client'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-preact'
import Register from '../features/register/Register'
import Authorized from '../components/Authorized'
import { TokenInfo } from '../lib/types'
import '../lib/i18n'
import { I18nProvider } from '../lib/i18n'
import '../index.css'

if (import.meta.env.DEV) {
  import('../mock/mockApi').then(({ setupMockApi }) => setupMockApi())
}


export default function RegisterEntry() {
  const [view, setView] = useState<'loading' | 'register' | 'authorized' | 'error'>('loading')
  const [token, setToken] = useState<string>('')
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Dev mode bypass
    if (import.meta.env.DEV) {
      const isOffline = window.location.search.includes('offline=true');

      // Default to DevUser (Premium) unless offline is specified
      const username = isOffline ? 'OfflineUser' : 'DevUser';

      setToken('dev-token')
      setTokenInfo({
        username,
        type: 'REGISTER'
      })
      setView('register')
      return
    }

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

  // Island Architecture: Render only the content, layout is in HTML
  return (
    <I18nProvider>
      {view === 'loading' && <div style={{ display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" /> Loading...</div>}
      {view === 'error' && <div className="alert-error">{error}</div>}
      {view === 'register' && <Register token={token} username={tokenInfo?.username ?? ''} onSuccess={onAuthorized} />}
      {view === 'authorized' && <Authorized />}
    </I18nProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RegisterEntry />
  </React.StrictMode>,
)
