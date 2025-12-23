import { useState } from 'react'
import { KeyRound } from 'lucide-react'

export default function Login({ token, username, onSuccess }) {
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
      const data = await res.json()
      if (res.ok && data.success) {
        onSuccess(data.sessionId)
      } else {
        throw new Error(data.error || "Login failed")
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 style={{color:'white', marginBottom:'1.5rem'}}>Login</h1>
      <p style={{marginBottom:'1rem'}}>Welcome back, <b>{username}</b></p>
      {error && <div style={{color:'#ff6b6b', marginBottom:'1rem'}}>{error}</div>}
      <div style={{display:'flex', alignItems:'center', background:'#2c2e33', borderRadius:'4px', padding:'0.5rem', marginBottom:'1rem', border:'1px solid #373a40'}}>
        <KeyRound size={18} style={{marginRight:'0.5rem', color:'#909296'}} />
        <input 
          type="password" 
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="Password" 
          style={{background:'transparent', border:'none', color:'white', width:'100%', outline:'none'}}
        />
      </div>
      <button 
        onClick={handleSubmit} 
        disabled={loading}
        style={{
          width:'100%', padding:'0.75rem', backgroundColor:'#228be6', color:'white', 
          border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold', opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  )
}
