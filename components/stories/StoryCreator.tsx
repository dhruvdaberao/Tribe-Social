




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

interface StoryCreatorProps {
  onClose: () => void;
  onCreate: (storyData: Omit<Story, 'id' | 'user' | 'createdAt' | 'author' | 'likes'>) => void;
}

const COLORS = ['#2A2320', '#EAE4E0', '#B59477', '#8A7B74', '#1F2937', '#7F1D1D', '#7C2D12', '#064E3B'];
const TEXT_COLORS = ['#FFFFFF', '#000000', '#2A2320', '#B59477'];

const StoryCreator: React.FC<StoryCreatorProps> = ({ onClose, onCreate }) => {
  const [image, setImage] = useState<{ src: string, pos: { x: number, y: number }, scale: number, rotation: number } | null>(null);
  const [text, setText] = useState<{ content: string, pos: { x: number, y: number }, scale: number, rotation: number, color: string } | null>(null);
  const [bgColor, setBgColor] = useState('#2A2320');
  const [isEditingText, setIsEditingText] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedElement, setSelectedElement] = useState<'text' | 'image' | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragInfo = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, initialRotation: 0, initialScale: 1, action: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ src: reader.result as string, pos: { x: 20, y: 30 }, scale: 1, rotation: 0 });
        setSelectedElement('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddText = () => {
    if (!text) setText({ content: 'Tap to Edit', pos: { x: 30, y: 40 }, scale: 1, rotation: 0, color: '#FFFFFF' });
    setSelectedElement('text');
    setIsEditingText(true);
  };

  // --- MOUSE HANDLERS FOR DRAG/RESIZE/ROTATE ---
  const handleMouseDown = (e: React.MouseEvent, type: 'text' | 'image', action: string = 'move') => {
      e.stopPropagation();
      e.preventDefault();
      setSelectedElement(type);
      const target = type === 'text' ? text : image;
      if (!target) return;

      dragInfo.current = {
          startX: e.clientX,
          startY: e.clientY,
          initialX: target.pos.x,
          initialY: target.pos.y,
          initialRotation: target.rotation,
          initialScale: target.scale,
          action
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
      const { startX, startY, initialX, initialY, initialRotation, initialScale, action } = dragInfo.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Update State helper
      const updateState = (updates: any) => {
          if (selectedElement === 'text') setText(prev => prev ? { ...prev, ...updates } : null);
          else setImage(prev => prev ? { ...prev, ...updates } : null);
      };

      if (action === 'move') {
          // Convert pixel movement to % if you wanted, but pixel is fine for creator if we convert on save
          // Actually, saving as % is better for responsiveness.
          // Let's stick to pixel for live editing, convert to % on save.
          const canvasRect = canvasRef.current?.getBoundingClientRect();
          if(!canvasRect) return;
          const xPercent = ((initialX / 100) * canvasRect.width + dx) / canvasRect.width * 100;
          const yPercent = ((initialY / 100) * canvasRect.height + dy) / canvasRect.height * 100;
          updateState({ pos: { x: xPercent, y: yPercent } });
      } else if (action === 'rotate') {
          // Simple x-drag for rotation
          updateState({ rotation: initialRotation + dx });
      } else if (action === 'resize') {
          // Simple drag for scale
          const scaleDelta = (dx + dy) * 0.01;
          updateState({ scale: Math.max(0.5, initialScale + scaleDelta) });
      }
  };

  const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
  };

  const handlePost = () => {
    if (!image && (!text || !text.content.trim())) return alert("Empty story!");
    setIsPosting(true);
    onCreate({
        imageUrl: image?.src,
        text: text?.content,
        // Save current state
        textPosition: text?.pos,
        imagePosition: image?.pos,
        textRotation: text?.rotation,
        imageRotation: image?.rotation,
        textScale: text?.scale,
        imageScale: image?.scale,
        textColor: text?.color,
        backgroundColor: bgColor
    });
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      {/* Container */}
      <div 
        className="relative w-full max-w-[360px] aspect-[9/16] rounded-3xl overflow-hidden flex flex-col border-4 border-white/20 shadow-2xl transition-colors duration-300"
        style={{ backgroundColor: bgColor }}
      >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between pointer-events-none">
              <button onClick={onClose} className="pointer-events-auto p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30"><BackIcon /></button>
              <div className="flex space-x-2 pointer-events-auto">
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30"><CameraIcon /></button>
                  <button onClick={handleAddText} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30"><PenIcon /></button>
              </div>
          </div>

          {/* Canvas */}
          <div ref={canvasRef} className="flex-1 relative overflow-hidden" onMouseDown={() => setSelectedElement(null)}>
              {image && (
                  <div 
                    className="absolute"
                    style={{ 
                        left: `${image.pos.x}%`, top: `${image.pos.y}%`, 
                        transform: `translate(-50%, -50%) rotate(${image.rotation}deg) scale(${image.scale})`,
                        cursor: 'move'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'image', 'move')}
                  >
                      <div className={`relative ${selectedElement === 'image' ? 'ring-2 ring-blue-400 ring-dashed p-1' : ''}`}>
                          <img src={image.src} alt="" className="w-48 rounded-lg shadow-xl pointer-events-none" />
                          {selectedElement === 'image' && (
                              <>
                                <button onMouseDown={(e) => handleMouseDown(e, 'image', 'rotate')} className="absolute -top-3 -right-3 w-6 h-6 bg-white rounded-full text-blue-500 shadow-md flex items-center justify-center"><RotateIcon/></button>
                                <button onMouseDown={(e) => handleMouseDown(e, 'image', 'resize')} className="absolute -bottom-3 -right-3 w-6 h-6 bg-white rounded-full text-blue-500 shadow-md flex items-center justify-center"><ResizeIcon/></button>
                              </>
                          )}
                      </div>
                  </div>
              )}
              {text && (
                  <div 
                    className="absolute"
                    style={{
                        left: `${text.pos.x}%`, top: `${text.pos.y}%`,
                        transform: `translate(-50%, -50%) rotate(${text.rotation}deg) scale(${text.scale})`,
                        cursor: 'move'
                    }}
                    onMouseDown={(e) => !isEditingText && handleMouseDown(e, 'text', 'move')}
                  >
                      <div className={`relative ${selectedElement === 'text' && !isEditingText ? 'ring-2 ring-blue-400 ring-dashed p-2' : ''}`}>
                          {isEditingText ? (
                              <textarea 
                                autoFocus value={text.content} 
                                onChange={e => setText(p => p ? {...p, content: e.target.value} : null)} 
                                onBlur={() => setIsEditingText(false)}
                                className="bg-transparent text-center text-2xl font-bold font-display resize-none outline-none overflow-hidden"
                                style={{ color: text.color, minWidth: '150px' }}
                              />
                          ) : (
                              <div className="text-2xl font-bold font-display text-center whitespace-pre-wrap select-none" style={{ color: text.color, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }} onDoubleClick={() => setIsEditingText(true)}>
                                  {text.content}
                              </div>
                          )}
                          {selectedElement === 'text' && !isEditingText && (
                              <>
                                <button onMouseDown={(e) => handleMouseDown(e, 'text', 'rotate')} className="absolute -top-3 -right-3 w-6 h-6 bg-white rounded-full text-blue-500 shadow-md flex items-center justify-center"><RotateIcon/></button>
                                <button onMouseDown={(e) => handleMouseDown(e, 'text', 'resize')} className="absolute -bottom-3 -right-3 w-6 h-6 bg-white rounded-full text-blue-500 shadow-md flex items-center justify-center"><ResizeIcon/></button>
                              </>
                          )}
                      </div>
                  </div>
              )}
          </div>

          {/* Footer Controls */}
          <div className="bg-black/40 backdrop-blur-md p-4 space-y-3 z-30">
              <div className="flex space-x-2 overflow-x-auto hide-scrollbar justify-center">
                  {selectedElement === 'text' ? (
                      TEXT_COLORS.map(c => <button key={c} onClick={() => setText(p => p ? {...p, color: c} : null)} className="w-8 h-8 rounded-full border-2 border-white/50 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />)
                  ) : (
                      COLORS.map(c => <button key={c} onClick={() => setBgColor(c)} className="w-8 h-8 rounded-full border-2 border-white/50 hover:scale-110 transition-transform" style={{ backgroundColor: c }} />)
                  )}
              </div>
              <button onClick={handlePost} disabled={isPosting} className="w-full bg-[#B59477] text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50">
                  {isPosting ? 'Sharing...' : 'Share to Story'}
              </button>
          </div>
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      </div>
    </div>
  );
};

// Icons
const BackIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const CameraIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PenIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" /></svg>;
const RotateIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const ResizeIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>;

export default StoryCreator;