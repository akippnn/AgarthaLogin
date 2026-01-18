import { ComponentChildren, JSX } from 'preact';

export interface TextButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  children: ComponentChildren;
}

export function TextButton({ style, className = '', children, ...props }: TextButtonProps) {
  return (
    <button
      type="button"
      className={`text-button ${className}`}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        color: 'var(--color-primary)',
        cursor: 'pointer',
        textDecoration: 'underline',
        fontSize: '0.875rem',
        ...(typeof style === 'object' ? style : {})
      }}
      {...props}
    >
      {children}
    </button>
  );
}
