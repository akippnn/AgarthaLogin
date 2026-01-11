import React from 'react';
import {
  badgeStyle, badgePremiumStyle, badgeCrackedStyle,
  badgeOnlineStyle, badgeOfflineStyle
} from './styles';

export type BadgeVariant = 'premium' | 'cracked' | 'online' | 'offline';

export interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    premium: badgePremiumStyle,
    cracked: badgeCrackedStyle,
    online: badgeOnlineStyle,
    offline: badgeOfflineStyle,
  };

  return (
    <span style={{ ...badgeStyle, ...variantStyles[variant] }}>
      {children}
    </span>
  );
}
