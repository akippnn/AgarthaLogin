import { useState } from 'react'
import { Database, RefreshCw, Download, Upload } from 'lucide-react'
import { Button, Card, Alert } from '../ui'
import { colors } from '../ui/styles'
import type { OptimizeResponse } from '../../lib/types'

interface DatabaseTabProps {
  sessionId: string;
}

interface Message {
  type: 'error' | 'success';
  text: string;
}

const API_BASE = '/api'

export default function DatabaseTab({ sessionId }: DatabaseTabProps) {
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
