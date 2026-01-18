import { ComponentChildren, JSX } from 'preact';

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  loading?: boolean;
  icon?: ComponentChildren;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: JSX.MouseEventHandler<HTMLButtonElement>;
}

export function Button({
  variant = 'primary',
  loading,
  icon,
  fullWidth,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const widthClass = fullWidth ? 'btn-full' : '';

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseClass} ${variantClass} ${widthClass} ${className}`}
    >
      {loading ? (
        <>Loading...</>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
