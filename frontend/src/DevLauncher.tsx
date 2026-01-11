
import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { colors } from './components/ui/styles'
import { TextButton, Stack } from './components/ui'
import { setupMockApi } from './mock/mockApi'
import './index.css'

setupMockApi();

function DevDashboard() {

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bgDark,
      color: colors.textPrimary,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: colors.bgCard,
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
      }}>

        <h1 className="typography-heading">AgarthaLogin Dev Dashboard</h1>
        <p className="typography-subheading" style={{ marginBottom: '2rem' }}>
          Development environment active. Backend requests are mocked.
        </p>



        <Stack gap="1rem">
          <a href="/login.html" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: colors.bgHover, borderRadius: '4px', color: 'white' }}>
              <strong>Login Page</strong> <br />
              <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Standard login flow</span>
            </div>
          </a>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <a href="/register.html?premium=true" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem', background: colors.bgHover, borderRadius: '4px', color: 'white' }}>
                <strong>Register</strong> <br />
                <span style={{ fontSize: '0.8rem', color: colors.success }}>Premium User</span>
              </div>
            </a>
            <a href="/register.html?offline=true" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem', background: colors.bgHover, borderRadius: '4px', color: 'white' }}>
                <strong>Register</strong> <br />
                <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Offline User</span>
              </div>
            </a>
          </div>

          <a href="/admin.html" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: colors.bgHover, borderRadius: '4px', color: 'white' }}>
              <strong>Admin Panel</strong> <br />
              <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Admin dashboard and tools</span>
            </div>
          </a>

          <a href="/sessionauth.html" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '1rem', background: colors.bgHover, borderRadius: '4px', color: 'white' }}>
              <strong>Session Auth</strong> <br />
              <span style={{ fontSize: '0.8rem', color: colors.textMuted }}>Session validation page (Offline users)</span>
            </div>
          </a>
        </Stack>

      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DevDashboard />
  </React.StrictMode>,
)
