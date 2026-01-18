import { render } from 'preact'
import { Stack } from './components/ui'
import { setupMockApi } from './mock/mockApi'
import './index.css'

setupMockApi();

function DevDashboard() {

  return (
    <div className="min-h-screen bg-dark text-primary flex-center" style={{ flexDirection: 'column', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '2rem' }}>

        <h1 className="typography-heading">AgarthaLogin Dev Dashboard</h1>
        <p className="typography-subheading" style={{ marginBottom: '2rem' }}>
          Development environment active. Backend requests are mocked.
        </p>

        <Stack gap="1rem">
          <a href="/login.html" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: 'var(--color-bg-hover)', borderRadius: '4px', color: 'white' }}>
              <strong>Login Page</strong> <br />
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Standard login flow</span>
            </div>
          </a>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <a href="/register.html?premium=true" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem', background: 'var(--color-bg-hover)', borderRadius: '4px', color: 'white' }}>
                <strong>Register</strong> <br />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>Premium User</span>
              </div>
            </a>
            <a href="/register.html?offline=true" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem', background: 'var(--color-bg-hover)', borderRadius: '4px', color: 'white' }}>
                <strong>Register</strong> <br />
                <span className="text-secondary" style={{ fontSize: '0.8rem' }}>Offline User</span>
              </div>
            </a>
          </div>

          <a href="/admin.html" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: 'var(--color-bg-hover)', borderRadius: '4px', color: 'white' }}>
              <strong>Admin Panel</strong> <br />
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Admin dashboard and tools</span>
            </div>
          </a>

          <a href="/sessionauth.html" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: 'var(--color-bg-hover)', borderRadius: '4px', color: 'white' }}>
              <strong>Session Auth</strong> <br />
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Session validation page (Offline users)</span>
            </div>
          </a>

          <a href="/error.html?code=401&message=Unauthorized%20Access" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: 'var(--color-bg-hover)', borderRadius: '4px', color: 'white' }}>
              <strong>Error Page</strong> <br />
              <span className="text-danger" style={{ fontSize: '0.8rem', color: '#ff6b6b' }}>Preview 401 Error</span>
            </div>
          </a>
        </Stack>

      </div>
    </div>
  )
}

render(<DevDashboard />, document.getElementById('root')!)
