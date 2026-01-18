import { ComponentChildren, JSX } from 'preact';

export interface StackProps {
  children: ComponentChildren;
  direction?: 'row' | 'column';
  gap?: number | string;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between';
  className?: string;
  style?: string | JSX.CSSProperties;
}

export function Stack({
  children,
  direction = 'column',
  gap = '1rem',
  align = 'stretch',
  justify = 'start',
  className = '',
  style
}: StackProps) {
  const alignItems = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch'
  }[align];

  const justifyContent = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between'
  }[justify];

  return (
    <div
      className={`stack ${className}`}
      style={{
        display: 'flex',
        flexDirection: direction,
        gap,
        alignItems,
        justifyContent,
        ...(typeof style === 'object' ? style : {})
      }}
    >
      {children}
    </div>
  );
}
