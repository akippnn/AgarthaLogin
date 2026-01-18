import { ShieldAlert } from 'lucide-preact'
import { Button, Card, Alert } from '../ui'


interface AuthPanelProps {
  error: string;
  onAuthenticate: () => void;
}

export default function AuthPanel({ error, onAuthenticate }: AuthPanelProps) {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <h1 className="typography-heading" style={{ textAlign: 'center' }}>Admin Panel</h1>
      <Card>
        <ShieldAlert size={48} color="var(--color-danger-light)" style={{ display: 'block', margin: '0 auto 1rem' }} />
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          You are about to access the admin panel. Click below to authenticate.
        </p>

        {error && <Alert variant="error">{error}</Alert>}

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
