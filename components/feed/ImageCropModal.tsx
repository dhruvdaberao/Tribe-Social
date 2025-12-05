import React, { useState, useRef, useEffect } from 'react';

interface ImageCropModalProps {
  src: string;
  onClose: () => void;
  onCropComplete: (croppedImageUrl: string) => void;
  isPosting: boolean;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ src, onClose, onCropComplete, isPosting }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 200, height: 250 });
  const [drag, setDrag] = useState({ active: false, type: '', offset: { x: 0, y: 0 } });

  const handleMouseDown = (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLDivElement;
    const startX = e.clientX;
    const startY = e.clientY;
    
    let offset = { x: 0, y: 0 };
    if (type === 'move') {
        offset = { x: startX - crop.x, y: startY - crop.y };
    }

    setDrag({ active: true, type, offset });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drag.active || !canvasRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    setCrop(c => {
        let { x: newX, y: newY, width: newWidth, height: newHeight } = c;
        if (drag.type === 'move') {
            newX = e.clientX - drag.offset.x;
            newY = e.clientY - drag.offset.y;
        } else { // Resize
            const right = c.x + c.width;
            const bottom = c.y + c.height;
            if (drag.type.includes('right')) newWidth = x - c.x;
            if (drag.type.includes('left')) {
                newWidth = right - x;
                newX = x;
            }
            if (drag.type.includes('bottom')) newHeight = y - c.y;
            if (drag.type.includes('top')) {
                newHeight = bottom - y;
                newY = y;
            }
        }
        
        // Constrain movement
        newX = Math.max(0, Math.min(newX, canvasRect.width - newWidth));
        newY = Math.max(0, Math.min(newY, canvasRect.height - newHeight));
        // Constrain size
        newWidth = Math.max(50, Math.min(newWidth, canvasRect.width - newX));
        newHeight = Math.max(50, Math.min(newHeight, canvasRect.height - newY));

        return { x: newX, y: newY, width: newWidth, height: newHeight };
    });
  };

  const handleMouseUp = () => {
    setDrag({ active: false, type: '', offset: { x: 0, y: 0 } });
  };

  const handleCrop = () => {
    const image = imageRef.current;
    const canvas = document.createElement('canvas');
    if (!image) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedImageUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-lg border border-border">
        <div className="p-4 flex justify-between items-center border-b border-border">
          <h2 className="text-xl font-bold text-primary">Crop Image</h2>
          <button onClick={onClose} className="text-secondary hover:text-primary">&times;</button>
        </div>
        <div ref={canvasRef} className="relative w-full flex-1 flex items-center justify-center p-4 select-none overflow-hidden">
          <img ref={imageRef} src={src} alt="To be cropped" className="max-w-full max-h-full" />
          <div className="absolute inset-0 bg-black/50" style={{ clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0 0, ${crop.x}px ${crop.y}px, ${crop.x}px ${crop.y + crop.height}px, ${crop.x + crop.width}px ${crop.y + crop.height}px, ${crop.x + crop.width}px ${crop.y}px, ${crop.x}px ${crop.y}px)` }} />
          <div
            className="absolute border-2 border-dashed border-white cursor-move"
            style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height }}
            onMouseDown={(e) => handleMouseDown(e, 'move')}
          >
            <div onMouseDown={(e) => handleMouseDown(e, 'top-left')} className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full cursor-nwse-resize" />
            <div onMouseDown={(e) => handleMouseDown(e, 'top-right')} className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full cursor-nesw-resize" />
            <div onMouseDown={(e) => handleMouseDown(e, 'bottom-left')} className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full cursor-nesw-resize" />
            <div onMouseDown={(e) => handleMouseDown(e, 'bottom-right')} className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full cursor-nwse-resize" />
          </div>
        </div>
        <div className="p-4 flex justify-end items-center border-t border-border">
          <button onClick={onClose} disabled={isPosting} className="text-secondary font-semibold px-4 py-2 rounded-lg hover:bg-background">Cancel</button>
          <button onClick={handleCrop} disabled={isPosting} className="bg-accent text-accent-text font-semibold px-6 py-2 rounded-lg hover:bg-accent-hover disabled:opacity-50">
            {isPosting ? 'Posting...' : 'Crop & Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;