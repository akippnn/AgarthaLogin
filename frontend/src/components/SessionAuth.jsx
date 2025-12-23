import { useState } from 'react'
import { ShieldCheck, LogOut } from 'lucide-react'

export default function SessionAuth({ token, sessionId, username, onSuccess, onLogout }) {
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
        throw new Error(data.error || "Authorization failed")
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 style={{color:'white', marginBottom:'1.5rem'}}>Welcome Back!</h1>
      <div style={{marginBottom:'2rem'}}>
        <ShieldCheck size={48} color="#40c057" style={{marginBottom:'1rem'}} />
        <p>You are logged in as <b>{username}</b>.</p>
        <p style={{color:'#aaa', fontSize:'0.9rem'}}>Do you want to authorize this game session?</p>
      </div>
      
      {error && <div style={{color:'#ff6b6b', marginBottom:'1rem'}}>{error}</div>}

      <button 
        onClick={handleConfirm} 
        disabled={loading}
        style={{
          width:'100%', padding:'0.75rem', backgroundColor:'#228be6', color:'white', 
          border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold', marginBottom:'0.5rem',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Authorizing...' : 'Yes, Authorize Game'}
      </button>
      
      <button 
        onClick={onLogout}
        style={{
          width:'100%', padding:'0.75rem', backgroundColor:'#343a40', color:'#e0e0e0', 
          border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold',
          display:'flex', justifyContent:'center', alignItems:'center', gap:'0.5rem'
        }}
      >
        <LogOut size={16} /> No, Logout
      </button>
    </div>
  )
}
