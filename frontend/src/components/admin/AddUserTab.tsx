import { useState } from 'preact/hooks'
import { JSX } from 'preact'
import { UserPlus } from 'lucide-preact'
import { Button, Input, Card, Alert } from '../ui'


interface AddUserTabProps {
  sessionId: string;
}

interface Message {
  type: 'error' | 'success';
  text: string;
}

const API_BASE = '/api'

export default function AddUserTab({ sessionId }: AddUserTabProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)

  const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sessionId },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `User ${username} created with UUID: ${data.uuid}` })
        setUsername('')
        setPassword('')
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unknown error' })
    }
    setLoading(false)
  }

  return (
    <Card>
      <h2 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <UserPlus size={20} /> Register New User
      </h2>

      {message && (
        <Alert variant={message.type}>
          {message.text}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
          <Input
            value={username}
            onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setUsername(e.currentTarget.value)}
            required
            placeholder="Username"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setPassword(e.currentTarget.value)}
            required
            placeholder="Password"
          />
        </div>
        <Button
          variant="success"
          type="submit"
          loading={loading}
          icon={<UserPlus size={16} />}
        >
          Create User
        </Button>
      </form>
    </Card>
  )
}
