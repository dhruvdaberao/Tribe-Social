






// // import React, { useState, useRef, useEffect } from 'react';
// // import type { Story } from '../../types';

// // interface StoryCreatorProps {
// //   onClose: () => void;
// // // FIX: Changed the type of storyData to Omit the properties that are not provided by the creator component.
// //   onCreate: (storyData: Omit<Story, 'id' | 'user' | 'createdAt' | 'author' | 'likes'>) => void;
// // }

// // type DraggableItem = {
// //     type: 'text' | 'image';
// //     id: number;
// //     isDragging: boolean;
// //     offset: { x: number, y: number };
// // } | null;

// // const StoryCreator: React.FC<StoryCreatorProps> = ({ onClose, onCreate }) => {
// //   const [image, setImage] = useState<{ src: string, pos: { x: number, y: number } } | null>(null);
// //   const [text, setText] = useState<{ content: string, pos: { x: number, y: number } } | null>(null);
// //   const [isEditingText, setIsEditingText] = useState(false);
// //   const [isPosting, setIsPosting] = useState(false);

// //   const [activeDrag, setActiveDrag] = useState<DraggableItem>(null);
// //   const canvasRef = useRef<HTMLDivElement>(null);
// //   const fileInputRef = useRef<HTMLInputElement>(null);

// //   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const file = e.target.files?.[0];
// //     if (file) {
// //       const reader = new FileReader();
// //       reader.onloadend = () => {
// //         setImage({ src: reader.result as string, pos: { x: 50, y: 100 } });
// //       };
// //       reader.readAsDataURL(file);
// //     }
// //   };

// //   const handleAddText = () => {
// //     if (!text) {
// //       setText({ content: 'Your Text Here', pos: { x: 50, y: 50 } });
// //     }
// //     setIsEditingText(true);
// //   };
  
// //   const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, type: 'text' | 'image') => {
// //       const target = e.currentTarget as HTMLDivElement;
// //       const rect = target.getBoundingClientRect();
// //       const currentPos = type === 'text' ? text!.pos : image!.pos;
// //       setActiveDrag({
// //           type,
// //           id: Date.now(),
// //           isDragging: true,
// //           offset: { x: e.clientX - currentPos.x, y: e.clientY - currentPos.y }
// //       });
// //   };

// //   const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
// //     if (!activeDrag || !activeDrag.isDragging) return;
    
// //     const canvasRect = canvasRef.current!.getBoundingClientRect();
// //     let newX = e.clientX - activeDrag.offset.x;
// //     let newY = e.clientY - activeDrag.offset.y;

// //     // Constrain within canvas bounds
// //     if(activeDrag.type === 'text') {
// //         // Simple bounding for text
// //         newX = Math.max(10, Math.min(newX, canvasRect.width - 100)); // Arbitrary width
// //         newY = Math.max(10, Math.min(newY, canvasRect.height - 40)); // Arbitrary height
// //         setText(prev => prev ? { ...prev, pos: { x: newX, y: newY } } : null);
// //     } else if (activeDrag.type === 'image' && image) {
// //         // More complex for image if needed, for now just position
// //         newX = Math.max(0, Math.min(newX, canvasRect.width - 200)); // Assuming image width
// //         newY = Math.max(0, Math.min(newY, canvasRect.height - 200)); // Assuming image height
// //         setImage(prev => prev ? { ...prev, pos: {x: newX, y: newY }} : null);
// //     }
// //   };

// //   const handleMouseUp = () => {
// //     setActiveDrag(null);
// //   };

// //   const handlePost = () => {
// //     if (!image && (!text || !text.content.trim())) {
// //         alert("Add some content to your story first!");
// //         return;
// //     }
// //     setIsPosting(true);
// //     onCreate({
// //         imageUrl: image?.src,
// //         text: text?.content,
// //         textPosition: text?.pos,
// //         imagePosition: image?.pos,
// //     });
// //   };

// //   return (
// //     <div className="fixed inset-0 bg-black z-50 flex flex-col">
// //       {/* Header */}
// //       <div className="flex justify-between items-center p-4 bg-black/20 text-white flex-shrink-0 z-20">
// //         <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><BackIcon /></button>
// //         <div className="flex space-x-4">
// //             <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-white/10"><CameraIcon /></button>
// //             <button onClick={handleAddText} className="p-2 rounded-full hover:bg-white/10"><PenIcon /></button>
// //         </div>
// //       </div>
      
// //       {/* Canvas */}
// //       <div 
// //         ref={canvasRef}
// //         className="flex-1 bg-gradient-to-br from-accent to-background relative overflow-hidden cursor-grab"
// //         onMouseMove={handleMouseMove}
// //         onMouseUp={handleMouseUp}
// //         onMouseLeave={handleMouseUp}
// //       >
// //         {image && (
// //             <div 
// //                 className="absolute"
// //                 style={{ left: `${image.pos.x}px`, top: `${image.pos.y}px` }}
// //                 onMouseDown={(e) => handleMouseDown(e, 'image')}
// //             >
// //                 <img src={image.src} alt="Story content" className="w-48 rounded-lg shadow-lg pointer-events-none" />
// //             </div>
// //         )}
// //         {text && (
// //             <div 
// //                 className="absolute text-white text-2xl font-bold p-2"
// //                 style={{
// //                     left: `${text.pos.x}px`, 
// //                     top: `${text.pos.y}px`,
// //                     textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
// //                     cursor: activeDrag?.type === 'text' ? 'grabbing' : 'grab'
// //                 }}
// //                 onMouseDown={(e) => {
// //                     if(!isEditingText) handleMouseDown(e, 'text')
// //                 }}
// //                 onDoubleClick={() => setIsEditingText(true)}
// //             >
// //                 {isEditingText ? (
// //                     <textarea
// //                         value={text.content}
// //                         onChange={(e) => setText(prev => prev ? {...prev, content: e.target.value } : null)}
// //                         onBlur={() => setIsEditingText(false)}
// //                         autoFocus
// //                         className="bg-transparent border border-dashed border-white/50 rounded-md p-2 outline-none resize-none"
// //                     />
// //                 ) : (
// //                     <span>{text.content}</span>
// //                 )}
// //             </div>
// //         )}
// //       </div>

// //       {/* Footer */}
// //       <div className="p-4 bg-black/20 flex-shrink-0 z-20">
// //          <button 
// //             onClick={handlePost} 
// //             disabled={isPosting}
// //             className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
// //         >
// //             {isPosting ? 'Posting...' : 'Post Story'}
// //          </button>
// //       </div>
// //        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
// //     </div>
// //   );
// // };


// // const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
// // const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
// // const PenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" /></svg>;

// // export default StoryCreator;






// import React, { useState, useRef, useEffect } from 'react';
// import type { Story } from '../../types';

// interface StoryCreatorProps {
//   onClose: () => void;
// // FIX: Changed the type of storyData to Omit the properties that are not provided by the creator component.
//   onCreate: (storyData: Omit<Story, 'id' | 'user' | 'createdAt' | 'author' | 'likes'>) => void;
// }

// type DraggableItem = {
//     type: 'text' | 'image';
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
//       setActiveDrag({
//           type,
//           offset: { x: e.clientX - rect.left, y: e.clientY - rect.top }
//       });
//   };

//   const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
//     if (!activeDrag) return;
    
//     const canvasRect = canvasRef.current!.getBoundingClientRect();
//     let newX = e.clientX - canvasRect.left - activeDrag.offset.x;
//     let newY = e.clientY - canvasRect.top - activeDrag.offset.y;

//     if(activeDrag.type === 'text' && text) {
//         setText({ ...text, pos: { x: newX, y: newY } });
//     } else if (activeDrag.type === 'image' && image) {
//         setImage({ ...image, pos: {x: newX, y: newY }});
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
//         className="flex-1 bg-gradient-to-br from-accent to-background relative overflow-hidden"
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUp}
//         onMouseLeave={handleMouseUp}
//         style={{ cursor: activeDrag ? 'grabbing' : 'default' }}
//       >
//         {image && (
//             <div 
//                 className="absolute cursor-grab"
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
//                     cursor: 'grab'
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






import React, { useState, useRef } from 'react';
import type { Story } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface StoryCreatorProps {
  onClose: () => void;
  onCreate: (storyData: Omit<Story, 'id' | 'user' | 'createdAt' | 'author' | 'likes'>) => void;
}

const COLORS = [
    '#2A2320', // Dark Brown
    '#EAE4E0', // Cream
    '#3B302B', // Medium Brown
    '#F87171', // Red
    '#FBBF24', // Amber
    '#34D399', // Emerald
    '#60A5FA', // Blue
    '#A78BFA', // Violet
];

const TEXT_COLORS = [
    '#FFFFFF', // White
    '#000000', // Black
    '#EAE4E0', // Cream
    '#2A2320', // Dark Brown
];

const StoryCreator: React.FC<StoryCreatorProps> = ({ onClose, onCreate }) => {
  const { theme } = useTheme();
  
  // State for image
  const [image, setImage] = useState<{ src: string, pos: { x: number, y: number }, scale: number, rotation: number } | null>(null);
  // State for text
  const [text, setText] = useState<{ content: string, pos: { x: number, y: number }, scale: number, rotation: number, color: string } | null>(null);
  
  const [storyBg, setStoryBg] = useState(theme === 'dark' ? '#2A2320' : '#EAE4E0');
  const [isEditingText, setIsEditingText] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedElement, setSelectedElement] = useState<'text' | 'image' | null>(null);

  // Interaction State
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for drag math
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const initialScale = useRef(1);
  const initialRotation = useRef(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ src: reader.result as string, pos: { x: 50, y: 50 }, scale: 1, rotation: 0 });
        setSelectedElement('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddText = () => {
    if (!text) {
      setText({ content: 'Tap to edit', pos: { x: 50, y: 50 }, scale: 1, rotation: 0, color: '#FFFFFF' });
      setSelectedElement('text');
    }
    setIsEditingText(true);
  };

  // --- Handlers ---

  const handleMoveStart = (e: React.MouseEvent, type: 'text' | 'image') => {
      if (isEditingText && type === 'text') return;
      e.stopPropagation();
      e.preventDefault();
      setSelectedElement(type);
      
      const target = type === 'text' ? text : image;
      if (!target) return;

      dragStart.current = { x: e.clientX, y: e.clientY };
      initialPos.current = { ...target.pos };

      const handleMove = (moveEvent: MouseEvent) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          
          // Calculate delta in percentage
          const deltaX = ((moveEvent.clientX - dragStart.current.x) / rect.width) * 100;
          const deltaY = ((moveEvent.clientY - dragStart.current.y) / rect.height) * 100;

          const newPos = {
              x: initialPos.current.x + deltaX,
              y: initialPos.current.y + deltaY
          };

          if (type === 'text') setText(prev => prev ? { ...prev, pos: newPos } : null);
          else setImage(prev => prev ? { ...prev, pos: newPos } : null);
      };

      const handleUp = () => {
          document.removeEventListener('mousemove', handleMove);
          document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
  };

  const handleRotateStart = (e: React.MouseEvent, type: 'text' | 'image') => {
      e.stopPropagation();
      e.preventDefault();
      const target = type === 'text' ? text : image;
      if (!target || !containerRef.current) return;

      const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
      if(!rect) return;
      
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate start angle
      const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      initialRotation.current = target.rotation;

      const handleRotate = (moveEvent: MouseEvent) => {
          const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
          const rotationChange = currentAngle - startAngle;
          
          const newRotation = initialRotation.current + rotationChange;

          if (type === 'text') setText(prev => prev ? { ...prev, rotation: newRotation } : null);
          else setImage(prev => prev ? { ...prev, rotation: newRotation } : null);
      };

      const handleUp = () => {
          document.removeEventListener('mousemove', handleRotate);
          document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleRotate);
      document.addEventListener('mouseup', handleUp);
  };

  const handleResizeStart = (e: React.MouseEvent, type: 'text' | 'image') => {
      e.stopPropagation();
      e.preventDefault();
      const target = type === 'text' ? text : image;
      if (!target) return;

      dragStart.current = { x: e.clientX, y: e.clientY };
      initialScale.current = target.scale;

      const handleResize = (moveEvent: MouseEvent) => {
          // Simple resize: dragging right/down increases size
          const delta = (moveEvent.clientX - dragStart.current.x) * 0.01;
          const newScale = Math.max(0.5, initialScale.current + delta);

          if (type === 'text') setText(prev => prev ? { ...prev, scale: newScale } : null);
          else setImage(prev => prev ? { ...prev, scale: newScale } : null);
      };

      const handleUp = () => {
          document.removeEventListener('mousemove', handleResize);
          document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleUp);
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
        // Save exact transforms
        textPosition: text?.pos,
        imagePosition: image?.pos,
        textRotation: text?.rotation,
        imageRotation: image?.rotation,
        textScale: text?.scale,
        imageScale: image?.scale,
        textColor: text?.color,
        backgroundColor: storyBg
    });
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4">
      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-sm aspect-[9/16] rounded-3xl shadow-2xl overflow-hidden flex flex-col border-4 border-[#3B302B] transition-colors duration-300"
        style={{ backgroundColor: storyBg }}
        onMouseDown={() => setSelectedElement(null)} // Deselect on bg click
      >
          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-30 pointer-events-none">
            <button onClick={onClose} className="pointer-events-auto p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/30 transition-colors">
                <BackIcon />
            </button>
            <div className="flex space-x-3 pointer-events-auto">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/30 transition-colors">
                    <CameraIcon />
                </button>
                <button onClick={handleAddText} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/30 transition-colors">
                    <PenIcon />
                </button>
            </div>
          </div>

          {/* Image Layer */}
          {image && (
            <div 
                className="absolute"
                style={{ 
                    left: `${image.pos.x}%`, 
                    top: `${image.pos.y}%`,
                    transform: `translate(-50%, -50%) rotate(${image.rotation}deg) scale(${image.scale})`,
                    cursor: 'move',
                    width: '60%' // Base width relative to container
                }}
                onMouseDown={(e) => handleMoveStart(e, 'image')}
            >
                <div className={`relative ${selectedElement === 'image' ? 'ring-2 ring-accent ring-dashed p-1' : ''}`}>
                    <img 
                        src={image.src} 
                        alt="Story" 
                        className="w-full rounded-lg shadow-lg pointer-events-none" 
                        draggable={false}
                    />
                    {selectedElement === 'image' && (
                        <>
                            {/* Rotate Handle */}
                            <div 
                                className="absolute -top-6 -right-6 w-8 h-8 bg-white text-black rounded-full shadow-md flex items-center justify-center cursor-pointer z-50 pointer-events-auto"
                                onMouseDown={(e) => handleRotateStart(e, 'image')}
                            >
                                <RotateIcon />
                            </div>
                            {/* Resize Handle */}
                            <div 
                                className="absolute -bottom-6 -right-6 w-8 h-8 bg-white text-black rounded-full shadow-md flex items-center justify-center cursor-nwse-resize z-50 pointer-events-auto"
                                onMouseDown={(e) => handleResizeStart(e, 'image')}
                            >
                                <ResizeIcon />
                            </div>
                        </>
                    )}
                </div>
            </div>
          )}

          {/* Text Layer */}
          {text && (
            <div 
                className="absolute"
                style={{ 
                    left: `${text.pos.x}%`, 
                    top: `${text.pos.y}%`,
                    transform: `translate(-50%, -50%) rotate(${text.rotation}deg) scale(${text.scale})`,
                    cursor: isEditingText ? 'text' : 'move',
                    minWidth: '100px',
                    textAlign: 'center'
                }}
                onMouseDown={(e) => handleMoveStart(e, 'text')}
            >
                <div className={`relative ${selectedElement === 'text' && !isEditingText ? 'ring-2 ring-accent ring-dashed p-2 rounded-lg' : ''}`}>
                    {isEditingText ? (
                        <textarea
                            value={text.content}
                            onChange={(e) => setText(prev => prev ? {...prev, content: e.target.value } : null)}
                            onBlur={() => setIsEditingText(false)}
                            autoFocus
                            className="bg-transparent border-none outline-none resize-none text-center overflow-hidden w-full font-bold font-display"
                            style={{ 
                                color: text.color, 
                                fontSize: '24px', 
                                textShadow: '1px 1px 2px rgba(0,0,0,0.5)' 
                            }}
                        />
                    ) : (
                        <span 
                            className="font-bold font-display whitespace-pre-wrap block"
                            style={{ 
                                color: text.color, 
                                fontSize: '24px', 
                                textShadow: '1px 1px 2px rgba(0,0,0,0.5)' 
                            }}
                            onDoubleClick={() => setIsEditingText(true)}
                        >
                            {text.content}
                        </span>
                    )}

                    {selectedElement === 'text' && !isEditingText && (
                        <>
                            {/* Rotate Handle */}
                            <div 
                                className="absolute -top-6 -right-6 w-8 h-8 bg-white text-black rounded-full shadow-md flex items-center justify-center cursor-pointer z-50 pointer-events-auto"
                                onMouseDown={(e) => handleRotateStart(e, 'text')}
                            >
                                <RotateIcon />
                            </div>
                            {/* Resize Handle */}
                            <div 
                                className="absolute -bottom-6 -right-6 w-8 h-8 bg-white text-black rounded-full shadow-md flex items-center justify-center cursor-nwse-resize z-50 pointer-events-auto"
                                onMouseDown={(e) => handleResizeStart(e, 'text')}
                            >
                                <ResizeIcon />
                            </div>
                        </>
                    )}
                </div>
            </div>
          )}

          {/* Bottom Action Area */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-30 bg-gradient-to-t from-black/60 to-transparent flex flex-col gap-4 pointer-events-auto">
             {/* Color Picker (Contextual) */}
             <div className="flex justify-center space-x-2 overflow-x-auto pb-2 hide-scrollbar">
                 {selectedElement === 'text' ? (
                     TEXT_COLORS.map(c => (
                         <button 
                            key={c}
                            onClick={() => setText(prev => prev ? {...prev, color: c} : null)}
                            className={`w-8 h-8 rounded-full border-2 shadow-sm ${text?.color === c ? 'border-white scale-110' : 'border-white/20'}`}
                            style={{ backgroundColor: c }}
                         />
                     ))
                 ) : (
                     COLORS.map(c => (
                        <button 
                           key={c}
                           onClick={() => setStoryBg(c)}
                           className={`w-8 h-8 rounded-full border-2 shadow-sm ${storyBg === c ? 'border-white scale-110' : 'border-white/20'}`}
                           style={{ backgroundColor: c }}
                        />
                    ))
                 )}
             </div>

             <button 
                onClick={handlePost} 
                disabled={isPosting}
                className="w-full bg-accent text-accent-text font-bold py-3.5 rounded-2xl hover:bg-accent-hover transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
            >
                {isPosting ? (
                    <span>Posting...</span>
                ) : (
                    <>
                        <span>Share Story</span>
                        <SendIcon />
                    </>
                )}
             </button>
          </div>
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      </div>
    </div>
  );
};

// Icons
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
const RotateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const ResizeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>;

export default StoryCreator;
