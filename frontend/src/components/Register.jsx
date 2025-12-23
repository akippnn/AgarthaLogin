import { useState, useEffect } from 'react'
import { UserPlus, AlertTriangle, Crown } from 'lucide-react'

export default function Register({ token, username, onSuccess }) {
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPremiumUsername, setIsPremiumUsername] = useState(false)
  const [showPremiumWarning, setShowPremiumWarning] = useState(false)
  const [confirmUsername, setConfirmUsername] = useState('')

  // Check if username is premium on load
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const res = await fetch(`/api/check-premium?username=${encodeURIComponent(username)}`)
        const data = await res.json()
        if (data.isPremium) {
          setIsPremiumUsername(true)
        }
      } catch (e) {
        // Ignore - not critical
      }
    }
    checkPremium()
  }, [username])

  const handleSubmit = async () => {
    if (p1 !== p2) return setError("Passwords do not match")

    // If premium username and not yet confirmed, show warning
    if (isPremiumUsername && !showPremiumWarning) {
      setShowPremiumWarning(true)
      return
    }

    // If premium and confirming, check username match
    if (isPremiumUsername && confirmUsername !== username) {
      setError("Username doesn't match. Type exactly: " + username)
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
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

  // Premium username warning modal
  if (showPremiumWarning) {
    return (
      <div>
        <h1 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <AlertTriangle color="#fa5252" size={24} /> Warning
        </h1>

        <div style={{ background: 'rgba(250,82,82,0.1)', border: '1px solid #fa5252', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', textAlign: 'left' }}>
          <p style={{ color: '#fa5252', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={18} /> This is a Premium Username
          </p>
          <p style={{ color: '#909296', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            The username <b style={{ color: 'white' }}>{username}</b> is registered with Mojang/Microsoft.
          </p>
          <p style={{ color: '#909296', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            If you own this account:
          </p>
          <ul style={{ color: '#909296', fontSize: '0.9rem', paddingLeft: '1.5rem', marginBottom: '0.5rem' }}>
            <li>Sign in to <b>Microsoft</b> before opening Minecraft</li>
            <li>Your account will be verified automatically</li>
            <li>You won't need to register a password</li>
          </ul>
          <p style={{ color: '#fa5252', fontSize: '0.9rem', fontWeight: 'bold' }}>
            Only continue if you're sure you cannot access the Microsoft account.
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#909296', display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Type <b style={{ color: 'white' }}>{username}</b> to confirm:
          </label>
          <input
            type="text"
            value={confirmUsername}
            onChange={(e) => setConfirmUsername(e.target.value)}
            placeholder={username}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', background: '#2c2e33', border: '1px solid #373a40', color: 'white', boxSizing: 'border-box' }}
          />
        </div>

        {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowPremiumWarning(false)}
            style={{
              flex: 1, padding: '0.75rem', backgroundColor: '#373a40', color: 'white',
              border: 'none', borderRadius: '4px', cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || confirmUsername !== username}
            style={{
              flex: 1, padding: '0.75rem', backgroundColor: confirmUsername === username ? '#e03131' : '#495057',
              color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
              opacity: confirmUsername !== username ? 0.5 : 1
            }}
          >
            {loading ? 'Registering...' : 'Confirm & Register'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ color: 'white', marginBottom: '1.5rem' }}>Register</h1>
      <p style={{ marginBottom: '1rem' }}>Create account for <b>{username}</b></p>

      {isPremiumUsername && (
        <div style={{ background: 'rgba(250,82,82,0.1)', border: '1px solid #fa5252', borderRadius: '4px', padding: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Crown size={16} color="#fa5252" />
          <span style={{ color: '#fa5252', fontSize: '0.875rem' }}>This is a premium username</span>
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
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%', padding: '0.75rem', backgroundColor: '#228be6', color: 'white',
          border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: loading ? 0.7 : 1,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
        }}
      >
        <UserPlus size={18} /> {loading ? 'Registering...' : 'Register'}
      </button>
    </div>
  )
}
