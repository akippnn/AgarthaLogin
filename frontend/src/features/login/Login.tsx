import { useState } from 'preact/hooks'
import { JSX } from 'preact'
import { KeyRound, Crown } from 'lucide-preact'
import { Button, Input, Stack, Admonition } from '../../components/ui'

import type { LoginResponse } from '../../lib/types'
import { useTranslation } from '../../lib/i18n';

interface LoginProps {
  token: string;
  username: string;
  isPremium: boolean;
  onSuccess: (sessionId: string | null) => void;
}

export default function Login({ token, username, isPremium, onSuccess }: LoginProps) {
  const { t } = useTranslation();
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [premiumLoading, setPremiumLoading] = useState(false)

  const handleSubmit = async (isPremiumAuth = false) => {
    if (isPremiumAuth) setPremiumLoading(true)
    else setLoading(true)
    
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          password: isPremiumAuth ? undefined : pass,
          asPremium: isPremiumAuth
        })
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
      setPremiumLoading(false)
    }
  }

  return (
    <Stack gap="1.5rem">
      <div>
        <h1 className="typography-heading">{t("Login")}</h1>
        <p>{t("Welcome back,")} <b>{username}</b></p>
      </div>

      {error && <Admonition variant="danger">{error}</Admonition>}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <Stack gap="1rem">
          <Input
            type="password"
            value={pass}
            onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setPass(e.currentTarget.value)}
            placeholder={t("Password")}
            icon={<KeyRound size={18} />}
            autoFocus
          />
          <Button
            type="submit"
            loading={loading}
            disabled={premiumLoading}
            fullWidth
          >
            {loading ? t("Logging in...") : t("Login")}
          </Button>
        </Stack>
      </form>

      {isPremium && (
        <Stack gap="1rem">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-bg-hover)' }} />
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>{t("OR")}</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-bg-hover)' }} />
          </div>

          <Button
            variant="secondary"
            onClick={() => handleSubmit(true)}
            loading={premiumLoading}
            disabled={loading}
            fullWidth
            icon={<Crown size={18} color="var(--color-warning)" />}
          >
            {t("Login as Premium")}
          </Button>
          <p className="text-muted" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
            {t("Verify ownership via Microsoft to bypass password.")}
          </p>
        </Stack>
      )}
    </Stack>
  )
}
