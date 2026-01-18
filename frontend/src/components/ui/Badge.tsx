import { ComponentChildren } from 'preact';

export interface BadgeProps {
  variant?: 'premium' | 'cracked' | 'online' | 'offline';
  children: ComponentChildren;
}

export function Badge({ variant = 'online', children }: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  );
}
