import React, { useState } from 'react';
import ModalWrapper from './ModalWrapper';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, description: string) => void;
    targetName: string; // "this post", "John Doe", "Tribe Name"
    targetType: 'post' | 'user' | 'tribe' | 'comment' | 'story';
}

const REPORT_REASONS = [
    "Spam or misleading",
    "Harassment or bullying",
    "Hate speech",
    "Violence or dangerous organizations",
    "Nudity or sexual activity",
    "Scam or fraud",
    "Intellectual property violation",
    "Other"
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit, targetName, targetType }) => {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        if (!selectedReason) return;
        onSubmit(selectedReason, description);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <ModalWrapper onClose={onClose} title={`Report ${targetType}`} showCloseButton className="max-w-md">
            <div className="p-4 flex flex-col h-full">
                <p className="text-secondary mb-4 text-sm">
                    Help us keep the community safe. Why are you reporting <strong>{targetName}</strong>?
                </p>

                <div className="space-y-2 mb-4 max-h-[40vh] overflow-y-auto">
                    {REPORT_REASONS.map((reason) => (
                        <label
                            key={reason}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedReason === reason
                                    ? 'border-accent bg-accent/5'
                                    : 'border-border hover:bg-background/50'
                                }`}
                        >
                            <input
                                type="radio"
                                name="reportReason"
                                value={reason}
                                checked={selectedReason === reason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                className="mr-3 text-accent focus:ring-accent"
                            />
                            <span className={selectedReason === reason ? 'text-primary font-medium' : 'text-secondary'}>
                                {reason}
                            </span>
                        </label>
                    ))}
                </div>

                <div className="mb-4">
                    <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1 block">
                        Additional Details (Optional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg p-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent text-sm resize-none"
                        rows={3}
                        placeholder="Provide more context..."
                    />
                </div>

                <div className="mt-auto flex justify-end space-x-3 pt-2 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-secondary hover:bg-background transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedReason}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Submit Report
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};

export default ReportModal;
