import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Button, Input } from './ui'
import { colors } from './ui/styles'
import type { LoginResponse } from '../types'

interface LoginProps {
  token: string;
  username: string;
  onSuccess: (sessionId: string | null) => void;
}

export default function Login({ token, username, onSuccess }: LoginProps) {
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ token, password: pass })
      })
      const data: LoginResponse = await res.json()
      if (res.ok && data.success) {
        onSuccess(data.sessionId ?? null)
      } else {
        throw new Error(data.error || "Login failed")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h1 style={{ color: 'white', marginBottom: '1.5rem' }}>Login</h1>
      <p style={{ marginBottom: '1rem' }}>Welcome back, <b>{username}</b></p>
      {error && <div style={{ color: colors.error, marginBottom: '1rem' }}>{error}</div>}
      <div style={{ marginBottom: '1rem' }}>
        <Input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="Password"
          icon={<KeyRound size={18} />}
          autoFocus
        />
      </div>
      <Button
        type="submit"
        loading={loading}
        fullWidth
      >
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  )
}
