






// import React, { useState, useRef, useEffect } from 'react';
// import type { Story } from '../../types';

// interface StoryCreatorProps {
//   onClose: () => void;
// // FIX: Changed the type of storyData to Omit the properties that are not provided by the creator component.
//   onCreate: (storyData: Omit<Story, 'id' | 'user' | 'createdAt' | 'author' | 'likes'>) => void;
// }

// type DraggableItem = {
//     type: 'text' | 'image';
//     id: number;
//     isDragging: boolean;
//     offset: { x: number, y: number };
// } | null;

// const StoryCreator: React.FC<StoryCreatorProps> = ({ onClose, onCreate }) => {
//   const [image, setImage] = useState<{ src: string, pos: { x: number, y: number } } | null>(null);
//   const [text, setText] = useState<{ content: string, pos: { x: number, y: number } } | null>(null);
//   const [isEditingText, setIsEditingText] = useState(false);
//   const [isPosting, setIsPosting] = useState(false);

//   const [activeDrag, setActiveDrag] = useState<DraggableItem>(null);
//   const canvasRef = useRef<HTMLDivElement>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setImage({ src: reader.result as string, pos: { x: 50, y: 100 } });
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleAddText = () => {
//     if (!text) {
//       setText({ content: 'Your Text Here', pos: { x: 50, y: 50 } });
//     }
//     setIsEditingText(true);
//   };
  
//   const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, type: 'text' | 'image') => {
//       const target = e.currentTarget as HTMLDivElement;
//       const rect = target.getBoundingClientRect();
//       const currentPos = type === 'text' ? text!.pos : image!.pos;
//       setActiveDrag({
//           type,
//           id: Date.now(),
//           isDragging: true,
//           offset: { x: e.clientX - currentPos.x, y: e.clientY - currentPos.y }
//       });
//   };

//   const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
//     if (!activeDrag || !activeDrag.isDragging) return;
    
//     const canvasRect = canvasRef.current!.getBoundingClientRect();
//     let newX = e.clientX - activeDrag.offset.x;
//     let newY = e.clientY - activeDrag.offset.y;

//     // Constrain within canvas bounds
//     if(activeDrag.type === 'text') {
//         // Simple bounding for text
//         newX = Math.max(10, Math.min(newX, canvasRect.width - 100)); // Arbitrary width
//         newY = Math.max(10, Math.min(newY, canvasRect.height - 40)); // Arbitrary height
//         setText(prev => prev ? { ...prev, pos: { x: newX, y: newY } } : null);
//     } else if (activeDrag.type === 'image' && image) {
//         // More complex for image if needed, for now just position
//         newX = Math.max(0, Math.min(newX, canvasRect.width - 200)); // Assuming image width
//         newY = Math.max(0, Math.min(newY, canvasRect.height - 200)); // Assuming image height
//         setImage(prev => prev ? { ...prev, pos: {x: newX, y: newY }} : null);
//     }
//   };

//   const handleMouseUp = () => {
//     setActiveDrag(null);
//   };

//   const handlePost = () => {
//     if (!image && (!text || !text.content.trim())) {
//         alert("Add some content to your story first!");
//         return;
//     }
//     setIsPosting(true);
//     onCreate({
//         imageUrl: image?.src,
//         text: text?.content,
//         textPosition: text?.pos,
//         imagePosition: image?.pos,
//     });
//   };

//   return (
//     <div className="fixed inset-0 bg-black z-50 flex flex-col">
//       {/* Header */}
//       <div className="flex justify-between items-center p-4 bg-black/20 text-white flex-shrink-0 z-20">
//         <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><BackIcon /></button>
//         <div className="flex space-x-4">
//             <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-white/10"><CameraIcon /></button>
//             <button onClick={handleAddText} className="p-2 rounded-full hover:bg-white/10"><PenIcon /></button>
//         </div>
//       </div>
      
//       {/* Canvas */}
//       <div 
//         ref={canvasRef}
//         className="flex-1 bg-gradient-to-br from-accent to-background relative overflow-hidden cursor-grab"
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUp}
//         onMouseLeave={handleMouseUp}
//       >
//         {image && (
//             <div 
//                 className="absolute"
//                 style={{ left: `${image.pos.x}px`, top: `${image.pos.y}px` }}
//                 onMouseDown={(e) => handleMouseDown(e, 'image')}
//             >
//                 <img src={image.src} alt="Story content" className="w-48 rounded-lg shadow-lg pointer-events-none" />
//             </div>
//         )}
//         {text && (
//             <div 
//                 className="absolute text-white text-2xl font-bold p-2"
//                 style={{
//                     left: `${text.pos.x}px`, 
//                     top: `${text.pos.y}px`,
//                     textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
//                     cursor: activeDrag?.type === 'text' ? 'grabbing' : 'grab'
//                 }}
//                 onMouseDown={(e) => {
//                     if(!isEditingText) handleMouseDown(e, 'text')
//                 }}
//                 onDoubleClick={() => setIsEditingText(true)}
//             >
//                 {isEditingText ? (
//                     <textarea
//                         value={text.content}
//                         onChange={(e) => setText(prev => prev ? {...prev, content: e.target.value } : null)}
//                         onBlur={() => setIsEditingText(false)}
//                         autoFocus
//                         className="bg-transparent border border-dashed border-white/50 rounded-md p-2 outline-none resize-none"
//                     />
//                 ) : (
//                     <span>{text.content}</span>
//                 )}
//             </div>
//         )}
//       </div>

//       {/* Footer */}
//       <div className="p-4 bg-black/20 flex-shrink-0 z-20">
//          <button 
//             onClick={handlePost} 
//             disabled={isPosting}
//             className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
//         >
//             {isPosting ? 'Posting...' : 'Post Story'}
//          </button>
//       </div>
//        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
//     </div>
//   );
// };


// const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
// const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
// const PenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" /></svg>;

// export default StoryCreator;






import React, { useState, useRef, useEffect } from 'react';
import type { Story } from '../../types';

interface StoryCreatorProps {
  onClose: () => void;
// FIX: Changed the type of storyData to Omit the properties that are not provided by the creator component.
  onCreate: (storyData: Omit<Story, 'id' | 'user' | 'createdAt' | 'author' | 'likes'>) => void;
}

type DraggableItem = {
    type: 'text' | 'image';
    offset: { x: number, y: number };
} | null;

const StoryCreator: React.FC<StoryCreatorProps> = ({ onClose, onCreate }) => {
  const [image, setImage] = useState<{ src: string, pos: { x: number, y: number } } | null>(null);
  const [text, setText] = useState<{ content: string, pos: { x: number, y: number } } | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const [activeDrag, setActiveDrag] = useState<DraggableItem>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ src: reader.result as string, pos: { x: 50, y: 100 } });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddText = () => {
    if (!text) {
      setText({ content: 'Your Text Here', pos: { x: 50, y: 50 } });
    }
    setIsEditingText(true);
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, type: 'text' | 'image') => {
      const target = e.currentTarget as HTMLDivElement;
      const rect = target.getBoundingClientRect();
      setActiveDrag({
          type,
          offset: { x: e.clientX - rect.left, y: e.clientY - rect.top }
      });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeDrag) return;
    
    const canvasRect = canvasRef.current!.getBoundingClientRect();
    let newX = e.clientX - canvasRect.left - activeDrag.offset.x;
    let newY = e.clientY - canvasRect.top - activeDrag.offset.y;

    if(activeDrag.type === 'text' && text) {
        setText({ ...text, pos: { x: newX, y: newY } });
    } else if (activeDrag.type === 'image' && image) {
        setImage({ ...image, pos: {x: newX, y: newY }});
    }
  };

  const handleMouseUp = () => {
    setActiveDrag(null);
  };

  const handlePost = () => {
    if (!image && (!text || !text.content.trim())) {
        alert("Add some content to your story first!");
        return;
    }
    setIsPosting(true);
    onCreate({
        imageUrl: image?.src,
        text: text?.content,
        textPosition: text?.pos,
        imagePosition: image?.pos,
    });
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/20 text-white flex-shrink-0 z-20">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><BackIcon /></button>
        <div className="flex space-x-4">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-white/10"><CameraIcon /></button>
            <button onClick={handleAddText} className="p-2 rounded-full hover:bg-white/10"><PenIcon /></button>
        </div>
      </div>
      
      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 bg-gradient-to-br from-accent to-background relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: activeDrag ? 'grabbing' : 'default' }}
      >
        {image && (
            <div 
                className="absolute cursor-grab"
                style={{ left: `${image.pos.x}px`, top: `${image.pos.y}px` }}
                onMouseDown={(e) => handleMouseDown(e, 'image')}
            >
                <img src={image.src} alt="Story content" className="w-48 rounded-lg shadow-lg pointer-events-none" />
            </div>
        )}
        {text && (
            <div 
                className="absolute text-white text-2xl font-bold p-2"
                style={{
                    left: `${text.pos.x}px`, 
                    top: `${text.pos.y}px`,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                    cursor: 'grab'
                }}
                onMouseDown={(e) => {
                    if(!isEditingText) handleMouseDown(e, 'text')
                }}
                onDoubleClick={() => setIsEditingText(true)}
            >
                {isEditingText ? (
                    <textarea
                        value={text.content}
                        onChange={(e) => setText(prev => prev ? {...prev, content: e.target.value } : null)}
                        onBlur={() => setIsEditingText(false)}
                        autoFocus
                        className="bg-transparent border border-dashed border-white/50 rounded-md p-2 outline-none resize-none"
                    />
                ) : (
                    <span>{text.content}</span>
                )}
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-black/20 flex-shrink-0 z-20">
         <button 
            onClick={handlePost} 
            disabled={isPosting}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
            {isPosting ? 'Posting...' : 'Post Story'}
         </button>
      </div>
       <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  );
};


const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" /></svg>;

export default StoryCreator;