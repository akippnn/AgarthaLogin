import { useState } from 'react'
import { ShieldAlert, Users, UserPlus, Database } from 'lucide-preact'
import UsersTab from '../../components/admin/UsersTab'
import AddUserTab from '../../components/admin/AddUserTab'
import DatabaseTab from '../../components/admin/DatabaseTab'
import GameCodeDisplay from '../../components/admin/GameCodeDisplay'
import AuthPanel from '../../components/admin/AuthPanel'
import { Button, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui'
import type { AdminVerifyResponse } from '../../lib/types'

const API_BASE = '/api'

interface AdminProps {
  token: string;
  onSuccess: () => void;
}

export default function Admin({ token, onSuccess }: AdminProps) {
  const [error, setError] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [sessionId, setSessionId] = useState('')

  const handleApply = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      const data: AdminVerifyResponse = await res.json()
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
      <div className="container" style={{ maxWidth: '500px' }}>
        <GameCodeDisplay gameCode={gameCode} />
        <Button
          variant="success"
          fullWidth
          className="mt-4"
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
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">
          <ShieldAlert size={24} className="text-danger-light" /> Admin Panel
        </h1>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">
            <Users size={16} className="mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="add">
            <UserPlus size={16} className="mr-2" /> Add User
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database size={16} className="mr-2" /> Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab sessionId={sessionId} />
        </TabsContent>
        <TabsContent value="add">
          <AddUserTab sessionId={sessionId} />
        </TabsContent>
        <TabsContent value="database">
          <DatabaseTab sessionId={sessionId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
