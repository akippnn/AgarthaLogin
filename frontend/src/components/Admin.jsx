import { useState, useEffect, useCallback } from 'react'
import {
  ShieldAlert, Users, Database, RefreshCw, Search, ChevronLeft, ChevronRight,
  LogIn, Crown, User, Key, ArrowRight, UserPlus, UserMinus, Trash2,
  Check, X, AlertTriangle, Copy, Download, Upload
} from 'lucide-react'

const API_BASE = '/api'

// Styles
const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { color: 'white', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  tabs: { display: 'flex', gap: '1rem', marginBottom: '2rem' },
  tab: { padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' },
  tabActive: { backgroundColor: '#228be6', color: 'white' },
  tabInactive: { backgroundColor: '#2c2e33', color: '#909296' },
  card: { backgroundColor: '#25262b', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' },
  input: { width: '100%', padding: '0.75rem', backgroundColor: '#1a1b1e', border: '1px solid #373a40', borderRadius: '4px', color: 'white', fontSize: '0.875rem' },
  button: { padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' },
  buttonPrimary: { backgroundColor: '#228be6', color: 'white' },
  buttonDanger: { backgroundColor: '#e03131', color: 'white' },
  buttonSuccess: { backgroundColor: '#40c057', color: 'white' },
  buttonSecondary: { backgroundColor: '#373a40', color: 'white' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #373a40', color: '#909296', fontSize: '0.75rem', textTransform: 'uppercase' },
  td: { padding: '0.75rem', borderBottom: '1px solid #2c2e33', color: '#c1c2c5' },
  badge: { padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500' },
  badgePremium: { backgroundColor: '#fab005', color: '#1a1b1e' },
  badgeCracked: { backgroundColor: '#495057', color: 'white' },
  badgeOnline: { backgroundColor: '#40c057', color: 'white' },
  badgeOffline: { backgroundColor: '#868e96', color: 'white' },
  modal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#25262b', borderRadius: '8px', padding: '2rem', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' },
  error: { color: '#ff6b6b', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: '4px' },
  success: { color: '#40c057', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(64,192,87,0.1)', borderRadius: '4px' },
}

// Confirmation Dialog Component
function ConfirmDialog({ title, message, confirmText, onConfirm, onCancel, requireType }) {
  const [typed, setTyped] = useState('')
  const canConfirm = !requireType || typed === requireType

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h2 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle color="#fa5252" /> {title}
        </h2>
        <p style={{ color: '#909296', marginBottom: '1rem' }}>{message}</p>
        {requireType && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: '#ff6b6b', marginBottom: '0.5rem' }}>
              Type <strong>{requireType}</strong> to confirm:
            </p>
            <input
              style={styles.input}
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={requireType}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...styles.button, ...styles.buttonDanger, opacity: canConfirm ? 1 : 0.5 }}
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// User Info Modal
function UserModal({ user, onClose, onAction, sessionId }) {
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')

  if (!user) return null

  const doAction = async (action, body = {}) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/user/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-ID': sessionId },
        body: JSON.stringify({ username: user.username, ...body })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        onAction('success', `Action ${action} completed`)
      } else {
        onAction('error', data.error || 'Action failed')
      }
    } catch (e) {
      onAction('error', e.message)
    }
    setLoading(false)
  }

  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: 'white' }}>{user.username}</h2>
          <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: '#909296', marginBottom: '0.5rem' }}>UUID: <span style={{ color: '#c1c2c5' }}>{user.uuid}</span></p>
          <p style={{ color: '#909296', marginBottom: '0.5rem' }}>
            Status: {user.premium
              ? <span style={{ ...styles.badge, ...styles.badgePremium }}>Premium</span>
              : <span style={{ ...styles.badge, ...styles.badgeCracked }}>Cracked</span>}
            {' '}
            {user.online
              ? <span style={{ ...styles.badge, ...styles.badgeOnline }}>Online</span>
              : <span style={{ ...styles.badge, ...styles.badgeOffline }}>Offline</span>}
          </p>
          <p style={{ color: '#909296', marginBottom: '0.5rem' }}>2FA: {user.has2fa ? 'Enabled' : 'Disabled'}</p>
          <p style={{ color: '#909296', marginBottom: '0.5rem' }}>Hash Algorithm: {user.hashAlgo || 'N/A'}</p>
          <p style={{ color: '#909296', marginBottom: '0.5rem' }}>IP: {user.ip || 'N/A'}</p>
          <p style={{ color: '#909296', marginBottom: '0.5rem' }}>Email: {user.email || 'N/A'}</p>
          <p style={{ color: '#909296', marginBottom: '0.5rem' }}>Last Seen: {user.lastSeen || 'N/A'}</p>
          <p style={{ color: '#909296', marginBottom: '0.5rem' }}>Join Date: {user.joinDate || 'N/A'}</p>
        </div>

        {user.alts && user.alts.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#909296', marginBottom: '0.5rem' }}>Potential Alts (by IP)</h3>
            {user.alts.map(alt => (
              <p key={alt.uuid} style={{ color: '#c1c2c5', paddingLeft: '1rem' }}>
                • {alt.username} (last seen: {alt.lastSeen || 'N/A'})
              </p>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {user.online && !user.authorized && (
            <button style={{ ...styles.button, ...styles.buttonSuccess }} onClick={() => doAction('login')} disabled={loading}>
              <LogIn size={16} /> Force Login
            </button>
          )}
          <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={() => doAction(user.premium ? 'cracked' : 'premium')} disabled={loading}>
            {user.premium ? <User size={16} /> : <Crown size={16} />}
            {user.premium ? 'Set Cracked' : 'Set Premium'}
          </button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#909296', display: 'block', marginBottom: '0.5rem' }}>Change Password</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              style={{ ...styles.input, flex: 1 }}
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password"
            />
            <button
              style={{ ...styles.button, ...styles.buttonPrimary }}
              onClick={() => doAction('password', { password: newPassword })}
              disabled={loading || !newPassword}
            >
              <Key size={16} />
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#909296', display: 'block', marginBottom: '0.5rem' }}>Migrate Username</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              style={{ ...styles.input, flex: 1 }}
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="New username"
            />
            <button
              style={{ ...styles.button, ...styles.buttonPrimary }}
              onClick={() => doAction('migrate', { newUsername })}
              disabled={loading || !newUsername}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Users Tab
function UsersTab({ sessionId }) {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState(new Set())
  const [message, setMessage] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (search) params.append('search', search)
      const res = await fetch(`${API_BASE}/admin/users?${params}`, {
        headers: { 'X-Session-ID': sessionId }
      })
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
    }
    setLoading(false)
  }, [page, search, sessionId])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const fetchUserDetails = async (username) => {
    try {
      const res = await fetch(`${API_BASE}/admin/user/${username}`, {
        headers: { 'X-Session-ID': sessionId }
      })
      const data = await res.json()
      setSelectedUser(data)
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
    }
  }

  const handleBulkAction = async (action) => {
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
      setMessage({ type: 'error', text: e.message })
    }
    setConfirmAction(null)
  }

  const handleDelete = async (username) => {
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
      setMessage({ type: 'error', text: e.message })
    }
    setConfirmAction(null)
  }

  const handleUnregister = async (username) => {
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
      setMessage({ type: 'error', text: e.message })
    }
    setConfirmAction(null)
  }

  const toggleSelect = (username) => {
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
        <div style={message.type === 'error' ? styles.error : styles.success}>
          {message.text}
          <button style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
          <input
            style={styles.input}
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button style={{ ...styles.button, ...styles.buttonPrimary }} onClick={fetchUsers}>
            <Search size={16} />
          </button>
        </div>
        <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={fetchUsers}>
          <RefreshCw size={16} />
        </button>
      </div>

      {selectedUsers.size > 0 && (
        <div style={{ ...styles.card, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ color: '#909296' }}>{selectedUsers.size} selected</span>
          <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={() => handleBulkAction('premium')}>
            <Crown size={16} /> Set Premium
          </button>
          <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={() => handleBulkAction('cracked')}>
            <User size={16} /> Set Cracked
          </button>
          <button style={{ ...styles.button, ...styles.buttonDanger }} onClick={() => setConfirmAction({ type: 'bulk-unregister' })}>
            <UserMinus size={16} /> Unregister
          </button>
          <button style={{ ...styles.button, ...styles.buttonDanger }} onClick={() => setConfirmAction({ type: 'bulk-delete' })}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}

      <div style={styles.card}>
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
                    ? <span style={{ ...styles.badge, ...styles.badgePremium }}>Premium</span>
                    : <span style={{ ...styles.badge, ...styles.badgeCracked }}>Cracked</span>}
                </td>
                <td style={styles.td}>{user.has2fa ? <Check size={16} color="#40c057" /> : <X size={16} color="#868e96" />}</td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button style={{ ...styles.button, ...styles.buttonSecondary, padding: '0.25rem 0.5rem' }} onClick={() => fetchUserDetails(user.username)} title="Info">
                      <Users size={14} />
                    </button>
                    <button style={{ ...styles.button, ...styles.buttonSecondary, padding: '0.25rem 0.5rem' }} onClick={() => setConfirmAction({ type: 'unregister', username: user.username })} title="Unregister">
                      <UserMinus size={14} />
                    </button>
                    <button style={{ ...styles.button, ...styles.buttonDanger, padding: '0.25rem 0.5rem' }} onClick={() => setConfirmAction({ type: 'delete', username: user.username })} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <span style={{ color: '#909296' }}>Total: {total} users</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ color: '#c1c2c5', padding: '0.5rem' }}>Page {page + 1}</span>
            <button
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * 20 >= total}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

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
          onConfirm={() => handleDelete(confirmAction.username)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction?.type === 'unregister' && (
        <ConfirmDialog
          title="Unregister User"
          message={`This will unregister ${confirmAction.username}. Their in-game data will be kept, but they will need to register again.`}
          confirmText="Unregister"
          requireType={confirmAction.username}
          onConfirm={() => handleUnregister(confirmAction.username)}
          onCancel={() => setConfirmAction(null)}
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
        />
      )}
    </div>
  )
}

// Add User Tab
function AddUserTab({ sessionId }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
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
      setMessage({ type: 'error', text: e.message })
    }
    setLoading(false)
  }

  return (
    <div style={styles.card}>
      <h2 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <UserPlus size={20} /> Register New User
      </h2>

      {message && (
        <div style={message.type === 'error' ? styles.error : styles.success}>{message.text}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#909296', display: 'block', marginBottom: '0.5rem' }}>Username</label>
          <input
            style={styles.input}
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#909296', display: 'block', marginBottom: '0.5rem' }}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          style={{ ...styles.button, ...styles.buttonSuccess }}
          type="submit"
          disabled={loading}
        >
          <UserPlus size={16} /> Create User
        </button>
      </form>
    </div>
  )
}

// Database Tab
function DatabaseTab({ sessionId }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [optimizeResult, setOptimizeResult] = useState(null)

  const handleOptimize = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/database/optimize`, {
        method: 'POST',
        headers: { 'X-Session-ID': sessionId }
      })
      const data = await res.json()
      setOptimizeResult(data)
    } catch (e) {
      setMessage({ type: 'error', text: e.message })
    }
    setLoading(false)
  }

  return (
    <div>
      {message && (
        <div style={message.type === 'error' ? styles.error : styles.success}>{message.text}</div>
      )}

      <div style={styles.card}>
        <h2 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={20} /> Database Optimization
        </h2>
        <p style={{ color: '#909296', marginBottom: '1rem' }}>
          Check how many users are using legacy password hash algorithms.
          Hashes are automatically upgraded to the preferred algorithm on next login.
        </p>
        <button
          style={{ ...styles.button, ...styles.buttonPrimary }}
          onClick={handleOptimize}
          disabled={loading}
        >
          <RefreshCw size={16} /> Analyze Database
        </button>

        {optimizeResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1a1b1e', borderRadius: '4px' }}>
            <p style={{ color: '#c1c2c5' }}>Preferred Algorithm: <strong>{optimizeResult.preferredAlgo}</strong></p>
            <p style={{ color: '#c1c2c5' }}>Users with legacy hashes: <strong>{optimizeResult.usersNeedingConversion}</strong></p>
            <p style={{ color: '#909296', marginTop: '0.5rem', fontSize: '0.875rem' }}>{optimizeResult.message}</p>
          </div>
        )}
      </div>

      <div style={styles.card}>
        <h2 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={20} /> Backup & Restore
        </h2>
        <p style={{ color: '#909296', marginBottom: '1rem' }}>
          Download a backup of the authentication database or restore from a previous backup.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{ ...styles.button, ...styles.buttonPrimary }} disabled>
            <Download size={16} /> Download Backup
          </button>
          <button style={{ ...styles.button, ...styles.buttonSecondary }} disabled>
            <Upload size={16} /> Restore Backup
          </button>
        </div>
        <p style={{ color: '#fa5252', marginTop: '1rem', fontSize: '0.875rem' }}>
          ⚠️ Backup/Restore functionality coming soon
        </p>
      </div>
    </div>
  )
}

// Game Code Display (after applying admin token)
function GameCodeDisplay({ gameCode }) {
  const [copied, setCopied] = useState(false)
  const command = `/agarthalogin apply ${gameCode}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={styles.card}>
      <h2 style={{ color: 'white', marginBottom: '1rem' }}>Action Required</h2>
      <p style={{ color: '#909296', marginBottom: '1rem' }}>
        Run this command in-game to complete authentication:
      </p>
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        backgroundColor: '#1a1b1e',
        padding: '1rem',
        borderRadius: '4px',
        fontFamily: 'monospace',
        alignItems: 'center'
      }}>
        <span style={{ color: '#40c057', flex: 1 }}>{command}</span>
        <button
          style={{ ...styles.button, ...styles.buttonSecondary }}
          onClick={copyToClipboard}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  )
}

// Main Admin Component
export default function Admin({ token, onSuccess }) {
  const [error, setError] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [activeTab, setActiveTab] = useState('users')

  const handleApply = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setGameCode(data.gameCode)
        setSessionId(data.sessionId)
        onSuccess()
      } else {
        throw new Error(data.error || "Failed to apply")
      }
    } catch (e) {
      setError(e.message)
    }
  }

  // Initial auth screen
  if (!sessionId) {
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Admin Panel</h1>
        <div style={styles.card}>
          <ShieldAlert size={48} color="#fa5252" style={{ display: 'block', margin: '0 auto 1rem' }} />
          <p style={{ color: '#909296', textAlign: 'center', marginBottom: '2rem' }}>
            You are about to access the admin panel. Click below to authenticate.
          </p>

          {error && <div style={styles.error}>{error}</div>}

          <button
            onClick={handleApply}
            style={{ ...styles.button, ...styles.buttonDanger, width: '100%', justifyContent: 'center' }}
          >
            Authenticate
          </button>
        </div>
      </div>
    )
  }

  // Show game code if we have it but haven't dismissed
  if (gameCode && !localStorage.getItem('admin_code_dismissed_' + gameCode)) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
        <GameCodeDisplay gameCode={gameCode} />
        <button
          style={{ ...styles.button, ...styles.buttonSuccess, width: '100%', justifyContent: 'center', marginTop: '1rem' }}
          onClick={() => {
            localStorage.setItem('admin_code_dismissed_' + gameCode, 'true')
            setGameCode('')
          }}
        >
          I've entered the code, continue to panel
        </button>
      </div>
    )
  }

  // Main admin panel
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <ShieldAlert size={24} color="#fa5252" /> Admin Panel
        </h1>
      </div>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'users' ? styles.tabActive : styles.tabInactive) }}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} style={{ marginRight: '0.5rem' }} /> Users
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'add' ? styles.tabActive : styles.tabInactive) }}
          onClick={() => setActiveTab('add')}
        >
          <UserPlus size={16} style={{ marginRight: '0.5rem' }} /> Add User
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'database' ? styles.tabActive : styles.tabInactive) }}
          onClick={() => setActiveTab('database')}
        >
          <Database size={16} style={{ marginRight: '0.5rem' }} /> Database
        </button>
      </div>

      {activeTab === 'users' && <UsersTab sessionId={sessionId} />}
      {activeTab === 'add' && <AddUserTab sessionId={sessionId} />}
      {activeTab === 'database' && <DatabaseTab sessionId={sessionId} />}
    </div>
  )
}
