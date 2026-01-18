import React from 'react'
import ReactDOM from 'react-dom/client'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-preact'
import Login from '../features/login/Login'
import Authorized from '../components/Authorized'
import { TokenInfo } from '../lib/types'
import '../lib/i18n'
import { I18nProvider } from '../lib/i18n'
import '../index.css'

if (import.meta.env.DEV) {
  import('../mock/mockApi').then(({ setupMockApi }) => setupMockApi())
}


export default function LoginEntry() {
  const [view, setView] = useState<'loading' | 'login' | 'authorized' | 'error'>('loading')
  const [token, setToken] = useState<string>('')
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Dev mode bypass
    if (import.meta.env.DEV) {
      setToken('dev-token')
      setTokenInfo({
        username: 'DevUser',
        type: 'LOGIN'
      })
      setView('login')
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
      if (sessionId) {
        // Optimistic check: if session exists, try session auth page
        // But we need to verify if the session is actually valid for this user?
        // We'll let SessionAuthEntry handle the heavy lifting.
        // But we shouldn't redirect infinitely.
        if (!window.location.search.includes('no_session_check')) {
          window.location.href = `/sessionauth.html?token=${t}`
          return
        }
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
      if (data.type === 'REGISTER') {
        window.location.href = `/register.html?token=${t}`
        return
      }

      // If we are here, it's LOGIN
      setView('login')

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
      {view === 'login' && <Login token={token} username={tokenInfo?.username ?? ''} onSuccess={onAuthorized} />}
      {view === 'authorized' && <Authorized />}
    </I18nProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LoginEntry />
  </React.StrictMode>,
)
