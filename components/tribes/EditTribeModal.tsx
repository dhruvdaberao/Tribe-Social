import React, { useState, useRef } from 'react';
import { Tribe } from '../../types';
import ModalWrapper from '../common/ModalWrapper';

interface EditTribeModalProps {
    tribe: Tribe;
    onClose: () => void;
    onSave: (tribeId: string, name: string, description: string, avatarUrl?: string | null) => void;
    onDelete: (tribeId: string) => void;
}

const TribePlaceholderIcon = () => (
    <div className="w-full h-full rounded-full bg-background border border-border flex items-center justify-center text-secondary p-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
    </div>
);


const EditTribeModal: React.FC<EditTribeModalProps> = ({ tribe, onClose, onSave, onDelete }) => {
    const [name, setName] = useState(tribe.name);
    const [description, setDescription] = useState(tribe.description);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(tribe.avatarUrl);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && description.trim()) {
            onSave(tribe.id, name.trim(), description.trim(), avatarPreview);
            onClose();
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this tribe? This is irreversible.')) {
            onDelete(tribe.id);
        }
    };

    return (
        <ModalWrapper onClose={onClose} title="Edit Tribe" showCloseButton>
            <form onSubmit={handleSubmit} className="p-6">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-background border border-border flex items-center justify-center relative group overflow-hidden">
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Tribe avatar preview"
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <TribePlaceholderIcon />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                            <CameraIcon />
                        </div>
                    </div>
                    <input type="file" ref={avatarInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <p className="text-xs text-secondary mt-2">Tap image to change</p>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <label htmlFor="tribe-name-edit" className="text-sm font-semibold text-secondary">Tribe Name</label>
                        <input
                            id="tribe-name-edit"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full mt-1 p-2 pl-9 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                            maxLength={50}
                            required
                        />
                        <div className="absolute left-3 top-[34px] text-secondary pointer-events-none">
                            <EditIconMini />
                        </div>
                    </div>
                    <div className="relative">
                        <label htmlFor="tribe-description-edit" className="text-sm font-semibold text-secondary">Description</label>
                        <textarea
                            id="tribe-description-edit"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full mt-1 p-2 pl-9 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary resize-none rounded-br-lg"
                            maxLength={200}
                            required
                        />
                        <div className="absolute left-3 top-[34px] text-secondary pointer-events-none">
                            <EditIconMini />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-6">
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="bg-red-500/10 text-red-500 font-semibold px-4 py-2 rounded-lg hover:bg-red-500/20"
                    >
                        Delete Tribe
                    </button>
                    <div className="flex items-center space-x-2">
                        <button type="button" onClick={onClose} className="text-secondary font-semibold px-4 py-2 rounded-lg hover:bg-background">Cancel</button>
                        <button type="submit" className="bg-accent text-accent-text font-semibold px-6 py-2 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50" disabled={!name.trim() || !description.trim()}>Save Changes</button>
                    </div>
                </div>
            </form>
        </ModalWrapper>
    );
};

const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
const EditIconMini = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" /></svg>

export default EditTribeModal;