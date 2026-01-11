import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button, Input, Card, Alert } from '../ui'
import { colors } from '../ui/styles'

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

  const handleSubmit = async (e: React.FormEvent) => {
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
        <Alert type={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: colors.textMuted, display: 'block', marginBottom: '0.5rem' }}>Username</label>
          <Input
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: colors.textMuted, display: 'block', marginBottom: '0.5rem' }}>Password</label>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
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
