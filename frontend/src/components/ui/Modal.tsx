import React from 'react';
import { modalStyle, modalContentStyle } from './styles';

export interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export function Modal({ children }: ModalProps) {
  return (
    <div style={modalStyle}>
      <div style={modalContentStyle}>
        {children}
      </div>
    </div>
  );
}
