import { useState } from 'react'
import { UserPlus } from 'lucide-react'

export default function Register({ token, username, onSuccess }) {
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (p1 !== p2) return setError("Passwords do not match")
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

  return (
    <div>
      <h1 style={{color:'white', marginBottom:'1.5rem'}}>Register</h1>
      <p style={{marginBottom:'1rem'}}>Create account for <b>{username}</b></p>
      {error && <div style={{color:'#ff6b6b', marginBottom:'1rem'}}>{error}</div>}
      
      <div style={{marginBottom:'1rem'}}>
        <input 
          type="password" 
          value={p1} onChange={(e) => setP1(e.target.value)}
          placeholder="Password" 
          style={{width:'100%', padding:'0.75rem', borderRadius:'4px', background:'#2c2e33', border:'1px solid #373a40', color:'white', boxSizing:'border-box'}}
        />
      </div>
      <div style={{marginBottom:'1rem'}}>
        <input 
          type="password" 
          value={p2} onChange={(e) => setP2(e.target.value)}
          placeholder="Confirm Password" 
          style={{width:'100%', padding:'0.75rem', borderRadius:'4px', background:'#2c2e33', border:'1px solid #373a40', color:'white', boxSizing:'border-box'}}
        />
      </div>

      <button 
        onClick={handleSubmit} 
        disabled={loading}
        style={{
          width:'100%', padding:'0.75rem', backgroundColor:'#228be6', color:'white', 
          border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold', opacity: loading ? 0.7 : 1,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
        }}
      >
        <UserPlus size={18} /> {loading ? 'Registering...' : 'Register'}
      </button>
    </div>
  )
}
