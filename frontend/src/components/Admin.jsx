import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'

export default function Admin({ token, onSuccess }) {
  const [error, setError] = useState('')
  const [gameCode, setGameCode] = useState('')

  const handleApply = async () => {
    try {
      const res = await fetch('/api/admin/apply', {
        method: 'POST',
        body: JSON.stringify({ token })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setGameCode(data.gameCode)
        onSuccess()
      } else {
        throw new Error(data.error || "Failed to apply")
      }
    } catch (e) {
      setError(e.message)
    }
  }

  if (gameCode) {
    return (
      <div>
        <h1 style={{color:'white'}}>Action Required</h1>
        <p>Please run the following command in-game:</p>
        <div style={{background:'#000', padding:'1rem', borderRadius:'4px', fontFamily:'monospace', margin:'1rem 0', color:'#40c057'}}>
          /agarthalogin apply {gameCode}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{color:'white'}}>Admin Panel</h1>
      <ShieldAlert size={48} color="#fa5252" style={{marginBottom:'1rem'}} />
      <p style={{marginBottom:'2rem'}}>You are about to perform a sensitive action.</p>
      
      {error && <div style={{color:'#ff6b6b', marginBottom:'1rem'}}>{error}</div>}

      <button 
        onClick={handleApply}
        style={{
          width:'100%', padding:'0.75rem', backgroundColor:'#e03131', color:'white', 
          border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'
        }}
      >
        Apply Changes
      </button>
    </div>
  )
}
