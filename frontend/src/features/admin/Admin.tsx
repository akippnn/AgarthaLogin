import { useState } from 'react'
import { ShieldAlert, Users, UserPlus, Database } from 'lucide-react'
import { styles, colors } from '../../components/ui/styles'
import UsersTab from '../../components/admin/UsersTab'
import AddUserTab from '../../components/admin/AddUserTab'
import DatabaseTab from '../../components/admin/DatabaseTab'
import GameCodeDisplay from '../../components/admin/GameCodeDisplay'
import AuthPanel from '../../components/admin/AuthPanel'
import { Button } from '../../components/ui'
import type { AdminApplyResponse } from '../../lib/types'

const API_BASE = '/api'

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
    return <AuthPanel error={error} onAuthenticate={handleApply} />
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
