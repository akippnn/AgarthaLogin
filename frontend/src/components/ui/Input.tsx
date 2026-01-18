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
  if (icon) {
    return (
      <div className={`input-wrapper ${className}`}>
        <span className="input-icon">{icon}</span>
        <input
          {...props}
          className="input-field"
        />
      </div>
    );
  }

  return (
    <input
      {...props}
      className={`input-wrapper input-field ${className}`}
      style={{ display: 'block' }} // override flex display from input-wrapper if applied directly
    />
  );
}
