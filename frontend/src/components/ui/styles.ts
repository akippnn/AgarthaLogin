import React from 'react';
import { colors } from './colors';

export { colors };

export const containerStyle: React.CSSProperties = { 
  maxWidth: '1200px', 
  margin: '0 auto', 
  padding: '2rem' 
};

export const headerStyle: React.CSSProperties = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  marginBottom: '2rem' 
};

export const titleStyle: React.CSSProperties = { 
  color: 'white', 
  fontSize: '1.5rem', 
  fontWeight: 'bold', 
  display: 'flex', 
  alignItems: 'center', 
  gap: '0.5rem' 
};

export const tabsStyle: React.CSSProperties = { 
  display: 'flex', 
  gap: '1rem', 
  marginBottom: '2rem' 
};

export const tabStyle: React.CSSProperties = { 
  padding: '0.5rem 1rem', 
  border: 'none', 
  borderRadius: '4px', 
  cursor: 'pointer', 
  fontWeight: '500' 
};

export const tabActiveStyle: React.CSSProperties = { 
  backgroundColor: colors.primary, 
  color: 'white' 
};

export const tabInactiveStyle: React.CSSProperties = { 
  backgroundColor: colors.bgInput, 
  color: colors.textMuted 
};

export const cardStyle: React.CSSProperties = { 
  backgroundColor: colors.bgCard, 
  borderRadius: '8px', 
  padding: '1.5rem', 
  marginBottom: '1rem' 
};

export const inputStyle: React.CSSProperties = { 
  width: '100%', 
  padding: '0.75rem', 
  backgroundColor: colors.bgDark, 
  border: `1px solid ${colors.bgHover}`, 
  borderRadius: '4px', 
  color: 'white', 
  fontSize: '0.875rem',
  boxSizing: 'border-box' as const,
};

export const buttonStyle: React.CSSProperties = { 
  padding: '0.5rem 1rem', 
  border: 'none', 
  borderRadius: '4px', 
  cursor: 'pointer', 
  fontWeight: '500', 
  display: 'inline-flex', 
  alignItems: 'center', 
  gap: '0.5rem' 
};

export const buttonPrimaryStyle: React.CSSProperties = { 
  backgroundColor: colors.primary, 
  color: 'white' 
};

export const buttonDangerStyle: React.CSSProperties = { 
  backgroundColor: colors.danger, 
  color: 'white' 
};

export const buttonSuccessStyle: React.CSSProperties = { 
  backgroundColor: colors.success, 
  color: 'white' 
};

export const buttonSecondaryStyle: React.CSSProperties = { 
  backgroundColor: colors.bgHover, 
  color: 'white' 
};

export const tableStyle: React.CSSProperties = { 
  width: '100%', 
  borderCollapse: 'collapse' 
};

export const thStyle: React.CSSProperties = { 
  textAlign: 'left', 
  padding: '0.75rem', 
  borderBottom: `1px solid ${colors.bgHover}`, 
  color: colors.textMuted, 
  fontSize: '0.75rem', 
  textTransform: 'uppercase' 
};

export const tdStyle: React.CSSProperties = { 
  padding: '0.75rem', 
  borderBottom: `1px solid ${colors.bgInput}`, 
  color: colors.textSecondary 
};

export const badgeStyle: React.CSSProperties = { 
  padding: '0.25rem 0.5rem', 
  borderRadius: '4px', 
  fontSize: '0.75rem', 
  fontWeight: '500' 
};

export const badgePremiumStyle: React.CSSProperties = { 
  backgroundColor: colors.warning, 
  color: colors.bgDark 
};

export const badgeCrackedStyle: React.CSSProperties = { 
  backgroundColor: '#495057', 
  color: 'white' 
};

export const badgeOnlineStyle: React.CSSProperties = { 
  backgroundColor: colors.success, 
  color: 'white' 
};

export const badgeOfflineStyle: React.CSSProperties = { 
  backgroundColor: '#868e96', 
  color: 'white' 
};

export const modalStyle: React.CSSProperties = { 
  position: 'fixed', 
  inset: 0, 
  backgroundColor: 'rgba(0,0,0,0.8)', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  zIndex: 1000 
};

export const modalContentStyle: React.CSSProperties = { 
  backgroundColor: colors.bgCard, 
  borderRadius: '8px', 
  padding: '2rem', 
  maxWidth: '500px', 
  width: '90%', 
  maxHeight: '80vh', 
  overflow: 'auto' 
};

export const errorStyle: React.CSSProperties = { 
  color: colors.error, 
  marginBottom: '1rem', 
  padding: '0.75rem', 
  backgroundColor: 'rgba(255,107,107,0.1)', 
  borderRadius: '4px' 
};

export const successStyle: React.CSSProperties = { 
  color: colors.success, 
  marginBottom: '1rem', 
  padding: '0.75rem', 
  backgroundColor: 'rgba(64,192,87,0.1)', 
  borderRadius: '4px' 
};

// Deprecated: For backward compatibility during refactor, but we should verify if we can remove it.
// Admin utils might rely on `styles.something`.
export const styles = {
  container: containerStyle,
  header: headerStyle,
  title: titleStyle,
  tabs: tabsStyle,
  tab: tabStyle,
  tabActive: tabActiveStyle,
  tabInactive: tabInactiveStyle,
  card: cardStyle,
  input: inputStyle,
  button: buttonStyle,
  buttonPrimary: buttonPrimaryStyle,
  buttonDanger: buttonDangerStyle,
  buttonSuccess: buttonSuccessStyle,
  buttonSecondary: buttonSecondaryStyle,
  table: tableStyle,
  th: thStyle,
  td: tdStyle,
  badge: badgeStyle,
  badgePremium: badgePremiumStyle,
  badgeCracked: badgeCrackedStyle,
  badgeOnline: badgeOnlineStyle,
  badgeOffline: badgeOfflineStyle,
  modal: modalStyle,
  modalContent: modalContentStyle,
  error: errorStyle,
  success: successStyle,
};
