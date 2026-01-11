import { ShieldAlert } from 'lucide-react'
import { Button, Card, Alert } from '../ui'
import { colors } from '../ui/styles'

interface AuthPanelProps {
  error: string;
  onAuthenticate: () => void;
}

export default function AuthPanel({ error, onAuthenticate }: AuthPanelProps) {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ color: 'white', marginBottom: '1rem', textAlign: 'center' }}>Admin Panel</h1>
      <Card>
        <ShieldAlert size={48} color={colors.dangerLight} style={{ display: 'block', margin: '0 auto 1rem' }} />
        <p style={{ color: colors.textMuted, textAlign: 'center', marginBottom: '2rem' }}>
          You are about to access the admin panel. Click below to authenticate.
        </p>

        {error && <Alert type="error">{error}</Alert>}

        <Button
          onClick={onAuthenticate}
          variant="danger"
          fullWidth
        >
          Authenticate
        </Button>
      </Card>
    </div>
  )
}
