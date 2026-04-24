import { useState } from 'preact/hooks'
import { Database, RefreshCw, Download, Upload } from 'lucide-preact'
import { Button, Card, Admonition, Stack } from '../ui'

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
    setMessage(null)
    try {
      const res = await fetch(`${API_BASE}/admin/database/optimize`, {
        method: 'POST',
        headers: { 'X-Session-ID': sessionId }
      })
      const data: OptimizeResponse = await res.json()
      setOptimizeResult(data)
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="1.5rem">
      {message && (
        <Admonition variant="danger">
          {message.text}
        </Admonition>
      )}

      <Card>
        <Stack gap="1rem">
          <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Database size={20} /> Database Optimization
          </h2>
          <p className="text-muted">
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
            <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-dark)', borderRadius: '4px' }}>
              <Stack gap="0.5rem">
                <p className="text-secondary">Preferred Algorithm: <strong>{optimizeResult.preferredAlgo}</strong></p>
                <p className="text-secondary">Users with legacy hashes: <strong>{optimizeResult.usersNeedingConversion}</strong></p>
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>{optimizeResult.message}</p>
              </Stack>
            </div>
          )}
        </Stack>
      </Card>

      <Card>
        <Stack gap="1rem">
          <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Download size={20} /> Backup & Restore
          </h2>
          <p className="text-muted">
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
          <p style={{ color: 'var(--color-danger-light)', fontSize: '0.875rem' }}>
            ⚠️ Backup/Restore functionality coming soon
          </p>
        </Stack>
      </Card>
    </Stack>
  )
}
