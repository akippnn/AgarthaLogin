
import React from 'react';
import { colors } from './styles';

interface TextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function TextButton({ icon, children, style, ...props }: TextButtonProps) {
  return (
    <button
      type="button"
      style={{
        width: '100%',
        padding: '0.5rem',
        backgroundColor: 'transparent',
        color: colors.textMuted,
        border: 'none',
        cursor: 'pointer',
        marginTop: '0.75rem',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        ...style
      }}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
