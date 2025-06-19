import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface InlineCropProps {
  image: HTMLImageElement;
  onCropComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

type ResizeHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export function InlineCrop({ image, onCropComplete, onCancel }: InlineCropProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ 
    x: 50, 
    y: 50, 
    width: Math.min(200, image.naturalWidth - 100), 
    height: Math.min(150, image.naturalHeight - 100) 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalCropArea, setOriginalCropArea] = useState<CropArea>(cropArea);

  // Get image position and scale for overlay positioning
  const getImageBounds = useCallback(() => {
    const rect = image.getBoundingClientRect();
    const scaleX = rect.width / image.naturalWidth;
    const scaleY = rect.height / image.naturalHeight;
    return { rect, scaleX, scaleY };
  }, [image]);

  const getHandleAtPosition = (x: number, y: number): ResizeHandle | null => {
    const handleSize = 8;
    const threshold = handleSize;
    
    const { scaleX, scaleY } = getImageBounds();
    const scaledX = x / scaleX;
    const scaledY = y / scaleY;
    
    // Check corner handles
    if (Math.abs(scaledX - cropArea.x) <= threshold && Math.abs(scaledY - cropArea.y) <= threshold) return 'nw';
    if (Math.abs(scaledX - (cropArea.x + cropArea.width)) <= threshold && Math.abs(scaledY - cropArea.y) <= threshold) return 'ne';
    if (Math.abs(scaledX - cropArea.x) <= threshold && Math.abs(scaledY - (cropArea.y + cropArea.height)) <= threshold) return 'sw';
    if (Math.abs(scaledX - (cropArea.x + cropArea.width)) <= threshold && Math.abs(scaledY - (cropArea.y + cropArea.height)) <= threshold) return 'se';
    
    // Check edge handles
    if (Math.abs(scaledX - (cropArea.x + cropArea.width/2)) <= threshold && Math.abs(scaledY - cropArea.y) <= threshold) return 'n';
    if (Math.abs(scaledX - (cropArea.x + cropArea.width/2)) <= threshold && Math.abs(scaledY - (cropArea.y + cropArea.height)) <= threshold) return 's';
    if (Math.abs(scaledX - cropArea.x) <= threshold && Math.abs(scaledY - (cropArea.y + cropArea.height/2)) <= threshold) return 'w';
    if (Math.abs(scaledX - (cropArea.x + cropArea.width)) <= threshold && Math.abs(scaledY - (cropArea.y + cropArea.height/2)) <= threshold) return 'e';
    
    // Check if inside crop area (for moving)
    if (scaledX >= cropArea.x && scaledX <= cropArea.x + cropArea.width && 
        scaledY >= cropArea.y && scaledY <= cropArea.y + cropArea.height) return 'move';
    
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { rect, scaleX, scaleY } = getImageBounds();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);

    const handle = getHandleAtPosition(x, y);
    if (!handle) return;

    setActiveHandle(handle);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOriginalCropArea({ ...cropArea });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !activeHandle) return;
    
    e.preventDefault();
    e.stopPropagation();

    const deltaX = (e.clientX - dragStart.x);
    const deltaY = (e.clientY - dragStart.y);
    
    const { scaleX, scaleY } = getImageBounds();
    const scaledDeltaX = deltaX / scaleX;
    const scaledDeltaY = deltaY / scaleY;

    let newCropArea = { ...originalCropArea };

    switch (activeHandle) {
      case 'move':
        newCropArea.x = Math.max(0, Math.min(originalCropArea.x + scaledDeltaX, image.naturalWidth - originalCropArea.width));
        newCropArea.y = Math.max(0, Math.min(originalCropArea.y + scaledDeltaY, image.naturalHeight - originalCropArea.height));
        break;
      case 'nw':
        newCropArea.x = Math.max(0, Math.min(originalCropArea.x + scaledDeltaX, originalCropArea.x + originalCropArea.width - 20));
        newCropArea.y = Math.max(0, Math.min(originalCropArea.y + scaledDeltaY, originalCropArea.y + originalCropArea.height - 20));
        newCropArea.width = originalCropArea.width - scaledDeltaX;
        newCropArea.height = originalCropArea.height - scaledDeltaY;
        break;
      case 'ne':
        newCropArea.y = Math.max(0, Math.min(originalCropArea.y + scaledDeltaY, originalCropArea.y + originalCropArea.height - 20));
        newCropArea.width = Math.max(20, Math.min(originalCropArea.width + scaledDeltaX, image.naturalWidth - originalCropArea.x));
        newCropArea.height = originalCropArea.height - scaledDeltaY;
        break;
      case 'sw':
        newCropArea.x = Math.max(0, Math.min(originalCropArea.x + scaledDeltaX, originalCropArea.x + originalCropArea.width - 20));
        newCropArea.width = originalCropArea.width - scaledDeltaX;
        newCropArea.height = Math.max(20, Math.min(originalCropArea.height + scaledDeltaY, image.naturalHeight - originalCropArea.y));
        break;
      case 'se':
        newCropArea.width = Math.max(20, Math.min(originalCropArea.width + scaledDeltaX, image.naturalWidth - originalCropArea.x));
        newCropArea.height = Math.max(20, Math.min(originalCropArea.height + scaledDeltaY, image.naturalHeight - originalCropArea.y));
        break;
      case 'n':
        newCropArea.y = Math.max(0, Math.min(originalCropArea.y + scaledDeltaY, originalCropArea.y + originalCropArea.height - 20));
        newCropArea.height = originalCropArea.height - scaledDeltaY;
        break;
      case 's':
        newCropArea.height = Math.max(20, Math.min(originalCropArea.height + scaledDeltaY, image.naturalHeight - originalCropArea.y));
        break;
      case 'w':
        newCropArea.x = Math.max(0, Math.min(originalCropArea.x + scaledDeltaX, originalCropArea.x + originalCropArea.width - 20));
        newCropArea.width = originalCropArea.width - scaledDeltaX;
        break;
      case 'e':
        newCropArea.width = Math.max(20, Math.min(originalCropArea.width + scaledDeltaX, image.naturalWidth - originalCropArea.x));
        break;
    }

    setCropArea(newCropArea);
  }, [isDragging, activeHandle, dragStart, originalCropArea, image, getImageBounds]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setActiveHandle(null);
  }, []);

  const getCursorStyle = (e: React.MouseEvent) => {
    if (isDragging) return 'grabbing';
    
    const { rect } = getImageBounds();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const handle = getHandleAtPosition(x, y);
    
    switch (handle) {
      case 'move': return 'grab';
      case 'nw':
      case 'se': return 'nw-resize';
      case 'ne':
      case 'sw': return 'ne-resize';
      case 'n':
      case 's': return 'ns-resize';
      case 'e':
      case 'w': return 'ew-resize';
      default: return 'default';
    }
  };

  const handleCrop = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    ctx.drawImage(
      image,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    );

    const croppedDataUrl = canvas.toDataURL('image/png');
    onCropComplete(croppedDataUrl);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const { rect, scaleX, scaleY } = getImageBounds();

  return (
    <div
      ref={overlayRef}
      className="fixed z-50"
      style={{
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
        pointerEvents: 'all'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={(e) => {
        const overlay = e.currentTarget;
        overlay.style.cursor = getCursorStyle(e);
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Clear crop area */}
      <div
        className="absolute border-2 border-blue-500 bg-transparent"
        style={{
          left: cropArea.x * scaleX,
          top: cropArea.y * scaleY,
          width: cropArea.width * scaleX,
          height: cropArea.height * scaleY,
        }}
      >
        {/* Resize handles */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white" />
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 border border-white" />
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 border border-white" />
        <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 border border-white" />
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 border border-white" />
      </div>
      
      {/* Control buttons */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="bg-white text-black hover:bg-gray-100"
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleCrop();
          }}
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          <Check className="h-4 w-4 mr-1" />
          Apply Crop
        </Button>
      </div>
    </div>
  );
}