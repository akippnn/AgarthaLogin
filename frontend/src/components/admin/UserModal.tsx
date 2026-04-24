import { useState } from 'preact/hooks'
import { JSX } from 'preact'
import {
  LogIn, Crown, User as UserIcon, Key, ArrowRight, X
} from 'lucide-preact'
import { Button, Input, Badge, Modal, Admonition, Stack } from '../ui'

import type { User } from '../../lib/types'

interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onAction: (type: 'success' | 'error', text: string) => void;
  sessionId: string;
}

const API_BASE = '/api'

export default function UserModal({ user, onClose, onAction, sessionId }: UserModalProps) {
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [modalError, setModalError] = useState('')

  if (!user) return null

  const doAction = async (action: string, body: Record<string, unknown> = {}) => {
    setLoading(true)
    setModalError('')
    try {
      const res = await fetch(`${API_BASE}/admin/user/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sessionId },
        body: JSON.stringify({ username: user.username, ...body })
      })

      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      if (res.ok && data.success) {
        onAction('success', `Action ${action} completed`)
      } else {
        throw new Error(data.error || 'Action failed')
      }
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={!!user} onClose={onClose}>
      <Stack gap="1.5rem">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'white', margin: 0 }}>{user.username}</h2>
          <Button variant="secondary" onClick={onClose} style={{ padding: '0.25rem' }}>
            <X size={20} />
          </Button>
        </div>

        {modalError && (
          <Admonition variant="danger">
            {modalError}
          </Admonition>
        )}

        <Stack gap="0.75rem">
          <p className="text-muted">UUID: <span className="text-secondary">{user.uuid}</span></p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {user.premium
              ? <Badge variant="premium">Premium</Badge>
              : <Badge variant="cracked">Cracked</Badge>}
            {user.online
              ? <Badge variant="online">Online</Badge>
              : <Badge variant="offline">Offline</Badge>}
            {user.has2fa && <Badge variant="info">2FA Enabled</Badge>}
          </div>
          
          <div className="grid-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
            <p className="text-muted">Hash: <span className="text-secondary">{user.hashAlgo || 'N/A'}</span></p>
            <p className="text-muted">IP: <span className="text-secondary">{user.ip || 'N/A'}</span></p>
            <p className="text-muted">Email: <span className="text-secondary">{user.email || 'N/A'}</span></p>
            <p className="text-muted">Joined: <span className="text-secondary">{user.joinDate || 'N/A'}</span></p>
          </div>
        </Stack>

        {user.alts && user.alts.length > 0 && (
          <Stack gap="0.5rem">
            <h3 className="text-muted" style={{ fontSize: '0.9rem', margin: 0 }}>Potential Alts (by IP)</h3>
            <Stack gap="0.25rem">
              {user.alts.map(alt => (
                <p key={alt.uuid} className="text-secondary" style={{ fontSize: '0.85rem', paddingLeft: '0.75rem', borderLeft: '2px solid var(--color-bg-hover)' }}>
                  {alt.username} <span className="text-muted" style={{ fontSize: '0.75rem' }}>({alt.lastSeen || 'N/A'})</span>
                </p>
              ))}
            </Stack>
          </Stack>
        )}

        <Stack gap="1rem">
          <h3 className="text-muted" style={{ fontSize: '0.9rem', margin: 0 }}>Actions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {user.online && !user.authorized && (
              <Button variant="success" onClick={() => doAction('login')} disabled={loading} icon={<LogIn size={16} />}>
                Force Login
              </Button>
            )}
            <Button variant="secondary" onClick={() => doAction(user.premium ? 'cracked' : 'premium')} disabled={loading}>
              {user.premium ? <UserIcon size={16} /> : <Crown size={16} />}
              {user.premium ? 'Set Cracked' : 'Set Premium'}
            </Button>
          </div>
        </Stack>

        <Stack gap="0.75rem">
          <label className="typography-label">Change Password</label>
          <Stack gap="0.5rem">
            <Input
              type="password"
              value={newPassword}
              onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setNewPassword(e.currentTarget.value)}
              placeholder="New password"
            />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setConfirmPassword(e.currentTarget.value)}
              placeholder="Confirm password"
            />
            <Button
              onClick={() => doAction('password', { password: newPassword })}
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              icon={<Key size={16} />}
              fullWidth
            >
              Update Password
            </Button>
          </Stack>
        </Stack>

        <Stack gap="0.75rem">
          <label className="typography-label">Migrate Username</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <Input
                value={newUsername}
                onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setNewUsername(e.currentTarget.value)}
                placeholder="New username"
              />
            </div>
            <Button
              onClick={() => doAction('migrate', { newUsername })}
              disabled={loading || !newUsername}
              icon={<ArrowRight size={16} />}
            />
          </div>
        </Stack>
      </Stack>
    </Modal>
  )
}
