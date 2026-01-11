import React from 'react';
import { cardStyle } from './styles';

export interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Card({ children, style }: CardProps) {
  return (
    <div style={{ ...cardStyle, ...style }}>
      {children}
    </div>
  );
}
