import { useState, useEffect, useCallback } from 'react'
import {
  ShieldAlert, Users, Database, RefreshCw, Search, ChevronLeft, ChevronRight,
  LogIn, Crown, User as UserIcon, Key, ArrowRight, UserPlus, UserMinus, Trash2,
  Check, X, AlertTriangle, Copy, Download, Upload
} from 'lucide-react'
import { Button, Input, Card, Badge, Modal, Alert, ConfirmDialog } from './ui'
import { styles, colors } from './ui/styles'
import type { User, UsersResponse, OptimizeResponse, AdminApplyResponse } from '../types'

const API_BASE = '/api'

// User Info Modal
interface UserModalProps {
  user: User | null;
  onClose: () => void;
  onAction: (type: 'success' | 'error', text: string) => void;
  sessionId: string;
}

function UserModal({ user, onClose, onAction, sessionId }: UserModalProps) {
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
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

      // Handle non-JSON responses
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
    <Modal>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: 'white' }}>{user.username}</h2>
        <Button variant="secondary" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      {modalError && (
        <Alert type="error" onDismiss={() => setModalError('')}>
          {modalError}
        </Alert>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: colors.textMuted, marginBottom: '0.5rem' }}>UUID: <span style={{ color: colors.textSecondary }}>{user.uuid}</span></p>
        <p style={{ color: colors.textMuted, marginBottom: '0.5rem' }}>
          Status: {user.premium
            ? <Badge variant="premium">Premium</Badge>
            : <Badge variant="cracked">Cracked</Badge>}
          {' '}
          {user.online
            ? <Badge variant="online">Online</Badge>
            : <Badge variant="offline">Offline</Badge>}
        </p>
        <p style={{ color: colors.textMuted, marginBottom: '0.5rem' }}>2FA: {user.has2fa ? 'Enabled' : 'Disabled'}</p>
        <p style={{ color: colors.textMuted, marginBottom: '0.5rem' }}>Hash Algorithm: {user.hashAlgo || 'N/A'}</p>
        <p style={{ color: colors.textMuted, marginBottom: '0.5rem' }}>IP: {user.ip || 'N/A'}</p>
        <p style={{ color: colors.textMuted, marginBottom: '0.5rem' }}>Email: {user.email || 'N/A'}</p>
        <p style={{ color: colors.textMuted, marginBottom: '0.5rem' }}>Last Seen: {user.lastSeen || 'N/A'}</p>
        <p style={{ color: colors.textMuted, marginBottom: '0.5rem' }}>Join Date: {user.joinDate || 'N/A'}</p>
      </div>

      {user.alts && user.alts.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: colors.textMuted, marginBottom: '0.5rem' }}>Potential Alts (by IP)</h3>
          {user.alts.map(alt => (
            <p key={alt.uuid} style={{ color: colors.textSecondary, paddingLeft: '1rem' }}>
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
        <label style={{ color: colors.textMuted, display: 'block', marginBottom: '0.5rem' }}>Change Password</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1 }}>
            <Input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password"
            />
          </div>
          <Button
            onClick={() => doAction('password', { password: newPassword })}
            disabled={loading || !newPassword}
            icon={<Key size={16} />}
          />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ color: colors.textMuted, display: 'block', marginBottom: '0.5rem' }}>Migrate Username</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1 }}>
            <Input
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
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

// Users Tab
interface UsersTabProps {
  sessionId: string;
}

interface ConfirmActionState {
  type: 'delete' | 'unregister' | 'bulk-delete' | 'bulk-unregister';
  username?: string;
}

interface Message {
  type: 'error' | 'success';
  text: string;
}

function UsersTab({ sessionId }: UsersTabProps) {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState<Message | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.append('search', search)
      const res = await fetch(`${API_BASE}/admin/users?${params}`, {
        headers: { 'X-Session-ID': sessionId }
      })
      const data: UsersResponse = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unknown error' })
    }
    setLoading(false)
  }, [page, search, sessionId])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const fetchUserDetails = async (username: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/user/${username}`, {
        headers: { 'X-Session-ID': sessionId }
      })
      const data: User = await res.json()
      setSelectedUser(data)
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unknown error' })
    }
  }

  const handleBulkAction = async (action: string) => {
    const usernames = Array.from(selectedUsers)
    try {
      const res = await fetch(`${API_BASE}/admin/users/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sessionId },
        body: JSON.stringify({ action, usernames })
      })
      const data = await res.json()
      setMessage({ type: data.success ? 'success' : 'error', text: `Processed: ${data.processed}, Failed: ${data.failed}` })
      setSelectedUsers(new Set())
      fetchUsers()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unknown error' })
    }
    setConfirmAction(null)
  }

  const handleDelete = async (username: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/user/${username}`, {
        method: 'DELETE',
        headers: { 'X-Session-ID': sessionId }
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'User deleted' })
        fetchUsers()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unknown error' })
    }
    setConfirmAction(null)
  }

  const handleUnregister = async (username: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/user/unregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sessionId },
        body: JSON.stringify({ username })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'User unregistered' })
        fetchUsers()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unknown error' })
    }
    setConfirmAction(null)
  }

  const toggleSelect = (username: string) => {
    const next = new Set(selectedUsers)
    if (next.has(username)) next.delete(username)
    else next.add(username)
    setSelectedUsers(next)
  }

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map(u => u.username)))
    }
  }

  return (
    <div>
      {message && (
        <Alert type={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
          <Input
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Button onClick={fetchUsers} icon={<Search size={16} />} />
        </div>
        <Button variant="secondary" onClick={fetchUsers} icon={<RefreshCw size={16} />} />
      </div>

      {selectedUsers.size > 0 && (
        <Card style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ color: colors.textMuted }}>{selectedUsers.size} selected</span>
          <Button variant="secondary" onClick={() => handleBulkAction('premium')} icon={<Crown size={16} />}>
            Set Premium
          </Button>
          <Button variant="secondary" onClick={() => handleBulkAction('cracked')} icon={<UserIcon size={16} />}>
            Set Cracked
          </Button>
          <Button variant="danger" onClick={() => setConfirmAction({ type: 'bulk-unregister' })} icon={<UserMinus size={16} />}>
            Unregister
          </Button>
          <Button variant="danger" onClick={() => setConfirmAction({ type: 'bulk-delete' })} icon={<Trash2 size={16} />}>
            Delete
          </Button>
        </Card>
      )}

      <Card>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>
                <input type="checkbox" checked={selectedUsers.size === users.length && users.length > 0} onChange={toggleSelectAll} />
              </th>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>2FA</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center' }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center' }}>No users found</td></tr>
            ) : users.map(user => (
              <tr key={user.uuid}>
                <td style={styles.td}>
                  <input type="checkbox" checked={selectedUsers.has(user.username)} onChange={() => toggleSelect(user.username)} />
                </td>
                <td style={styles.td}>{user.username}</td>
                <td style={styles.td}>
                  {user.premium
                    ? <Badge variant="premium">Premium</Badge>
                    : <Badge variant="cracked">Cracked</Badge>}
                </td>
                <td style={styles.td}>{user.has2fa ? <Check size={16} color={colors.success} /> : <X size={16} color="#868e96" />}</td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <Button variant="secondary" onClick={() => fetchUserDetails(user.username)} style={{ padding: '0.25rem 0.5rem' }}>
                      <Users size={14} />
                    </Button>
                    <Button variant="secondary" onClick={() => setConfirmAction({ type: 'unregister', username: user.username })} style={{ padding: '0.25rem 0.5rem' }}>
                      <UserMinus size={14} />
                    </Button>
                    <Button variant="danger" onClick={() => setConfirmAction({ type: 'delete', username: user.username })} style={{ padding: '0.25rem 0.5rem' }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <span style={{ color: colors.textMuted }}>Total: {total} users</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              icon={<ChevronLeft size={16} />}
            />
            <span style={{ color: colors.textSecondary, padding: '0.5rem' }}>Page {page + 1}</span>
            <Button
              variant="secondary"
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * 20 >= total}
              icon={<ChevronRight size={16} />}
            />
          </div>
        </div>
      </Card>

      {selectedUser && (
        <UserModal
          user={selectedUser}
          sessionId={sessionId}
          onClose={() => setSelectedUser(null)}
          onAction={(type, text) => {
            setMessage({ type, text })
            if (type === 'success') {
              setSelectedUser(null)
              fetchUsers()
            }
          }}
        />
      )}

      {confirmAction?.type === 'delete' && (
        <ConfirmDialog
          title="Delete User"
          message={`This will permanently delete ${confirmAction.username} and all their data. This action cannot be undone.`}
          confirmText="Delete"
          requireType={confirmAction.username}
          onConfirm={() => handleDelete(confirmAction.username!)}
          onCancel={() => setConfirmAction(null)}
          icon={<AlertTriangle color={colors.dangerLight} />}
        />
      )}

      {confirmAction?.type === 'unregister' && (
        <ConfirmDialog
          title="Unregister User"
          message={`This will unregister ${confirmAction.username}. Their in-game data will be kept, but they will need to register again.`}
          confirmText="Unregister"
          requireType={confirmAction.username}
          onConfirm={() => handleUnregister(confirmAction.username!)}
          onCancel={() => setConfirmAction(null)}
          icon={<AlertTriangle color={colors.dangerLight} />}
        />
      )}

      {confirmAction?.type === 'bulk-delete' && (
        <ConfirmDialog
          title="Delete Selected Users"
          message={`This will permanently delete ${selectedUsers.size} users. This action cannot be undone.`}
          confirmText="Delete All"
          requireType="DELETE"
          onConfirm={() => handleBulkAction('delete')}
          onCancel={() => setConfirmAction(null)}
          icon={<AlertTriangle color={colors.dangerLight} />}
        />
      )}

      {confirmAction?.type === 'bulk-unregister' && (
        <ConfirmDialog
          title="Unregister Selected Users"
          message={`This will unregister ${selectedUsers.size} users. Their in-game data will be kept.`}
          confirmText="Unregister All"
          requireType="UNREGISTER"
          onConfirm={() => handleBulkAction('unregister')}
          onCancel={() => setConfirmAction(null)}
          icon={<AlertTriangle color={colors.dangerLight} />}
        />
      )}
    </div>
  )
}

// Add User Tab
interface AddUserTabProps {
  sessionId: string;
}

function AddUserTab({ sessionId }: AddUserTabProps) {
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

// Database Tab
interface DatabaseTabProps {
  sessionId: string;
}

function DatabaseTab({ sessionId }: DatabaseTabProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResponse | null>(null)

  const handleOptimize = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/database/optimize`, {
        method: 'POST',
        headers: { 'X-Session-ID': sessionId }
      })
      const data: OptimizeResponse = await res.json()
      setOptimizeResult(data)
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unknown error' })
    }
    setLoading(false)
  }

  return (
    <div>
      {message && (
        <Alert type={message.type} onDismiss={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card>
        <h2 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={20} />
          <div>Database Optimization</div>
        </h2>
        <p style={{ color: colors.textMuted, marginBottom: '1rem' }}>
          Check how many users are using legacy password hash algorithms.
          Hashes are automatically upgraded to the preferred algorithm on next login.
        </p>
        <Button
          onClick={handleOptimize}
          loading={loading}
          icon={<RefreshCw size={16} />}
        >
          Analyze Database
        </Button>

        {optimizeResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: colors.bgDark, borderRadius: '4px' }}>
            <p style={{ color: colors.textSecondary }}>Preferred Algorithm: <strong>{optimizeResult.preferredAlgo}</strong></p>
            <p style={{ color: colors.textSecondary }}>Users with legacy hashes: <strong>{optimizeResult.usersNeedingConversion}</strong></p>
            <p style={{ color: colors.textMuted, marginTop: '0.5rem', fontSize: '0.875rem' }}>{optimizeResult.message}</p>
          </div>
        )}
      </Card>

      <Card>
        <h2 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={20} />
          <div>Backup & Restore</div>
        </h2>
        <p style={{ color: colors.textMuted, marginBottom: '1rem' }}>
          Download a backup of the authentication database or restore from a previous backup.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button disabled icon={<Download size={16} />}>
            Download Backup
          </Button>
          <Button variant="secondary" disabled icon={<Upload size={16} />}>
            Restore Backup
          </Button>
        </div>
        <p style={{ color: colors.dangerLight, marginTop: '1rem', fontSize: '0.875rem' }}>
          ⚠️ Backup/Restore functionality coming soon
        </p>
      </Card>
    </div>
  )
}

// Game Code Display (after applying admin token)
interface GameCodeDisplayProps {
  gameCode: string;
}

function GameCodeDisplay({ gameCode }: GameCodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const command = `/agarthalogin apply ${gameCode}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <h2 style={{ color: 'white', marginBottom: '1rem' }}>Action Required</h2>
      <p style={{ color: colors.textMuted, marginBottom: '1rem' }}>
        Run this command in-game to complete authentication:
      </p>
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        backgroundColor: colors.bgDark,
        padding: '1rem',
        borderRadius: '4px',
        fontFamily: 'monospace',
        alignItems: 'center'
      }}>
        <span style={{ color: colors.success, flex: 1 }}>{command}</span>
        <Button variant="secondary" onClick={copyToClipboard}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </Button>
      </div>
    </Card>
  )
}

// Main Admin Component
interface AdminProps {
  token: string;
  onSuccess: () => void;
}

type TabType = 'users' | 'add' | 'database';

export default function Admin({ token, onSuccess }: AdminProps) {
  const [error, setError] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('users')

  const handleApply = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      const data: AdminApplyResponse = await res.json()
      if (res.ok && data.success) {
        setGameCode(data.gameCode ?? '')
        setSessionId(data.sessionId ?? '')
        onSuccess()
      } else {
        throw new Error(data.error || "Failed to apply")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  // Initial auth screen
  if (!sessionId) {
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Admin Panel</h1>
        <Card>
          <ShieldAlert size={48} color={colors.dangerLight} style={{ display: 'block', margin: '0 auto 1rem' }} />
          <p style={{ color: colors.textMuted, textAlign: 'center', marginBottom: '2rem' }}>
            You are about to access the admin panel. Click below to authenticate.
          </p>

          {error && <Alert type="error">{error}</Alert>}

          <Button
            onClick={handleApply}
            variant="danger"
            fullWidth
          >
            Authenticate
          </Button>
        </Card>
      </div>
    )
  }

  // Show game code if we have it but haven't dismissed
  if (gameCode && !localStorage.getItem('admin_code_dismissed_' + gameCode)) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
        <GameCodeDisplay gameCode={gameCode} />
        <Button
          variant="success"
          fullWidth
          style={{ marginTop: '1rem' }}
          onClick={() => {
            localStorage.setItem('admin_code_dismissed_' + gameCode, 'true')
            setGameCode('')
          }}
        >
          I've entered the code, continue to panel
        </Button>
      </div>
    )
  }

  // Main admin panel
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <ShieldAlert size={24} color={colors.dangerLight} /> Admin Panel
        </h1>
      </div>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'users' ? styles.tabActive : styles.tabInactive) }}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} style={{ marginRight: '0.5rem' }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>Users</div>
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'add' ? styles.tabActive : styles.tabInactive) }}
          onClick={() => setActiveTab('add')}
        >
          <UserPlus size={16} style={{ marginRight: '0.5rem' }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>Add User</div>
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'database' ? styles.tabActive : styles.tabInactive) }}
          onClick={() => setActiveTab('database')}
        >
          <Database size={16} style={{ marginRight: '0.5rem' }} />
          <div style={{ display: 'flex', alignItems: 'center' }}>Database</div>
        </button>
      </div>

      {activeTab === 'users' && <UsersTab sessionId={sessionId} />}
      {activeTab === 'add' && <AddUserTab sessionId={sessionId} />}
      {activeTab === 'database' && <DatabaseTab sessionId={sessionId} />}
    </div>
  )
}
