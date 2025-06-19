import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X, Check } from 'lucide-react';

interface CropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  image: HTMLImageElement;
  onCropComplete: (croppedDataUrl: string) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

type ResizeHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export function CropDialog({ isOpen, onClose, image, onCropComplete }: CropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 50, y: 50, width: 200, height: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [originalCropArea, setOriginalCropArea] = useState<CropArea>({ x: 50, y: 50, width: 200, height: 150 });

  useEffect(() => {
    if (isOpen && image) {
      // Reset crop area when dialog opens
      const defaultWidth = Math.min(200, image.naturalWidth * 0.6);
      const defaultHeight = Math.min(150, image.naturalHeight * 0.6);
      const defaultX = (image.naturalWidth - defaultWidth) / 2;
      const defaultY = (image.naturalHeight - defaultHeight) / 2;
      
      setCropArea({
        x: defaultX,
        y: defaultY,
        width: defaultWidth,
        height: defaultHeight
      });
      setImageLoaded(true);
    }
  }, [isOpen, image]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to fit the dialog
    const maxWidth = 500;
    const maxHeight = 400;
    const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
    
    canvas.width = image.naturalWidth * scale;
    canvas.height = image.naturalHeight * scale;

    // Draw the image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw overlay (darken everything except crop area)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear the crop area (make it visible)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(
      cropArea.x * scale,
      cropArea.y * scale,
      cropArea.width * scale,
      cropArea.height * scale
    );

    // Draw crop area border
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      cropArea.x * scale,
      cropArea.y * scale,
      cropArea.width * scale,
      cropArea.height * scale
    );

    // Draw resize handles
    const handleSize = 8;
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // Corner handles
    const handles = [
      { x: cropArea.x * scale, y: cropArea.y * scale }, // nw
      { x: (cropArea.x + cropArea.width) * scale, y: cropArea.y * scale }, // ne
      { x: cropArea.x * scale, y: (cropArea.y + cropArea.height) * scale }, // sw
      { x: (cropArea.x + cropArea.width) * scale, y: (cropArea.y + cropArea.height) * scale }, // se
      // Edge handles
      { x: (cropArea.x + cropArea.width/2) * scale, y: cropArea.y * scale }, // n
      { x: (cropArea.x + cropArea.width/2) * scale, y: (cropArea.y + cropArea.height) * scale }, // s
      { x: cropArea.x * scale, y: (cropArea.y + cropArea.height/2) * scale }, // w
      { x: (cropArea.x + cropArea.width) * scale, y: (cropArea.y + cropArea.height/2) * scale }, // e
    ];
    
    handles.forEach(handle => {
      ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
    });
  }, [image, cropArea, imageLoaded]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const getHandleAtPosition = (x: number, y: number, scale: number): ResizeHandle | null => {
    const handleSize = 8;
    const threshold = handleSize / scale;
    
    // Check corner handles
    if (Math.abs(x - cropArea.x) <= threshold && Math.abs(y - cropArea.y) <= threshold) return 'nw';
    if (Math.abs(x - (cropArea.x + cropArea.width)) <= threshold && Math.abs(y - cropArea.y) <= threshold) return 'ne';
    if (Math.abs(x - cropArea.x) <= threshold && Math.abs(y - (cropArea.y + cropArea.height)) <= threshold) return 'sw';
    if (Math.abs(x - (cropArea.x + cropArea.width)) <= threshold && Math.abs(y - (cropArea.y + cropArea.height)) <= threshold) return 'se';
    
    // Check edge handles
    if (Math.abs(x - (cropArea.x + cropArea.width/2)) <= threshold && Math.abs(y - cropArea.y) <= threshold) return 'n';
    if (Math.abs(x - (cropArea.x + cropArea.width/2)) <= threshold && Math.abs(y - (cropArea.y + cropArea.height)) <= threshold) return 's';
    if (Math.abs(x - cropArea.x) <= threshold && Math.abs(y - (cropArea.y + cropArea.height/2)) <= threshold) return 'w';
    if (Math.abs(x - (cropArea.x + cropArea.width)) <= threshold && Math.abs(y - (cropArea.y + cropArea.height/2)) <= threshold) return 'e';
    
    // Check if inside crop area (for moving)
    if (x >= cropArea.x && x <= cropArea.x + cropArea.width && 
        y >= cropArea.y && y <= cropArea.y + cropArea.height) return 'move';
    
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / image.naturalWidth;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const handle = getHandleAtPosition(x, y, scale);
    if (!handle) return;

    setActiveHandle(handle);
    setIsDragging(true);
    setDragStart({ x, y });
    setOriginalCropArea({ ...cropArea });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !activeHandle) return;
    
    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / image.naturalWidth;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    let newCropArea = { ...originalCropArea };

    switch (activeHandle) {
      case 'move':
        newCropArea.x = Math.max(0, Math.min(originalCropArea.x + deltaX, image.naturalWidth - originalCropArea.width));
        newCropArea.y = Math.max(0, Math.min(originalCropArea.y + deltaY, image.naturalHeight - originalCropArea.height));
        break;
      case 'nw':
        newCropArea.x = Math.max(0, Math.min(originalCropArea.x + deltaX, originalCropArea.x + originalCropArea.width - 20));
        newCropArea.y = Math.max(0, Math.min(originalCropArea.y + deltaY, originalCropArea.y + originalCropArea.height - 20));
        newCropArea.width = originalCropArea.width - deltaX;
        newCropArea.height = originalCropArea.height - deltaY;
        break;
      case 'ne':
        newCropArea.y = Math.max(0, Math.min(originalCropArea.y + deltaY, originalCropArea.y + originalCropArea.height - 20));
        newCropArea.width = Math.max(20, Math.min(originalCropArea.width + deltaX, image.naturalWidth - originalCropArea.x));
        newCropArea.height = originalCropArea.height - deltaY;
        break;
      case 'sw':
        newCropArea.x = Math.max(0, Math.min(originalCropArea.x + deltaX, originalCropArea.x + originalCropArea.width - 20));
        newCropArea.width = originalCropArea.width - deltaX;
        newCropArea.height = Math.max(20, Math.min(originalCropArea.height + deltaY, image.naturalHeight - originalCropArea.y));
        break;
      case 'se':
        newCropArea.width = Math.max(20, Math.min(originalCropArea.width + deltaX, image.naturalWidth - originalCropArea.x));
        newCropArea.height = Math.max(20, Math.min(originalCropArea.height + deltaY, image.naturalHeight - originalCropArea.y));
        break;
      case 'n':
        newCropArea.y = Math.max(0, Math.min(originalCropArea.y + deltaY, originalCropArea.y + originalCropArea.height - 20));
        newCropArea.height = originalCropArea.height - deltaY;
        break;
      case 's':
        newCropArea.height = Math.max(20, Math.min(originalCropArea.height + deltaY, image.naturalHeight - originalCropArea.y));
        break;
      case 'w':
        newCropArea.x = Math.max(0, Math.min(originalCropArea.x + deltaX, originalCropArea.x + originalCropArea.width - 20));
        newCropArea.width = originalCropArea.width - deltaX;
        break;
      case 'e':
        newCropArea.width = Math.max(20, Math.min(originalCropArea.width + deltaX, image.naturalWidth - originalCropArea.x));
        break;
    }

    setCropArea(newCropArea);
  }, [isDragging, activeHandle, dragStart, originalCropArea, image]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setActiveHandle(null);
  }, []);

  const getCursorStyle = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return 'grabbing';
    
    const canvas = canvasRef.current;
    if (!canvas) return 'default';

    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / image.naturalWidth;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const handle = getHandleAtPosition(x, y, scale);
    
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
    onClose();
  };

  // Completely disable dialog closing during any interaction
  const handleDialogChange = useCallback((open: boolean) => {
    // Never allow the dialog to close automatically
    if (!open) {
      return;
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent 
        className="max-w-2xl" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center p-4" onMouseDown={(e) => e.stopPropagation()}>
          <canvas
            ref={canvasRef}
            className="border border-gray-300"
            onMouseDown={handleMouseDown}
            onMouseMove={(e) => {
              const canvas = e.currentTarget;
              canvas.style.cursor = getCursorStyle(e);
            }}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        <div className="text-sm text-gray-600 text-center">
          Drag the blue rectangle to select the area to crop
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleCrop();
            }}
          >
            <Check className="h-4 w-4 mr-2" />
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}