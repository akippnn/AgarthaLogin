import { ComponentChildren, JSX } from 'preact';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ComponentChildren;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e: JSX.TargetedMouseEvent<HTMLDivElement>) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
