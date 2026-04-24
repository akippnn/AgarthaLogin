import { ComponentChildren, JSX } from 'preact';

export interface TextButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  children: ComponentChildren;
}

export function TextButton({ style, className = '', children, ...props }: TextButtonProps) {
  return (
    <button
      type="button"
      className={`text-button ${className}`}
      style={typeof style === 'object' ? style : {}}
      {...props}
    >
      {children}
    </button>
  );
}
