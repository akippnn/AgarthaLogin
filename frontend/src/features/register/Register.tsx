import { useState, useEffect } from 'react'
import { UserPlus, AlertTriangle, Crown, User, X } from 'lucide-react'
import { Button, Input } from '../../components/ui'
import { colors } from '../../components/ui/styles'
import type { RegisterResponse, CheckPremiumResponse } from '../../lib/types'
import { useTranslation } from 'react-i18next';

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

  // Check if username is premium on load
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const res = await fetch(`/api/check-premium?username=${encodeURIComponent(username)}`)
        const data: CheckPremiumResponse = await res.json()
        if (data.isPremium) {
          setIsPremiumUsername(true)
          setFlowState('choice')
        } else {
          setFlowState('cracked-register')
        }
      } catch {
        // Default to cracked registration if check fails
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
        <h1 style={{ color: 'white', marginBottom: '1.5rem' }}>{t("Register")}</h1>
        <p style={{ color: colors.textMuted }}>{t("Checking username...")}</p>
      </div>
    )
  }

  // Premium username - show choice
  if (flowState === 'choice') {
    return (
      <div>
        <h1 style={{ color: 'white', marginBottom: '1rem' }}>{t("Register")}</h1>
        <p style={{ marginBottom: '1rem' }}>{t("Create account for")} <b>{username}</b></p>

        <div style={{ background: 'rgba(250,176,5,0.1)', border: `1px solid ${colors.warning}`, borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <p style={{ color: colors.warning, fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={18} /> {t("This is a Premium Username")}
          </p>
          <p style={{ color: colors.textMuted, fontSize: '0.9rem' }}>
            {t("The username")} <b style={{ color: 'white' }}>{username}</b> {t("is registered with Mojang/Microsoft.")}
          </p>
        </div>

        <p style={{ color: colors.textSecondary, marginBottom: '1rem', textAlign: 'center' }}>
          {t("Do you own this Minecraft account?")}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
        </div>
      </div>
    )
  }

  // Premium confirmation with friction
  if (flowState === 'premium-confirm') {
    const canConfirm = confirmUsername === username

    return (
      <form onSubmit={(e) => { e.preventDefault(); handlePremiumRegister(); }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle color={colors.dangerLight} size={24} /> {t("Warning")}
          </h1>
          <button
            type="button"
            onClick={() => { setFlowState('choice'); setConfirmUsername(''); setError('') }}
            style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ background: 'rgba(250,82,82,0.1)', border: `1px solid ${colors.dangerLight}`, borderRadius: '8px', padding: '1rem', marginBottom: '1rem', textAlign: 'left' }}>
          <p style={{ color: colors.dangerLight, fontWeight: 'bold', marginBottom: '0.75rem' }}>
            {t("If you do not own this Minecraft account, you will NOT be able to access this server.")}
          </p>
          <p style={{ color: colors.textMuted, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            {t("Premium accounts authenticate automatically via Microsoft. If this is not your account,")}
            {t("you will be locked out when the real owner logs in.")}
          </p>
          <p style={{ color: colors.textMuted, fontSize: '0.9rem' }}>
            {t("If you have made a mistake, close this window and select \"I do not own this account\".")}
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: colors.textSecondary, display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            {t("Type your username")} <b style={{ color: 'white' }}>{username}</b> {t("below to confirm:")}
          </label>
          <Input
            type="text"
            value={confirmUsername}
            onChange={(e) => setConfirmUsername(e.target.value)}
            autoComplete="off"
            autoFocus
          />
        </div>

        {error && <div style={{ color: colors.error, marginBottom: '1rem' }}>{error}</div>}

        <Button
          type="submit"
          loading={loading}
          disabled={!canConfirm}
          fullWidth
          icon={<Crown size={18} />}
        >
          {loading ? t("Registering...") : t("Register as Premium")}
        </Button>

        <p style={{ color: colors.textMuted, fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center' }}>
          {t("You will be automatically logged in via Microsoft on future visits.")}
        </p>
      </form>
    )
  }

  // Cracked registration with password
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleCrackedRegister(); }}>
      <h1 style={{ color: 'white', marginBottom: '1.5rem' }}>{t("Register")}</h1>
      <p style={{ marginBottom: '1rem' }}>{t("Create account for")} <b>{username}</b></p>

      {isPremiumUsername && (
        <div style={{ background: 'rgba(73,80,87,0.3)', border: '1px solid #495057', borderRadius: '4px', padding: '0.75rem', marginBottom: '1rem' }}>
          <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: 0 }}>
            {t("Registering with password. You will need to log in manually each time.")}
          </p>
        </div>
      )}

      {error && <div style={{ color: colors.error, marginBottom: '1rem' }}>{error}</div>}

      <div style={{ marginBottom: '1rem' }}>
        <Input
          type="password"
          value={p1}
          onChange={(e) => setP1(e.target.value)}
          placeholder={t("Password")}
          autoFocus
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <Input
          type="password"
          value={p2}
          onChange={(e) => setP2(e.target.value)}
          placeholder={t("Confirm Password")}
        />
      </div>

      <Button
        type="submit"
        loading={loading}
        fullWidth
        icon={<UserPlus size={18} />}
      >
        {loading ? t("Registering...") : t("Register")}
      </Button>

      {isPremiumUsername && (
        <button
          type="button"
          onClick={() => { setFlowState('choice'); setError('') }}
          style={{
            width: '100%', padding: '0.5rem', backgroundColor: 'transparent', color: colors.textMuted,
            border: 'none', cursor: 'pointer', marginTop: '0.75rem', fontSize: '0.875rem'
          }}
        >
          {t("← Back to options")}
        </button>
      )}
    </form>
  )
}
