import React from 'react';
import { colors } from './colors';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  requireType?: string;
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  onConfirm,
  onCancel,
  requireType,
  icon
}: ConfirmDialogProps) {
  const [typed, setTyped] = React.useState('');
  const canConfirm = !requireType || typed === requireType;

  return (
    <Modal>
      <h2 style={{ color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon}
        {title}
      </h2>
      <p style={{ color: colors.textMuted, marginBottom: '1rem' }}>{message}</p>
      {requireType && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: colors.error, marginBottom: '0.5rem' }}>
            Type <strong>{requireType}</strong> to confirm:
          </p>
          <Input
            value={typed}
            onChange={e => setTyped(e.target.value)}
            placeholder={requireType}
          />
        </div>
      )}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={!canConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
