import React from 'react';
import { colors } from './colors';
import { inputStyle } from './styles';

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

  return <input {...props} style={{ ...inputStyle, ...style }} />;
}
