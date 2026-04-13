import React from 'react';
import ModalPortal from './ModalPortal';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <ModalPortal isOpen={visible} onClose={onCancel} zIndex={9999}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-primary">{title}</h3>
        <p className="mt-2 text-sm text-secondary">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-background disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60 ${danger ? 'bg-red-500 hover:opacity-90' : 'bg-accent hover:opacity-90'}`}
          >
            {loading ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ConfirmModal;
