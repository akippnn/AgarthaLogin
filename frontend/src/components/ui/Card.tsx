import { ComponentChildren, JSX } from 'preact';

export interface CardProps {
  children: ComponentChildren;
  className?: string;
  style?: string | JSX.CSSProperties;
}

export function Card({ children, className = '', style }: CardProps) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}
