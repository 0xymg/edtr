import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crop, RotateCw, Move, X, Lock, Unlock } from 'lucide-react';

interface ImageResizeHandlerProps {
  editorRef: React.RefObject<HTMLDivElement>;
}

interface ResizeState {
  isActive: boolean;
  element: HTMLImageElement | null;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  aspectRatio: number | null;
  handle: string;
}

export function ImageResizeHandler({ editorRef }: ImageResizeHandlerProps) {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isActive: false,
    element: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    aspectRatio: null,
    handle: ''
  });
  
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const controlsRef = useRef<HTMLDivElement>(null);

  const createResizeHandles = (img: HTMLImageElement) => {
    // Remove existing handles
    removeResizeHandles();
    
    const wrapper = document.createElement('div');
    wrapper.className = 'image-resize-wrapper';
    wrapper.style.cssText = `
      position: relative;
      display: inline-block;
      border: 2px solid #3b82f6;
      border-radius: 4px;
    `;
    
    // Wrap the image
    img.parentNode?.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    
    // Create resize handles
    const handles = [
      { pos: 'nw', cursor: 'nw-resize', x: -4, y: -4 },
      { pos: 'ne', cursor: 'ne-resize', x: -4, y: -4 },
      { pos: 'sw', cursor: 'sw-resize', x: -4, y: -4 },
      { pos: 'se', cursor: 'se-resize', x: -4, y: -4 },
    ];
    
    handles.forEach(({ pos, cursor }) => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-handle-${pos}`;
      handle.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        background: #3b82f6;
        border: 1px solid white;
        cursor: ${cursor};
        z-index: 10;
      `;
      
      // Position handles
      switch (pos) {
        case 'nw':
          handle.style.top = '-4px';
          handle.style.left = '-4px';
          break;
        case 'ne':
          handle.style.top = '-4px';
          handle.style.right = '-4px';
          break;
        case 'sw':
          handle.style.bottom = '-4px';
          handle.style.left = '-4px';
          break;
        case 'se':
          handle.style.bottom = '-4px';
          handle.style.right = '-4px';
          break;
      }
      
      handle.addEventListener('mousedown', (e) => handleMouseDown(e, img, pos));
      wrapper.appendChild(handle);
    });
  };

  const removeResizeHandles = () => {
    const wrappers = document.querySelectorAll('.image-resize-wrapper');
    wrappers.forEach(wrapper => {
      const img = wrapper.querySelector('img');
      if (img && wrapper.parentNode) {
        wrapper.parentNode.insertBefore(img, wrapper);
        wrapper.remove();
      }
    });
  };

  const handleMouseDown = (e: MouseEvent, img: HTMLImageElement, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = img.getBoundingClientRect();
    const aspectRatio = lockAspectRatio ? rect.width / rect.height : null;
    
    setResizeState({
      isActive: true,
      element: img,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      aspectRatio,
      handle
    });
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizeState.isActive || !resizeState.element) return;
    
    const deltaX = e.clientX - resizeState.startX;
    const deltaY = e.clientY - resizeState.startY;
    
    let newWidth = resizeState.startWidth;
    let newHeight = resizeState.startHeight;
    
    switch (resizeState.handle) {
      case 'se':
        newWidth = Math.max(50, resizeState.startWidth + deltaX);
        newHeight = resizeState.aspectRatio 
          ? newWidth / resizeState.aspectRatio 
          : Math.max(50, resizeState.startHeight + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(50, resizeState.startWidth - deltaX);
        newHeight = resizeState.aspectRatio 
          ? newWidth / resizeState.aspectRatio 
          : Math.max(50, resizeState.startHeight + deltaY);
        break;
      case 'ne':
        newWidth = Math.max(50, resizeState.startWidth + deltaX);
        newHeight = resizeState.aspectRatio 
          ? newWidth / resizeState.aspectRatio 
          : Math.max(50, resizeState.startHeight - deltaY);
        break;
      case 'nw':
        newWidth = Math.max(50, resizeState.startWidth - deltaX);
        newHeight = resizeState.aspectRatio 
          ? newWidth / resizeState.aspectRatio 
          : Math.max(50, resizeState.startHeight - deltaY);
        break;
    }
    
    resizeState.element.style.width = `${newWidth}px`;
    resizeState.element.style.height = `${newHeight}px`;
  };

  const handleMouseUp = () => {
    setResizeState(prev => ({ ...prev, isActive: false }));
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleImageClick = (e: Event) => {
    const img = e.target as HTMLImageElement;
    if (!img.classList.contains('editor-image')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Clear previous selection
    removeResizeHandles();
    setSelectedImage(null);
    
    // Select new image
    setSelectedImage(img);
    createResizeHandles(img);
    setShowControls(true);
  };

  const handleClickOutside = (e: Event) => {
    const target = e.target as Element;
    if (!target.closest('.image-resize-wrapper') && 
        !target.closest('.image-controls') &&
        !target.classList.contains('editor-image')) {
      removeResizeHandles();
      setSelectedImage(null);
      setShowControls(false);
    }
  };

  const resetImageSize = () => {
    if (selectedImage) {
      selectedImage.style.width = 'auto';
      selectedImage.style.height = 'auto';
      selectedImage.style.maxWidth = '100%';
    }
  };

  const cropImage = () => {
    // Basic crop functionality - in a real implementation, you'd want a proper crop tool
    if (selectedImage) {
      const currentWidth = selectedImage.getBoundingClientRect().width;
      const newWidth = currentWidth * 0.8;
      selectedImage.style.width = `${newWidth}px`;
      if (lockAspectRatio && selectedImage.naturalWidth && selectedImage.naturalHeight) {
        const aspectRatio = selectedImage.naturalWidth / selectedImage.naturalHeight;
        selectedImage.style.height = `${newWidth / aspectRatio}px`;
      }
    }
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
      removeResizeHandles();
    };
  }, [editorRef]);

  if (!showControls || !selectedImage) return null;

  return (
    <div 
      ref={controlsRef}
      className="image-controls fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex gap-2 z-50"
      style={{
        top: '10px',
        right: '10px'
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
        onClick={() => {
          removeResizeHandles();
          setSelectedImage(null);
          setShowControls(false);
        }}
        title="Close"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}