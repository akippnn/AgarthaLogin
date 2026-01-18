import { useState } from 'preact/hooks'
import { JSX } from 'preact'
import {
  LogIn, Crown, User as UserIcon, Key, ArrowRight, X
} from 'lucide-preact'
import { Button, Input, Badge, Modal, Alert } from '../ui'

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
  const [confirmPassword, setConfirmPassword] = useState('') // Added
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
        setModalError(data.error || 'Action failed')
      }
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Network error')
    }
    setLoading(false)
  }

  return (
    <Modal isOpen={!!user} onClose={onClose}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: 'white' }}>{user.username}</h2>
        <Button variant="secondary" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      {modalError && (
        <Alert variant="error">
          {modalError}
        </Alert>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <p className="text-muted" style={{ marginBottom: '0.5rem' }}>UUID: <span className="text-secondary">{user.uuid}</span></p>
        <p className="text-muted" style={{ marginBottom: '0.5rem' }}>
          Status: {user.premium
            ? <Badge variant="premium">Premium</Badge>
            : <Badge variant="cracked">Cracked</Badge>}
          {' '}
          {user.online
            ? <Badge variant="online">Online</Badge>
            : <Badge variant="offline">Offline</Badge>}
        </p>
        <p className="text-muted" style={{ marginBottom: '0.5rem' }}>2FA: {user.has2fa ? 'Enabled' : 'Disabled'}</p>
        <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Hash Algorithm: {user.hashAlgo || 'N/A'}</p>
        <p className="text-muted" style={{ marginBottom: '0.5rem' }}>IP: {user.ip || 'N/A'}</p>
        <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Email: {user.email || 'N/A'}</p>
        <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Last Seen: {user.lastSeen || 'N/A'}</p>
        <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Join Date: {user.joinDate || 'N/A'}</p>
      </div>

      {user.alts && user.alts.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 className="text-muted" style={{ marginBottom: '0.5rem' }}>Potential Alts (by IP)</h3>
          {user.alts.map(alt => (
            <p key={alt.uuid} className="text-secondary" style={{ paddingLeft: '1rem' }}>
              • {alt.username} (last seen: {alt.lastSeen || 'N/A'})
            </p>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
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

      <div style={{ marginBottom: '1rem' }}>
        <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Change Password</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}> {/* Changed to column for stacking inputs */}
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
          />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Migrate Username</label>
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
      </div>
    </Modal>
  )
}
