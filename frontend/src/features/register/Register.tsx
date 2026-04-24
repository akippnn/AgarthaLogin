import { useState, useEffect } from 'preact/hooks'
import { UserPlus, AlertTriangle, Crown, User, X } from 'lucide-preact'
import { Button, Input, TextButton, Stack, Admonition } from '../../components/ui'

import type { RegisterResponse, CheckPremiumResponse } from '../../lib/types'
import { useTranslation } from '../../lib/i18n';

type FlowState = 'loading' | 'choice' | 'premium-confirm' | 'cracked-register';

interface RegisterProps {
  token: string;
  username: string;
  onSuccess: (sessionId: string | null) => void;
}

export default function Register({ token, username, onSuccess }: RegisterProps) {
  const { t } = useTranslation();
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPremiumUsername, setIsPremiumUsername] = useState(false)

  // Flow states: 'loading' | 'choice' | 'premium-confirm' | 'cracked-register'
  const [flowState, setFlowState] = useState<FlowState>('loading')
  const [confirmUsername, setConfirmUsername] = useState('')
  const [suggestedUsername, setSuggestedUsername] = useState<string | undefined>()

  // Check if username is premium on load
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const res = await fetch(`/api/check-premium?username=${encodeURIComponent(username)}`)
        const data: CheckPremiumResponse = await res.json()
        if (data.isPremium) {
          setIsPremiumUsername(true)
          setSuggestedUsername(data.suggestedUsername)
          setFlowState('choice')
        } else {
          setFlowState('cracked-register')
        }
      } catch {
        // Default to offline registration if check fails
        setFlowState('cracked-register')
      }
    }
    checkPremium()
  }, [username])

  const handlePremiumRegister = async () => {
    if (confirmUsername !== username) {
      setError(t("Username doesn't match"))
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, asPremium: true })
      })
      const data: RegisterResponse = await res.json()
      if (res.ok && data.success) {
        onSuccess(data.sessionId ?? null)
      } else {
        throw new Error(data.error || t("Registration failed"))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleCrackedRegister = async () => {
    if (p1 !== p2) return setError(t("Passwords do not match"))
    if (!p1) return setError(t("Password is required"))

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: p1 })
      })
      const data: RegisterResponse = await res.json()
      if (res.ok && data.success) {
        onSuccess(data.sessionId ?? null)
      } else {
        throw new Error(data.error || t("Registration failed"))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (flowState === 'loading') {
    return (
      <div>
        <h1 className="typography-heading">{t("Register")}</h1>
        <p className="text-muted">{t("Checking username...")}</p>
      </div>
    )
  }

  // Premium username - show choice
  if (flowState === 'choice') {
    return (
      <Stack gap="1rem">
        <div>
          <h1 className="typography-heading">{t("Register")}</h1>
          <p>{t("Create account for")} <b>{username}</b></p>
        </div>

        <Admonition variant="warning" title={t("This is a Premium Username")}>
          <p className="typography-subheading">
            {t("The username")} <b style={{ color: 'white' }}>{username}</b> {t("is registered with Mojang/Microsoft.")}
          </p>
        </Admonition>

        <p className="text-secondary" style={{ textAlign: 'center' }}>
          {t("Do you own this Minecraft account?")}
        </p>

        <Stack gap="0.75rem">
          <Button
            onClick={() => setFlowState('premium-confirm')}
            fullWidth
            icon={<Crown size={18} />}
          >
            {t("I own this account")}
          </Button>
          <Button
            onClick={() => setFlowState('cracked-register')}
            variant="secondary"
            fullWidth
            icon={<User size={18} />}
          >
            {t("I do not own this account")}
          </Button>
        </Stack>
      </Stack>
    )
  }

  // Premium confirmation with friction
  if (flowState === 'premium-confirm') {
    const canConfirm = confirmUsername === username

    return (
      <form onSubmit={(e) => { e.preventDefault(); handlePremiumRegister(); }}>
        <Stack gap="1rem">
          <div className="flex-between">
            <h1 className="typography-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
              <AlertTriangle color="var(--color-danger-light)" size={24} /> {t("Warning")}
            </h1>
            <button
              type="button"
              onClick={() => { setFlowState('choice'); setConfirmUsername(''); setError('') }}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <Admonition variant="danger">
            <p style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>
              {t("If you do not own this Minecraft account, you will NOT be able to access this server.")}
            </p>
            <p className="typography-subheading" style={{ marginBottom: '0.5rem', color: 'inherit' }}>
              {t("Premium accounts authenticate automatically via Microsoft. If this is not your account,")}&nbsp;
              {t("you will be permanently unable to log in.")}
            </p>
            <p className="typography-subheading" style={{ color: 'inherit' }}>
              {t("If you have made a mistake, close this window and select \"I do not own this account\".")}
            </p>
          </Admonition>

          <Admonition variant="success">
            {t("If you own this account, you will not need to perform any login flows.")}
          </Admonition>

          <div>
            <label className="typography-label">
              {t("Type your username")} <b style={{ color: 'white' }}>{username}</b> {t("below to confirm:")}
            </label>
            <Input
              value={confirmUsername}
              onChange={(e) => setConfirmUsername(e.currentTarget.value)}
              autoComplete="off"
              placeholder={username}
            />
          </div>

          {error && <Admonition variant="danger">{error}</Admonition>}

          <Button
            type="submit"
            loading={loading}
            disabled={!canConfirm}
            fullWidth
            icon={<Crown size={18} />}
          >
            {loading ? t("Registering...") : t("Register as Premium")}
          </Button>

          <p className="text-muted" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
            {t("You will be automatically logged in on future visits.")}
          </p>

          <div style={{ textAlign: 'center' }}>
            <TextButton onClick={() => { setFlowState('choice'); setError('') }}>
              {t("← Back to options")}
            </TextButton>
          </div>
        </Stack>
      </form>
    )
  }

  // Cracked registration with password
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleCrackedRegister(); }}>
      <Stack gap="1rem">
        <div>
          <h1 className="typography-heading">{t("Register")}</h1>
          <p>{t("Create account for")} <b>{username}</b></p>
        </div>

        {isPremiumUsername && (
          <Admonition variant="danger">
            {t("Note that the username")} <b style={{ color: 'white' }}>{username}</b> {t("associated with this account can claim ownership. When this happens and you lose access, you will need to login as")} <b style={{ color: 'white' }}>{suggestedUsername || `${username}_`}</b> {t("when you are unable to sign in.")}
          </Admonition>
        )}

        {error && <Admonition variant="danger">{error}</Admonition>}

        <Stack gap="1rem">
          <Input
            type="password"
            value={p1}
            onChange={(e) => setP1(e.currentTarget.value)}
            placeholder={t("Password")}
          />
          <Input
            type="password"
            value={p2}
            onChange={(e) => setP2(e.currentTarget.value)}
            placeholder={t("Confirm Password")}
          />

          <Button
            type="submit"
            loading={loading}
            fullWidth
            icon={<UserPlus size={18} />}
          >
            {loading ? t("Registering...") : t("Register")}
          </Button>
        </Stack>

        {isPremiumUsername && (
          <div style={{ textAlign: 'center' }}>
            <TextButton onClick={() => { setFlowState('choice'); setError('') }}>
              {t("← Back to options")}
            </TextButton>
          </div>
        )}
      </Stack>
    </form>
  )
}
