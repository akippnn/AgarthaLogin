import { useState } from 'react'
import { ShieldCheck, LogOut } from 'lucide-react'
import { Button } from '../../components/ui'
import { colors } from '../../components/ui/styles'

import { useTranslation } from 'react-i18next';

interface SessionAuthProps {
  token: string;
  sessionId: string;
  username: string;
  onSuccess: (sessionId: string | null) => void;
  onLogout: () => void;
}

export default function SessionAuth({ token, sessionId, username, onSuccess, onLogout }: SessionAuthProps) {
  const { t } = useTranslation();
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/session-auth', {
        method: 'POST',
        headers: { 'X-Session-ID': sessionId },
        body: JSON.stringify({ token })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        onSuccess(null) // Keep existing session
      } else {
        throw new Error(data.error || t("Authorization failed"))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 style={{ color: 'white', marginBottom: '1.5rem' }}>{t("Welcome Back!")}</h1>
      <div style={{ marginBottom: '2rem' }}>
        <ShieldCheck size={48} color={colors.success} style={{ marginBottom: '1rem' }} />
        <p>{t("You are logged in as")} <b>{username}</b>.</p>
        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>{t("Do you want to authorize this game session?")}</p>
      </div>

      {error && <div style={{ color: colors.error, marginBottom: '1rem' }}>{error}</div>}

      <Button
        onClick={handleConfirm}
        loading={loading}
        fullWidth
        style={{ marginBottom: '0.5rem' }}
      >
        {loading ? t("Authorizing...") : t("Yes, Authorize Game")}
      </Button>

      <Button
        onClick={onLogout}
        variant="secondary"
        fullWidth
        icon={<LogOut size={16} />}
      >
        {t("No, Logout")}
      </Button>
    </div>
  )
}
