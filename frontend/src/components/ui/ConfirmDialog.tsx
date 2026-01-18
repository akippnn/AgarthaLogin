import { useState } from 'preact/hooks';
import { ComponentChildren, JSX } from 'preact';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  requireType?: string;
  icon?: ComponentChildren;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  isDangerous = false,
  onConfirm,
  onCancel,
  requireType,
  icon
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const canConfirm = !requireType || typed === requireType;

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <h3 className="typography-heading text-xl mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <p className="typography-subheading mb-4 text-muted">{message}</p>

      {requireType && (
        <div className="mb-4">
          <p className="text-danger mb-2">
            Type <strong>{requireType}</strong> to confirm:
          </p>
          <Input
            value={typed}
            onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => setTyped(e.currentTarget.value)}
            placeholder={requireType}
          />
        </div>
      )}

      <div className="flex justify-end gap-4 mt-6">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button
          variant={isDangerous ? 'danger' : 'primary'}
          onClick={onConfirm}
          disabled={!canConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
