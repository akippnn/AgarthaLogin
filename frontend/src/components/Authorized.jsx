import { CheckCircle2 } from 'lucide-react'

export default function Authorized() {
  return (
    <div>
      <h1 style={{color:'white'}}>Success!</h1>
      <CheckCircle2 size={64} color="#40c057" style={{marginBottom:'1rem'}} />
      <p>You have been authorized in-game.</p>
      <p style={{color:'#aaa', marginTop:'1rem'}}>You may now close this window.</p>
    </div>
  )
}
