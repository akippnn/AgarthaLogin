import React from 'react';

// Shared style constants for consistent UI theming
export const colors = {
  // Background colors
  bgDark: '#1a1b1e',
  bgCard: '#25262b',
  bgInput: '#2c2e33',
  bgHover: '#373a40',
  
  // Text colors
  textPrimary: '#e0e0e0',
  textSecondary: '#c1c2c5',
  textMuted: '#909296',
  textWhite: 'white',
  
  // Accent colors
  primary: '#228be6',
  success: '#40c057',
  danger: '#e03131',
  dangerLight: '#fa5252',
  warning: '#fab005',
  
  // Status colors
  error: '#ff6b6b',
} as const;

export const styles: Record<string, React.CSSProperties> = {
  container: { 
    maxWidth: '1200px', 
    margin: '0 auto', 
    padding: '2rem' 
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '2rem' 
  },
  title: { 
    color: 'white', 
    fontSize: '1.5rem', 
    fontWeight: 'bold', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem' 
  },
  tabs: { 
    display: 'flex', 
    gap: '1rem', 
    marginBottom: '2rem' 
  },
  tab: { 
    padding: '0.5rem 1rem', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontWeight: '500' 
  },
  tabActive: { 
    backgroundColor: colors.primary, 
    color: 'white' 
  },
  tabInactive: { 
    backgroundColor: colors.bgInput, 
    color: colors.textMuted 
  },
  card: { 
    backgroundColor: colors.bgCard, 
    borderRadius: '8px', 
    padding: '1.5rem', 
    marginBottom: '1rem' 
  },
  input: { 
    width: '100%', 
    padding: '0.75rem', 
    backgroundColor: colors.bgDark, 
    border: `1px solid ${colors.bgHover}`, 
    borderRadius: '4px', 
    color: 'white', 
    fontSize: '0.875rem',
    boxSizing: 'border-box' as const,
  },
  button: { 
    padding: '0.5rem 1rem', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontWeight: '500', 
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: '0.5rem' 
  },
  buttonPrimary: { 
    backgroundColor: colors.primary, 
    color: 'white' 
  },
  buttonDanger: { 
    backgroundColor: colors.danger, 
    color: 'white' 
  },
  buttonSuccess: { 
    backgroundColor: colors.success, 
    color: 'white' 
  },
  buttonSecondary: { 
    backgroundColor: colors.bgHover, 
    color: 'white' 
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse' 
  },
  th: { 
    textAlign: 'left', 
    padding: '0.75rem', 
    borderBottom: `1px solid ${colors.bgHover}`, 
    color: colors.textMuted, 
    fontSize: '0.75rem', 
    textTransform: 'uppercase' 
  },
  td: { 
    padding: '0.75rem', 
    borderBottom: `1px solid ${colors.bgInput}`, 
    color: colors.textSecondary 
  },
  badge: { 
    padding: '0.25rem 0.5rem', 
    borderRadius: '4px', 
    fontSize: '0.75rem', 
    fontWeight: '500' 
  },
  badgePremium: { 
    backgroundColor: colors.warning, 
    color: colors.bgDark 
  },
  badgeCracked: { 
    backgroundColor: '#495057', 
    color: 'white' 
  },
  badgeOnline: { 
    backgroundColor: colors.success, 
    color: 'white' 
  },
  badgeOffline: { 
    backgroundColor: '#868e96', 
    color: 'white' 
  },
  modal: { 
    position: 'fixed', 
    inset: 0, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 1000 
  },
  modalContent: { 
    backgroundColor: colors.bgCard, 
    borderRadius: '8px', 
    padding: '2rem', 
    maxWidth: '500px', 
    width: '90%', 
    maxHeight: '80vh', 
    overflow: 'auto' 
  },
  error: { 
    color: colors.error, 
    marginBottom: '1rem', 
    padding: '0.75rem', 
    backgroundColor: 'rgba(255,107,107,0.1)', 
    borderRadius: '4px' 
  },
  success: { 
    color: colors.success, 
    marginBottom: '1rem', 
    padding: '0.75rem', 
    backgroundColor: 'rgba(64,192,87,0.1)', 
    borderRadius: '4px' 
  },
};
