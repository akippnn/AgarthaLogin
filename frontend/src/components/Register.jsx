import { useState, useEffect } from 'react'
import { UserPlus, AlertTriangle, Crown, User, X } from 'lucide-react'

export default function Register({ token, username, onSuccess }) {
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPremiumUsername, setIsPremiumUsername] = useState(false)

  // Flow states: 'loading' | 'choice' | 'premium-confirm' | 'cracked-register'
  const [flowState, setFlowState] = useState('loading')
  const [confirmUsername, setConfirmUsername] = useState('')

  // Check if username is premium on load
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const res = await fetch(`/api/check-premium?username=${encodeURIComponent(username)}`)
        const data = await res.json()
        if (data.isPremium) {
          setIsPremiumUsername(true)
          setFlowState('choice')
        } else {
          setFlowState('cracked-register')
        }
      } catch (e) {
        // Default to cracked registration if check fails
        setFlowState('cracked-register')
      }
    }
    checkPremium()
  }, [username])

  const handlePremiumRegister = async () => {
    if (confirmUsername !== username) {
      setError("Username doesn't match")
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
      const data = await res.json()
      if (res.ok && data.success) {
        onSuccess(data.sessionId)
      } else {
        throw new Error(data.error || "Registration failed")
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCrackedRegister = async () => {
    if (p1 !== p2) return setError("Passwords do not match")
    if (!p1) return setError("Password is required")

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: p1 })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        onSuccess(data.sessionId)
      } else {
        throw new Error(data.error || "Registration failed")
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (flowState === 'loading') {
    return (
      <div>
        <h1 style={{ color: 'white', marginBottom: '1.5rem' }}>Register</h1>
        <p style={{ color: '#909296' }}>Checking username...</p>
      </div>
    )
  }

  // Premium username - show choice
  if (flowState === 'choice') {
    return (
      <div>
        <h1 style={{ color: 'white', marginBottom: '1rem' }}>Register</h1>
        <p style={{ marginBottom: '1rem' }}>Create account for <b>{username}</b></p>

        <div style={{ background: 'rgba(250,176,5,0.1)', border: '1px solid #fab005', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <p style={{ color: '#fab005', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={18} /> This is a Premium Username
          </p>
          <p style={{ color: '#909296', fontSize: '0.9rem' }}>
            The username <b style={{ color: 'white' }}>{username}</b> is registered with Mojang/Microsoft.
          </p>
        </div>

        <p style={{ color: '#c1c2c5', marginBottom: '1rem', textAlign: 'center' }}>
          Do you own this Minecraft account?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => setFlowState('premium-confirm')}
            style={{
              width: '100%', padding: '1rem', backgroundColor: '#228be6', color: 'white',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <Crown size={18} /> I own this account
          </button>
          <button
            onClick={() => setFlowState('cracked-register')}
            style={{
              width: '100%', padding: '1rem', backgroundColor: '#373a40', color: 'white',
              border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}
          >
            <User size={18} /> I do not own this account
          </button>
        </div>
      </div>
    )
  }

  // Premium confirmation with friction
  if (flowState === 'premium-confirm') {
    const canConfirm = confirmUsername === username

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle color="#fa5252" size={24} /> Warning
          </h1>
          <button
            onClick={() => { setFlowState('choice'); setConfirmUsername(''); setError('') }}
            style={{ background: 'none', border: 'none', color: '#909296', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ background: 'rgba(250,82,82,0.1)', border: '1px solid #fa5252', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', textAlign: 'left' }}>
          <p style={{ color: '#fa5252', fontWeight: 'bold', marginBottom: '0.75rem' }}>
            If you do not own this Minecraft account, you will NOT be able to access this server.
          </p>
          <p style={{ color: '#909296', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Premium accounts authenticate automatically via Microsoft. If this is not your account,
            you will be locked out when the real owner logs in.
          </p>
          <p style={{ color: '#909296', fontSize: '0.9rem' }}>
            If you have made a mistake, close this window and select "I do not own this account".
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#c1c2c5', display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Type your username <b style={{ color: 'white' }}>{username}</b> below to confirm:
          </label>
          <input
            type="text"
            value={confirmUsername}
            onChange={(e) => setConfirmUsername(e.target.value)}
            autoComplete="off"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#2c2e33', border: '1px solid #373a40', color: 'white', boxSizing: 'border-box' }}
          />
        </div>

        {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>}

        <button
          onClick={handlePremiumRegister}
          disabled={loading || !canConfirm}
          style={{
            width: '100%', padding: '0.75rem',
            backgroundColor: canConfirm ? '#228be6' : '#495057',
            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
            opacity: canConfirm ? 1 : 0.5,
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <Crown size={18} /> {loading ? 'Registering...' : 'Register as Premium'}
        </button>

        <p style={{ color: '#909296', fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center' }}>
          You will be automatically logged in via Microsoft on future visits.
        </p>
      </div>
    )
  }

  // Cracked registration with password
  return (
    <div>
      <h1 style={{ color: 'white', marginBottom: '1.5rem' }}>Register</h1>
      <p style={{ marginBottom: '1rem' }}>Create account for <b>{username}</b></p>

      {isPremiumUsername && (
        <div style={{ background: 'rgba(73,80,87,0.3)', border: '1px solid #495057', borderRadius: '4px', padding: '0.75rem', marginBottom: '1rem' }}>
          <p style={{ color: '#909296', fontSize: '0.875rem', margin: 0 }}>
            Registering with password. You will need to log in manually each time.
          </p>
        </div>
      )}

      {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="password"
          value={p1} onChange={(e) => setP1(e.target.value)}
          placeholder="Password"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#2c2e33', border: '1px solid #373a40', color: 'white', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="password"
          value={p2} onChange={(e) => setP2(e.target.value)}
          placeholder="Confirm Password"
          style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#2c2e33', border: '1px solid #373a40', color: 'white', boxSizing: 'border-box' }}
        />
      </div>

      <button
        onClick={handleCrackedRegister}
        disabled={loading}
        style={{
          width: '100%', padding: '0.75rem', backgroundColor: '#228be6', color: 'white',
          border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: loading ? 0.7 : 1,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
        }}
      >
        <UserPlus size={18} /> {loading ? 'Registering...' : 'Register'}
      </button>

      {isPremiumUsername && (
        <button
          onClick={() => { setFlowState('choice'); setError('') }}
          style={{
            width: '100%', padding: '0.5rem', backgroundColor: 'transparent', color: '#909296',
            border: 'none', cursor: 'pointer', marginTop: '0.75rem', fontSize: '0.875rem'
          }}
        >
          ← Back to options
        </button>
      )}
    </div>
  )
}
