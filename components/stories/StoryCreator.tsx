import React, { useState, useRef } from 'react';
import type { Story } from '../../types';

interface StoryCreatorProps {
  onClose: () => void;
  onCreate: (storyData: Omit<Story, 'id' | 'user' | 'createdAt' | 'author' | 'likes'>) => void;
}

const StoryCreator: React.FC<StoryCreatorProps> = ({ onClose, onCreate }) => {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = () => {
    if (!image && !text.trim()) {
        // You could use a toast notification here for better UX
        return;
    }
    setIsPosting(true);
    onCreate({
        imageUrl: image || undefined,
        text: text.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col animate-fade-in">
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 text-primary flex-shrink-0 z-20">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-surface"><BackIcon /></button>
        <div className="flex space-x-4">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-surface"><CameraIcon /></button>
        </div>
      </div>
      
      {/* Canvas */}
      <div className="flex-1 bg-gradient-to-br from-background via-surface to-background relative flex items-center justify-center overflow-hidden p-4">
        {image ? (
            <img src={image} alt="Story preview" className="max-w-full max-h-full object-contain rounded-lg shadow-lg pointer-events-none" />
        ) : (
             <div className="text-center text-secondary">
                <div className="w-24 h-24 mx-auto mb-4"><CameraIcon /></div>
                <h2 className="text-xl font-bold text-primary">Create a Story</h2>
                <p>Upload a photo or write something.</p>
            </div>
        )}

        <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing..."
            className="absolute inset-0 w-full h-full p-16 text-center bg-transparent text-white text-3xl font-bold focus:outline-none flex items-center justify-center resize-none"
            style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}
        />
      </div>

      {/* Footer */}
      <div className="p-4 flex-shrink-0 z-20">
         <button 
            onClick={handlePost} 
            disabled={isPosting || (!image && !text.trim())}
            className="w-full bg-accent text-accent-text font-bold py-3 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
            {isPosting && <div className="w-5 h-5 border-2 border-accent-text border-t-transparent rounded-full animate-spin"></div>}
            <span>{isPosting ? 'Posting...' : 'Post Story'}</span>
         </button>
      </div>
       <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  );
};


const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

export default StoryCreator;