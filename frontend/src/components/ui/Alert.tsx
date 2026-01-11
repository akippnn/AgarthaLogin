import React from 'react';
import { errorStyle, successStyle } from './styles';

export type AlertType = 'error' | 'success';

export interface AlertProps {
  type: AlertType;
  children: React.ReactNode;
  onDismiss?: () => void;
}

export function Alert({ type, children, onDismiss }: AlertProps) {
  const alertStyle = type === 'error' ? errorStyle : successStyle;

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
