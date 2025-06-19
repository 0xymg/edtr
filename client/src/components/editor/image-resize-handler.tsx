import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crop, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { InlineCrop } from './inline-crop';

interface ImageResizeHandlerProps {
  editorRef: React.RefObject<HTMLDivElement>;
}

export function ImageResizeHandler({ editorRef }: ImageResizeHandlerProps) {
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [showInlineCrop, setShowInlineCrop] = useState(false);

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
    // Don't clear selection if crop mode is active
    if (showInlineCrop) return;
    
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

  const makeBigger = () => {
    resizeImage(1.2); // 20% bigger
  };

  const makeSmaller = () => {
    resizeImage(0.8); // 20% smaller
  };

  const openInlineCrop = () => {
    setShowInlineCrop(true);
    setShowControls(false); // Hide toolbar during crop
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    if (selectedImage) {
      selectedImage.src = croppedDataUrl;
      setShowInlineCrop(false);
      setShowControls(true); // Show toolbar again
    }
  };

  const handleCropCancel = () => {
    setShowInlineCrop(false);
    setShowControls(true); // Show toolbar again
  };

  const rotateImage = () => {
    if (!selectedImage) return;
    
    // Get current rotation or start at 0
    const currentTransform = selectedImage.style.transform || '';
    const rotateMatch = currentTransform.match(/rotate\((-?\d+)deg\)/);
    const currentRotation = rotateMatch ? parseInt(rotateMatch[1]) : 0;
    
    // Rotate by 90 degrees
    const newRotation = (currentRotation + 90) % 360;
    
    // Apply rotation transform
    const otherTransforms = currentTransform.replace(/rotate\(-?\d+deg\)\s?/g, '').trim();
    const newTransform = `${otherTransforms} rotate(${newRotation}deg)`.trim();
    
    selectedImage.style.transform = newTransform;
    selectedImage.style.transformOrigin = 'center center';
  };

  const resetImageSize = () => {
    if (!selectedImage) return;
    
    // Reset all image styles to original
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

  return (
    <>
      {showControls && selectedImage && (
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
            onClick={makeBigger}
            title="Make bigger"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={makeSmaller}
            title="Make smaller"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={openInlineCrop}
            title="Crop image"
          >
            <Crop className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={rotateImage}
            title="Rotate 90° clockwise"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {selectedImage && showInlineCrop && (
        <InlineCrop
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}