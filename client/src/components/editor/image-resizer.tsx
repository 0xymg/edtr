import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Crop, RotateCw, FlipHorizontal, FlipVertical, Move, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageResizerProps {
  src: string;
  alt?: string;
  onResize: (width: number, height: number) => void;
  onCrop: (cropData: { x: number; y: number; width: number; height: number }) => void;
  onClose: () => void;
  initialWidth?: number;
  initialHeight?: number;
}

interface ResizeHandle {
  position: string;
  cursor: string;
  x: number;
  y: number;
}

export function ImageResizer({ 
  src, 
  alt = '', 
  onResize, 
  onCrop, 
  onClose, 
  initialWidth = 300, 
  initialHeight = 200 
}: ImageResizerProps) {
  const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });
  const [isResizing, setIsResizing] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resizeHandles: ResizeHandle[] = [
    { position: 'nw', cursor: 'nw-resize', x: 0, y: 0 },
    { position: 'n', cursor: 'n-resize', x: 0.5, y: 0 },
    { position: 'ne', cursor: 'ne-resize', x: 1, y: 0 },
    { position: 'e', cursor: 'e-resize', x: 1, y: 0.5 },
    { position: 'se', cursor: 'se-resize', x: 1, y: 1 },
    { position: 's', cursor: 's-resize', x: 0.5, y: 1 },
    { position: 'sw', cursor: 'sw-resize', x: 0, y: 1 },
    { position: 'w', cursor: 'w-resize', x: 0, y: 0.5 },
  ];

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    e.preventDefault();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });

    const startDimensions = { ...dimensions };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStart.x;
      const deltaY = moveEvent.clientY - dragStart.y;

      let newWidth = startDimensions.width;
      let newHeight = startDimensions.height;

      // Calculate new dimensions based on handle position
      switch (handle.position) {
        case 'se':
          newWidth = Math.max(50, startDimensions.width + deltaX);
          newHeight = aspectRatio 
            ? newWidth / aspectRatio 
            : Math.max(50, startDimensions.height + deltaY);
          break;
        case 'nw':
          newWidth = Math.max(50, startDimensions.width - deltaX);
          newHeight = aspectRatio 
            ? newWidth / aspectRatio 
            : Math.max(50, startDimensions.height - deltaY);
          break;
        case 'ne':
          newWidth = Math.max(50, startDimensions.width + deltaX);
          newHeight = aspectRatio 
            ? newWidth / aspectRatio 
            : Math.max(50, startDimensions.height - deltaY);
          break;
        case 'sw':
          newWidth = Math.max(50, startDimensions.width - deltaX);
          newHeight = aspectRatio 
            ? newWidth / aspectRatio 
            : Math.max(50, startDimensions.height + deltaY);
          break;
        case 'n':
          newHeight = Math.max(50, startDimensions.height - deltaY);
          if (aspectRatio) newWidth = newHeight * aspectRatio;
          break;
        case 's':
          newHeight = Math.max(50, startDimensions.height + deltaY);
          if (aspectRatio) newWidth = newHeight * aspectRatio;
          break;
        case 'e':
          newWidth = Math.max(50, startDimensions.width + deltaX);
          if (aspectRatio) newHeight = newWidth / aspectRatio;
          break;
        case 'w':
          newWidth = Math.max(50, startDimensions.width - deltaX);
          if (aspectRatio) newHeight = newWidth / aspectRatio;
          break;
      }

      setDimensions({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      onResize(dimensions.width, dimensions.height);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [dimensions, dragStart, aspectRatio, onResize]);

  const handleCropStart = useCallback((e: React.MouseEvent) => {
    if (!isCropping) return;
    
    e.preventDefault();
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    setCropArea({ x: startX, y: startY, width: 0, height: 0 });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX - rect.left;
      const currentY = moveEvent.clientY - rect.top;
      
      setCropArea({
        x: Math.min(startX, currentX),
        y: Math.min(startY, currentY),
        width: Math.abs(currentX - startX),
        height: Math.abs(currentY - startY)
      });
    };

    const handleMouseUp = () => {
      setIsCropping(false);
      if (cropArea.width > 10 && cropArea.height > 10) {
        onCrop(cropArea);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isCropping, cropArea, onCrop]);

  const toggleAspectRatio = () => {
    if (aspectRatio) {
      setAspectRatio(null);
    } else {
      setAspectRatio(dimensions.width / dimensions.height);
    }
  };

  const resetDimensions = () => {
    if (imageRef.current) {
      const img = imageRef.current;
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Resize & Crop Image</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-4 mb-4">
          <Button
            variant={isCropping ? "default" : "outline"}
            size="sm"
            onClick={() => setIsCropping(!isCropping)}
          >
            <Crop className="h-4 w-4 mr-2" />
            Crop
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAspectRatio}
          >
            <Move className="h-4 w-4 mr-2" />
            {aspectRatio ? 'Free Resize' : 'Lock Ratio'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetDimensions}
          >
            Reset Size
          </Button>
        </div>

        <div 
          ref={containerRef}
          className="relative inline-block border-2 border-dashed border-gray-300 dark:border-gray-600"
          style={{ width: dimensions.width, height: dimensions.height }}
        >
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className={cn(
              "w-full h-full object-contain",
              isCropping && "cursor-crosshair"
            )}
            style={{ width: dimensions.width, height: dimensions.height }}
            onMouseDown={handleCropStart}
            draggable={false}
          />

          {/* Resize Handles */}
          {!isCropping && resizeHandles.map((handle) => (
            <div
              key={handle.position}
              className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-sm cursor-pointer hover:bg-blue-600"
              style={{
                left: `${handle.x * 100}%`,
                top: `${handle.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                cursor: handle.cursor
              }}
              onMouseDown={(e) => handleMouseDown(e, handle)}
            />
          ))}

          {/* Crop Area Overlay */}
          {isCropping && cropArea.width > 0 && cropArea.height > 0 && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/20"
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height,
                pointerEvents: 'none'
              }}
            />
          )}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {dimensions.width} × {dimensions.height} px
            {aspectRatio && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                (Ratio locked)
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onResize(dimensions.width, dimensions.height);
                onClose();
              }}
            >
              Apply Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}