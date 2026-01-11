import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Button, Input, Stack } from '../../components/ui'
import { colors } from '../../components/ui/styles'
import type { LoginResponse } from '../../lib/types'
import { useTranslation } from 'react-i18next';

interface LoginProps {
  token: string;
  username: string;
  onSuccess: (sessionId: string | null) => void;
}

export default function Login({ token, username, onSuccess }: LoginProps) {
  const { t } = useTranslation();
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ token, password: pass })
      })
      const data: LoginResponse = await res.json()
      if (res.ok && data.success) {
        onSuccess(data.sessionId ?? null)
      } else {
        throw new Error(data.error || t("Login failed"))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h1 className="typography-heading">{t("Login")}</h1>
      <p style={{ marginBottom: '1rem' }}>{t("Welcome back,")} <b>{username}</b></p>

      {error && <div style={{ color: colors.error, marginBottom: '1rem' }}>{error}</div>}

      <Stack gap="1rem">
        <Input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder={t("Password")}
          icon={<KeyRound size={18} />}
          autoFocus
        />
        <Button
          type="submit"
          loading={loading}
          fullWidth
        >
          {loading ? t("Logging in...") : t("Login")}
        </Button>
      </Stack>
    </form>
  )
}
