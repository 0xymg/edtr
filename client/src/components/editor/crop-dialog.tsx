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

export function CropDialog({ isOpen, onClose, image, onCropComplete }: CropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 50, y: 50, width: 200, height: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

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

    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = '#3b82f6';
    
    // Top-left
    ctx.fillRect(cropArea.x * scale - handleSize/2, cropArea.y * scale - handleSize/2, handleSize, handleSize);
    // Top-right
    ctx.fillRect((cropArea.x + cropArea.width) * scale - handleSize/2, cropArea.y * scale - handleSize/2, handleSize, handleSize);
    // Bottom-left
    ctx.fillRect(cropArea.x * scale - handleSize/2, (cropArea.y + cropArea.height) * scale - handleSize/2, handleSize, handleSize);
    // Bottom-right
    ctx.fillRect((cropArea.x + cropArea.width) * scale - handleSize/2, (cropArea.y + cropArea.height) * scale - handleSize/2, handleSize, handleSize);
  }, [image, cropArea, imageLoaded]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / image.naturalWidth;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / image.naturalWidth;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    setCropArea(prev => ({
      x: Math.max(0, Math.min(prev.x + deltaX, image.naturalWidth - prev.width)),
      y: Math.max(0, Math.min(prev.y + deltaY, image.naturalHeight - prev.height)),
      width: prev.width,
      height: prev.height
    }));

    setDragStart({ x, y });
  }, [isDragging, dragStart, image]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center p-4">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 cursor-move"
            onMouseDown={handleMouseDown}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        <div className="text-sm text-gray-600 text-center">
          Drag the blue rectangle to select the area to crop
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleCrop}>
            <Check className="h-4 w-4 mr-2" />
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}