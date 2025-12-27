import React from 'react';
import { styles, colors } from './styles';

// Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  loading,
  icon,
  fullWidth,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    danger: styles.buttonDanger,
    success: styles.buttonSuccess,
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        ...styles.button,
        ...variantStyles[variant],
        width: fullWidth ? '100%' : undefined,
        justifyContent: fullWidth ? 'center' : undefined,
        opacity: (disabled || loading) ? 0.7 : 1,
        ...style,
      }}
    >
      {icon}
      {loading ? 'Loading...' : children}
    </button>
  );
}

// Input Component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function Input({ icon, style, ...props }: InputProps) {
  if (icon) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: colors.bgInput,
        borderRadius: '4px',
        padding: '0.5rem',
        border: `1px solid ${colors.bgHover}`
      }}>
        <span style={{ marginRight: '0.5rem', color: colors.textMuted }}>{icon}</span>
        <input
          {...props}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            width: '100%',
            outline: 'none',
            ...style,
          }}
        />
      </div>
    );
  }

  return <input {...props} style={{ ...styles.input, ...style }} />;
}

// Card Component
export interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, style }: CardProps) {
  return (
    <div style={{ ...styles.card, ...style }}>
      {children}
    </div>
  );
}

// Badge Component
export type BadgeVariant = 'premium' | 'cracked' | 'online' | 'offline';

export interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    premium: styles.badgePremium,
    cracked: styles.badgeCracked,
    online: styles.badgeOnline,
    offline: styles.badgeOffline,
  };

  return (
    <span style={{ ...styles.badge, ...variantStyles[variant] }}>
      {children}
    </span>
  );
}

// Modal Component
export interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export function Modal({ children }: ModalProps) {
  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        {children}
      </div>
    </div>
  );
}

// Alert Component
export type AlertType = 'error' | 'success';

export interface AlertProps {
  type: AlertType;
  children: React.ReactNode;
  onDismiss?: () => void;
}

export function Alert({ type, children, onDismiss }: AlertProps) {
  const alertStyle = type === 'error' ? styles.error : styles.success;

  return (
    <div style={alertStyle}>
      {children}
      {onDismiss && (
        <button
          style={{
            float: 'right',
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer'
          }}
          onClick={onDismiss}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ConfirmDialog Component
export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  requireType?: string;
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  onConfirm,
  onCancel,
  requireType,
  icon
}: ConfirmDialogProps) {
  const [typed, setTyped] = React.useState('');
  const canConfirm = !requireType || typed === requireType;

  return (
    <Modal>
      <h2 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon}
        {title}
      </h2>
      <p style={{ color: colors.textMuted, marginBottom: '1rem' }}>{message}</p>
      {requireType && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: colors.error, marginBottom: '0.5rem' }}>
            Type <strong>{requireType}</strong> to confirm:
          </p>
          <Input
            value={typed}
            onChange={e => setTyped(e.target.value)}
            placeholder={requireType}
          />
        </div>
      )}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={!canConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
