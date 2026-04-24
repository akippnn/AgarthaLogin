import { ComponentChildren } from 'preact';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-preact';

export type AdmonitionVariant = 'warning' | 'danger' | 'success' | 'info';

interface AdmonitionProps {
  variant?: AdmonitionVariant;
  title?: string;
  children: ComponentChildren;
  className?: string;
  icon?: ComponentChildren;
}

const icons = {
  warning: AlertTriangle,
  danger: XCircle,
  success: CheckCircle,
  info: Info,
};

export function Admonition({ variant = 'info', title, children, className = '', icon }: AdmonitionProps) {
  const Icon = icons[variant];

  const variantStyles = {
    warning: {
      bg: 'rgba(255, 171, 0, 0.1)',
      border: 'var(--color-warning)',
      text: 'var(--color-warning)',
    },
    danger: {
      bg: 'rgba(255, 82, 82, 0.1)',
      border: 'var(--color-danger)',
      text: 'var(--color-danger)',
    },
    success: {
      bg: 'rgba(105, 240, 174, 0.1)',
      border: 'var(--color-success)',
      text: '#69F0AE',
    },
    info: {
      bg: 'rgba(34, 139, 230, 0.1)',
      border: 'var(--color-primary)',
      text: 'var(--color-primary)',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`admonition ${className}`}
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '8px',
        padding: '1rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start',
        textAlign: 'left',
        color: 'var(--color-text-primary)',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: '2px', color: style.text }}>
        {icon || <Icon size={20} />}
      </div>
      <div style={{ flex: 1 }}>
        {title && (
          <h4
            style={{
              margin: '0 0 0.5rem 0',
              fontWeight: 600,
              fontSize: '1rem',
              lineHeight: 1.4,
              color: style.text,
            }}
          >
            {title}
          </h4>
        )}
        <div style={{ fontSize: '0.9rem', lineHeight: 1.5, opacity: 0.9 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
