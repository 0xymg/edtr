import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crop, RotateCw, X, Lock, Unlock, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageResizeHandlerProps {
  editorRef: React.RefObject<HTMLDivElement>;
}

export function ImageResizeHandler({ editorRef }: ImageResizeHandlerProps) {
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

  const selectImage = (img: HTMLImageElement) => {
    // Clear previous selection
    clearSelection();
    
    // Add selection styling
    img.style.outline = '2px solid #3b82f6';
    img.style.outlineOffset = '2px';
    img.style.position = 'relative';
    
    // Calculate toolbar position relative to image
    const rect = img.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    setToolbarPosition({
      top: rect.top + scrollTop - 50, // Position above the image
      left: rect.left + scrollLeft + rect.width - 300 // Align to right edge of image
    });
    
    setSelectedImage(img);
    setShowControls(true);
  };

  const clearSelection = () => {
    if (selectedImage) {
      selectedImage.style.outline = '';
      selectedImage.style.outlineOffset = '';
    }
    setSelectedImage(null);
    setShowControls(false);
  };

  const handleImageClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      console.log('Image clicked, selecting:', img);
      e.preventDefault();
      e.stopPropagation();
      selectImage(img);
    }
  };

  const handleClickOutside = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'IMG' && !target.closest('.image-controls')) {
      clearSelection();
    }
  };

  const resizeImage = (scale: number) => {
    if (!selectedImage) return;
    
    const currentWidth = selectedImage.offsetWidth;
    const currentHeight = selectedImage.offsetHeight;
    
    let newWidth = currentWidth * scale;
    let newHeight = currentHeight * scale;
    
    if (lockAspectRatio) {
      const aspectRatio = selectedImage.naturalWidth / selectedImage.naturalHeight;
      newHeight = newWidth / aspectRatio;
    }
    
    selectedImage.style.width = `${Math.max(50, newWidth)}px`;
    selectedImage.style.height = `${Math.max(50, newHeight)}px`;
  };

  const cropImage = () => {
    if (!selectedImage) return;
    
    // Create a more sophisticated crop effect by adjusting both dimensions and using object-fit
    const currentWidth = selectedImage.offsetWidth;
    const currentHeight = selectedImage.offsetHeight;
    
    // Crop by reducing size by 20% on each side (effectively 60% of original)
    const newWidth = Math.max(50, currentWidth * 0.7);
    const newHeight = Math.max(50, currentHeight * 0.7);
    
    selectedImage.style.width = `${newWidth}px`;
    selectedImage.style.height = `${newHeight}px`;
    selectedImage.style.objectFit = 'cover';
    selectedImage.style.objectPosition = 'center';
  };

  const resetImageSize = () => {
    if (!selectedImage) return;
    
    selectedImage.style.width = '';
    selectedImage.style.height = '';
    selectedImage.style.maxWidth = '100%';
    selectedImage.style.objectFit = '';
    selectedImage.style.objectPosition = '';
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    
    // Add click listeners to images
    editor.addEventListener('click', handleImageClick);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      editor.removeEventListener('click', handleImageClick);
      document.removeEventListener('click', handleClickOutside);
      clearSelection();
    };
  }, [editorRef]);

  if (!showControls || !selectedImage) return null;

  return (
    <div 
      className="image-controls fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex gap-2 z-50"
      style={{
        top: `${Math.max(10, toolbarPosition.top)}px`,
        left: `${Math.max(10, Math.min(toolbarPosition.left, window.innerWidth - 320))}px`
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLockAspectRatio(!lockAspectRatio)}
        title={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
      >
        {lockAspectRatio ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => resizeImage(1.2)}
        title="Enlarge image"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => resizeImage(0.8)}
        title="Shrink image"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={cropImage}
        title="Crop image"
      >
        <Crop className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={resetImageSize}
        title="Reset to original size"
      >
        <RotateCw className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={clearSelection}
        title="Close"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}