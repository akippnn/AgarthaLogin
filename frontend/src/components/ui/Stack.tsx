
import React from 'react';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column';
  gap?: string | number;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  width?: string;
  padding?: string | number;
}

export function Stack({
  children,
  direction = 'column',
  gap = '1rem',
  align = 'stretch',
  justify = 'start',
  width = '100%',
  padding = 0,
  style,
  ...props
}: StackProps) {

  const justifyContentMap: Record<string, string> = {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
    between: 'space-between',
    around: 'space-around'
  };

  const alignItemsMap: Record<string, string> = {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
    stretch: 'stretch',
    baseline: 'baseline'
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction,
        gap,
        alignItems: alignItemsMap[align],
        justifyContent: justifyContentMap[justify],
        width,
        padding,
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}
