import React from 'react'
import ReactDOM from 'react-dom/client'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-preact'
import SessionAuth from '../features/session/SessionAuth'
import Authorized from '../components/Authorized'
import { TokenInfo, SessionUser } from '../lib/types'
import '../lib/i18n'
import { I18nProvider } from '../lib/i18n'
import '../index.css'

export default function SessionAuthEntry() {
  const [view, setView] = useState<'loading' | 'prompt' | 'authorized' | 'error'>('loading')
  const [token, setToken] = useState<string>('')
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem('session_id'))
  const [error, setError] = useState('')

  useEffect(() => {
    // Dev mode bypass
    // Dev mode bypass
    if (import.meta.env.DEV) {
      const username = 'OfflineUser';

      setToken('dev-token');
      // Mock session user (Always offline for Session Auth flow)
      setSessionUser({
        username,
        uuid: 'mock-uuid',
        ip: '127.0.0.1',
        lastLogin: new Date().toISOString(),
        premium: false
      });
      setSessionId('mock-session-id');
      setView('prompt');
      return;
    }
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (!t) {
      setError("No token provided.")
      setView('error')
      return
    }
    setToken(t)
    checkTokenAndSession(t)
  }, [])

  const checkTokenAndSession = async (t: string) => {
    try {
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

      if (sessionId) {
        const userRes = await fetch('/api/user', { headers: { 'X-Session-ID': sessionId } })
        if (userRes.ok) {
          const user = await userRes.json()
          if (user.username === data.username) {
            setSessionUser(user)
            setView('prompt')
            return
          }
        }
      }

      // Session invalid or mismatch
      localStorage.removeItem('session_id')
      if (data.type === 'LOGIN') window.location.href = `/login.html?token=${t}`
      else if (data.type === 'REGISTER') window.location.href = `/register.html?token=${t}`
      else setView('error');

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setView('error')
    }
  }

  const onAuthorized = (sid: string | null) => {
    if (sid) {
      localStorage.setItem('session_id', sid)
      setSessionId(sid)
    }
    setView('authorized')
  }

  const onLogout = () => {
    localStorage.removeItem('session_id')
    if (tokenInfo?.type === 'LOGIN') window.location.href = `/login.html?token=${token}`
    else if (tokenInfo?.type === 'REGISTER') window.location.href = `/register.html?token=${token}`
    else window.location.href = '/'
  }

  // Island Architecture: Render only the content, layout is in HTML
  return (
    <I18nProvider>
      {view === 'loading' && <div style={{ display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin" /> Loading...</div>}
      {view === 'error' && <div className="alert-error">{error}</div>}
      {view === 'prompt' && <SessionAuth token={token} sessionId={sessionId!} username={sessionUser?.username ?? ''} onSuccess={onAuthorized} onLogout={onLogout} />}
      {view === 'authorized' && <Authorized />}
    </I18nProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SessionAuthEntry />
  </React.StrictMode>,
)
