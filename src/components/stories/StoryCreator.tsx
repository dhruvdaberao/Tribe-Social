
import React, { useState, useRef } from 'react';
import type { Story } from '../../types';

interface StoryCreatorProps {
  onClose: () => void;
  onCreate: (storyData: Omit<Story, 'id' | 'user' | 'createdAt' | 'author' | 'likes'>) => void;
}

const COLORS = [
  '#000000', // Black
  '#F44336', // Red
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#673AB7', // Deep Purple
  '#3F51B5', // Indigo
  '#2196F3', // Blue
  '#00BCD4', // Cyan
  '#009688', // Teal
  '#4CAF50', // Green
  '#FFEB3B', // Yellow
  '#FF9800', // Orange
  '#795548', // Brown
  '#607D8B', // Blue Grey
];

const StoryCreator: React.FC<StoryCreatorProps> = ({ onClose, onCreate }) => {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        // Default text color to white if image is present
        setTextColor('#ffffff');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = () => {
    if (!image && !text.trim()) return;
    
    setIsPosting(true);
    onCreate({
        imageUrl: image || undefined,
        text: text.trim() || undefined,
        backgroundColor: image ? undefined : currentColor,
        textColor: textColor,
    });
  };

  const toggleColor = (color: string) => {
      if (image) {
          setTextColor(color);
      } else {
          setCurrentColor(color);
      }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-fade-in text-white">
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 z-20 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onClose} className="p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-colors">
            <CloseIcon />
        </button>
        <div className="flex space-x-2">
             {!image && <span className="text-xs font-bold self-center mr-2 bg-black/30 px-2 py-1 rounded">Text Mode</span>}
             <button 
                onClick={handlePost} 
                disabled={isPosting || (!image && !text.trim())}
                className="bg-white text-black font-bold px-4 py-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
            >
                {isPosting ? 'Posting...' : 'Share Story'}
            </button>
        </div>
      </div>
      
      {/* Canvas */}
      <div 
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: image ? '#000' : currentColor, transition: 'background-color 0.3s ease' }}
      >
        {image && (
            <>
                <img src={image} alt="Story preview" className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0" />
                <button 
                    onClick={() => setImage(null)}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-colors"
                >
                    <TrashIcon />
                </button>
            </>
        )}

        <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={image ? "Tap to type caption..." : "Type something..."}
            className="relative z-10 w-full max-w-lg p-8 text-center bg-transparent text-2xl md:text-4xl font-bold focus:outline-none resize-none placeholder-white/50"
            style={{ 
                color: textColor,
                textShadow: image ? '0px 2px 8px rgba(0,0,0,0.8)' : 'none',
                height: 'auto',
                minHeight: '200px'
            }}
            rows={4}
        />
      </div>

      {/* Controls */}
      <div className="p-6 z-20 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-4">
         
         {/* Color Picker */}
         <div className="flex space-x-3 overflow-x-auto w-full max-w-md pb-2 justify-start md:justify-center hide-scrollbar">
            {COLORS.map(color => (
                <button
                    key={color}
                    onClick={() => toggleColor(color)}
                    className={`w-8 h-8 rounded-full flex-shrink-0 border-2 transition-transform hover:scale-110 ${
                        (image ? textColor : currentColor) === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                />
            ))}
         </div>

         <div className="flex justify-between items-center w-full max-w-md">
            <button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex items-center space-x-2 text-sm font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full transition-colors"
            >
                <ImageIcon />
                <span>{image ? 'Change Photo' : 'Add Photo'}</span>
            </button>
         </div>
      </div>
       <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  );
};

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

export default StoryCreator;
