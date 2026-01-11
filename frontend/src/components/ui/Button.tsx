import React from 'react';
import {
  buttonStyle, buttonPrimaryStyle, buttonSecondaryStyle,
  buttonDangerStyle, buttonSuccessStyle
} from './styles';

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
    primary: buttonPrimaryStyle,
    secondary: buttonSecondaryStyle,
    danger: buttonDangerStyle,
    success: buttonSuccessStyle,
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        ...buttonStyle,
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
