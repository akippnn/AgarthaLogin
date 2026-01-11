import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button, Card } from '../ui'
import { colors } from '../ui/styles'

interface GameCodeDisplayProps {
  gameCode: string;
}

export default function GameCodeDisplay({ gameCode }: GameCodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const command = `/agarthalogin apply ${gameCode}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <h2 style={{ color: 'white', marginBottom: '1rem' }}>Action Required</h2>
      <p style={{ color: colors.textMuted, marginBottom: '1rem' }}>
        Run this command in-game to complete authentication:
      </p>
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        backgroundColor: colors.bgDark,
        padding: '1rem',
        borderRadius: '4px',
        fontFamily: 'monospace',
        alignItems: 'center'
      }}>
        <span style={{ color: colors.success, flex: 1 }}>{command}</span>
        <Button variant="secondary" onClick={copyToClipboard}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </Button>
      </div>
    </Card>
  )
}
