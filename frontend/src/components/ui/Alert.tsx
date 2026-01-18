import { ComponentChildren } from 'preact';

export interface AlertProps {
  variant?: 'error' | 'success';
  children: ComponentChildren;
}

export function Alert({ variant = 'error', children }: AlertProps) {
  return (
    <div className={`alert-${variant}`}>
      {children}
    </div>
  );
}
