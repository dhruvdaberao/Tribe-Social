import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';

const reasons = [
  'Spam',
  'Harassment',
  'Hate Speech',
  'Violence',
  'Misinformation',
  'Scam or Fraud',
  'Other',
];

interface ReportModalProps {
  targetType: 'post' | 'user' | 'tribe';
  onClose: () => void;
  onSubmit: (payload: { reason: string; details: string }) => Promise<void> | void;
}

const ReportModal: React.FC<ReportModalProps> = ({ targetType, onClose, onSubmit }) => {
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(() => {
    if (targetType === 'post') return 'Report Post';
    if (targetType === 'user') return 'Report User';
    return 'Report Tribe';
  }, [targetType]);


  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ reason, details });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal
      isOpen
      onClose={onClose}
      overlayClassName="bg-black/60"
      contentClassName="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">{title}</h2>
          <p className="mt-1 text-sm text-secondary">
            Help us keep Tribe Social safe by sharing why you are reporting this {targetType}.
          </p>
        </div>
        <button onClick={onClose} className="text-secondary transition-colors hover:text-primary" aria-label="Close report modal">
          <X size={20} />
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-primary">Reason</label>
          <div className="space-y-2">
            {reasons.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setReason(option)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                  reason === option
                    ? 'border-accent bg-accent/10 text-primary'
                    : 'border-border bg-background text-secondary hover:bg-surface'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full border ${reason === option ? 'border-accent bg-accent' : 'border-border'}`} />
                  {option}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-primary">Additional Details (optional)</label>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Share any context that can help our moderation team."
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-secondary hover:text-primary"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-text hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </div>
    </ModalPortal>
  );
};

export default ReportModal;
