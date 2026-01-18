import { useState, useEffect, useCallback } from 'react'
import {
  Users, RefreshCw, Search, ChevronLeft, ChevronRight,
  Crown, User as UserIcon, UserMinus, Trash2, Check, X, AlertTriangle
} from 'lucide-preact'
import { Button, Input, Card, Badge, Alert, ConfirmDialog } from '../ui'

import type { User, UsersResponse } from '../../lib/types'
import UserModal from './UserModal'

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

const API_BASE = '/api'

export default function UsersTab({ sessionId }: UsersTabProps) {
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
        <Alert variant={message.type}>
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
          <span className="text-muted">{selectedUsers.size} selected</span>
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
        <table className="table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={selectedUsers.size === users.length && users.length > 0} onChange={toggleSelectAll} />
              </th>
              <th>Username</th>
              <th>Status</th>
              <th>2FA</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center' }}>No users found</td></tr>
            ) : users.map(user => (
              <tr key={user.uuid}>
                <td>
                  <input type="checkbox" checked={selectedUsers.has(user.username)} onChange={() => toggleSelect(user.username)} />
                </td>
                <td>{user.username}</td>
                <td>
                  {user.premium
                    ? <Badge variant="premium">Premium</Badge>
                    : <Badge variant="cracked">Cracked</Badge>}
                </td>
                <td>{user.has2fa ? <Check size={16} color="var(--color-success)" /> : <X size={16} color="#868e96" />}</td>
                <td>
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
          <span className="text-muted">Total: {total} users</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              icon={<ChevronLeft size={16} />}
            />
            <span style={{ color: 'var(--color-text-secondary)', padding: '0.5rem' }}>Page {page + 1}</span>
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
          icon={<AlertTriangle color="var(--color-danger-light)" />}
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
          icon={<AlertTriangle color="var(--color-danger-light)" />}
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
          icon={<AlertTriangle color="var(--color-danger-light)" />}
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
          icon={<AlertTriangle color="var(--color-danger-light)" />}
        />
      )}
    </div>
  )
}
