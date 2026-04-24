import { useState } from 'preact/hooks'
import { ShieldCheck, LogOut } from 'lucide-preact'
import { Button, Stack, Admonition } from '../../components/ui'


import { useTranslation } from '../../lib/i18n';

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
    <Stack gap="1.5rem">
      <h1 className="typography-heading">{t("Welcome Back!")}</h1>

      <Stack gap="1rem" align="center">
        <ShieldCheck size={48} color="var(--color-success)" />
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '0.25rem' }}>{t("You are logged in as")} <b>{username}</b>.</p>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>{t("Do you want to authorize this game session?")}</p>
        </div>
      </Stack>

      {error && <Admonition variant="danger">{error}</Admonition>}

      <Stack gap="0.75rem">
        <Button
          onClick={handleConfirm}
          loading={loading}
          fullWidth
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
      </Stack>
    </Stack>
  )
}
