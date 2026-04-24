import { ComponentChildren, JSX } from 'preact';

export interface InputProps extends JSX.HTMLAttributes<HTMLInputElement> {
  icon?: ComponentChildren;
  value?: string | number;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}

export function Input({ icon, className = '', ...props }: InputProps) {
  return (
    <div className={`input-wrapper ${className}`}>
      {icon && <span className="input-icon">{icon}</span>}
      <input
        {...props}
        className="input-field"
      />
    </div>
  );
}
