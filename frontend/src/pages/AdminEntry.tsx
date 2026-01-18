import { render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { Loader2 } from 'lucide-preact'
import Admin from '../features/admin/Admin'
import '../lib/i18n'
import { I18nProvider } from '../lib/i18n'
import '../index.css'

if (import.meta.env.DEV) {
  import('../mock/mockApi').then(({ setupMockApi }) => setupMockApi())
}


export default function AdminEntry() {
  const [view, setView] = useState<'loading' | 'admin' | 'error'>('loading')
  const [token, setToken] = useState<string>('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Dev mode bypass
    // Dev mode bypass
    if (import.meta.env.DEV) {
      setToken('dev-token')
      setView('admin')
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
      const res = await fetch('/api/check-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <I18nProvider>
      {view === 'loading' && (
        <div className="flex-center min-h-screen">
          <Loader2 className="animate-spin" /> <span className="ml-2">Loading...</span>
        </div>
      )}
      {view === 'error' && (
        <div className="flex-center min-h-screen">
          <div className="alert-error">{error}</div>
        </div>
      )}
      {view === 'admin' && <Admin token={token} onSuccess={() => { }} />}
    </I18nProvider>
  )
}

render(<AdminEntry />, document.getElementById('root')!)
