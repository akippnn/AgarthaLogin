import { useState } from 'preact/hooks'
import { JSX } from 'preact'
import { UserPlus } from 'lucide-preact'
import { Button, Input, Card, Admonition, Stack } from '../ui'


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
    setMessage(null)
    try {
      const res = await fetch(`${API_BASE}/admin/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sessionId },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `User ${username} created successfully.` })
        setUsername('')
        setPassword('')
      } else {
        throw new Error(data.error || "Failed to create user")
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <Stack gap="1.5rem">
        <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <UserPlus size={20} /> Register New User
        </h2>

        {message && (
          <Admonition variant={message.type === 'success' ? 'success' : 'danger'}>
            {message.text}
          </Admonition>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="1.5rem">
            <Stack gap="0.5rem">
              <label className="typography-label">Username</label>
              <Input
                value={username}
                onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setUsername(e.currentTarget.value)}
                required
                placeholder="Username"
              />
            </Stack>

            <Stack gap="0.5rem">
              <label className="typography-label">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setPassword(e.currentTarget.value)}
                required
                placeholder="Password"
              />
            </Stack>

            <Button
              variant="success"
              type="submit"
              loading={loading}
              icon={<UserPlus size={16} />}
              fullWidth
            >
              Create User
            </Button>
          </Stack>
        </form>
      </Stack>
    </Card>
  )
}
