import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';

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
  targetType: 'post' | 'user';
  onClose: () => void;
  onSubmit: (payload: { reason: string; details: string }) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ targetType, onClose, onSubmit }) => {
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState('');

  const title = useMemo(() => (targetType === 'post' ? 'Report Post' : 'Report User'), [targetType]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary">{title}</h2>
            <p className="text-sm text-secondary mt-1">
              Help us keep Tribe Social safe by sharing why you are reporting this {targetType}.
            </p>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">Reason</label>
            <div className="space-y-2">
              {reasons.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setReason(option)}
                  className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
                    reason === option
                      ? 'border-accent bg-accent/10 text-primary'
                      : 'border-border bg-background text-secondary hover:bg-surface'
                  }`}
                >
                  <span>{option}</span>
                  <span
                    className={`h-4 w-4 rounded-full border ${
                      reason === option ? 'border-accent bg-accent' : 'border-border'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-2">Additional Details (optional)</label>
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
            onClick={() => onSubmit({ reason, details })}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
