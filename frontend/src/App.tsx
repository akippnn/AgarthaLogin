import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Login from './components/Login'
import Register from './components/Register'
import SessionAuth from './components/SessionAuth'
import Admin from './components/Admin'
import Authorized from './components/Authorized'
import type { ViewState, TokenInfo, SessionUser } from './types'
import { colors } from './components/ui/styles'

function App() {
  const [view, setView] = useState<ViewState>('loading')
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem('session_id'))

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

      setTokenInfo(data)

      if (data.type === 'ADMIN_ACCESS') {
        setView('admin')
        return
      }

      // Check Session
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
        // Invalid session or mismatch
        localStorage.removeItem('session_id')
        setSessionId(null)
      }

      // Default Flow
      if (data.type === 'LOGIN') setView('login')
      else setView('register')

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

  // Admin panel uses full width
  if (view === 'admin') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.bgDark,
        color: colors.textPrimary
      }}>
        <Admin token={token!} onSuccess={() => { }} />
      </div>
    )
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

        {view === 'login' && <Login token={token!} username={tokenInfo?.username ?? ''} onSuccess={onAuthorized} />}
        {view === 'register' && <Register token={token!} username={tokenInfo?.username ?? ''} onSuccess={onAuthorized} />}
        {view === 'prompt' && <SessionAuth token={token!} sessionId={sessionId!} username={sessionUser?.username ?? ''} onSuccess={onAuthorized} onLogout={() => { localStorage.removeItem('session_id'); location.reload() }} />}
        {view === 'authorized' && <Authorized />}
      </div>
    </div>
  )
}

export default App
