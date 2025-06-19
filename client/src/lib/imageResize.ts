export function enableImageResize() {
  let isResizing = false;
  let currentImage: HTMLImageElement | null = null;
  let resizeDirection = '';
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;
  let aspectRatio = 1;

  const handlePositions = [
    { position: 'top-left', cursor: 'nw-resize', top: '-5px', left: '-5px' },
    { position: 'top', cursor: 'n-resize', top: '-5px', left: '50%', transform: 'translateX(-50%)' },
    { position: 'top-right', cursor: 'ne-resize', top: '-5px', right: '-5px' },
    { position: 'right', cursor: 'e-resize', top: '50%', right: '-5px', transform: 'translateY(-50%)' },
    { position: 'bottom-right', cursor: 'se-resize', bottom: '-5px', right: '-5px' },
    { position: 'bottom', cursor: 's-resize', bottom: '-5px', left: '50%', transform: 'translateX(-50%)' },
    { position: 'bottom-left', cursor: 'sw-resize', bottom: '-5px', left: '-5px' },
    { position: 'left', cursor: 'w-resize', top: '50%', left: '-5px', transform: 'translateY(-50%)' }
  ];

  function createResizeHandle(config: any): HTMLElement {
    const handle = document.createElement('div');
    handle.className = `image-resize-handle resize-${config.position}`;
    handle.dataset.direction = config.position;
    
    let styles = `
      position: absolute;
      width: 8px;
      height: 8px;
      background: #3b82f6;
      border: 2px solid white;
      border-radius: 2px;
      cursor: ${config.cursor};
      z-index: 1000;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      opacity: 0;
      transition: opacity 0.2s ease;
    `;

    // Add position styles
    if (config.top) styles += `top: ${config.top};`;
    if (config.bottom) styles += `bottom: ${config.bottom};`;
    if (config.left) styles += `left: ${config.left};`;
    if (config.right) styles += `right: ${config.right};`;
    if (config.transform) styles += `transform: ${config.transform};`;

    handle.style.cssText = styles;
    return handle;
  }

  function addResizeHandle(img: HTMLImageElement) {
    console.log('Adding resize handle to image:', img);
    if (img.parentElement?.querySelector('.image-resize-handle')) {
      console.log('Image already has resize handles');
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'image-wrapper';
    wrapper.style.cssText = `
      position: relative;
      display: inline-block;
      margin: 1rem 0;
      max-width: 100%;
    `;

    img.parentNode?.insertBefore(wrapper, img);
    wrapper.appendChild(img);

    // Set initial image size
    img.style.width = img.style.width || `${Math.min(img.naturalWidth, 600)}px`;
    img.style.height = 'auto';
    aspectRatio = img.naturalHeight / img.naturalWidth;

    console.log('Creating resize handles, count:', handlePositions.length);
    // Create all 8 resize handles
    handlePositions.forEach(config => {
      const handle = createResizeHandle(config);
      wrapper.appendChild(handle);
      console.log('Added handle:', config.position);

      handle.addEventListener('mousedown', (e) => {
        console.log('Handle mousedown:', config.position);
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        currentImage = img;
        resizeDirection = config.position;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = img.offsetWidth;
        startHeight = img.offsetHeight;
        aspectRatio = startHeight / startWidth;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none';
      });
    });
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isResizing || !currentImage) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    let newWidth = startWidth;
    let newHeight = startHeight;

    switch (resizeDirection) {
      case 'top-left':
        newWidth = Math.max(100, Math.min(800, startWidth - deltaX));
        newHeight = newWidth * aspectRatio;
        break;
      case 'top':
        newHeight = Math.max(100 * aspectRatio, Math.min(800 * aspectRatio, startHeight - deltaY));
        newWidth = newHeight / aspectRatio;
        break;
      case 'top-right':
        newWidth = Math.max(100, Math.min(800, startWidth + deltaX));
        newHeight = newWidth * aspectRatio;
        break;
      case 'right':
        newWidth = Math.max(100, Math.min(800, startWidth + deltaX));
        newHeight = newWidth * aspectRatio;
        break;
      case 'bottom-right':
        newWidth = Math.max(100, Math.min(800, startWidth + deltaX));
        newHeight = newWidth * aspectRatio;
        break;
      case 'bottom':
        newHeight = Math.max(100 * aspectRatio, Math.min(800 * aspectRatio, startHeight + deltaY));
        newWidth = newHeight / aspectRatio;
        break;
      case 'bottom-left':
        newWidth = Math.max(100, Math.min(800, startWidth - deltaX));
        newHeight = newWidth * aspectRatio;
        break;
      case 'left':
        newWidth = Math.max(100, Math.min(800, startWidth - deltaX));
        newHeight = newWidth * aspectRatio;
        break;
    }

    currentImage.style.width = `${newWidth}px`;
    currentImage.style.height = `${newHeight}px`;
  }

  function handleMouseUp() {
    isResizing = false;
    currentImage = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = '';
  }

  function removeAllHandles() {
    document.querySelectorAll('.image-resize-handle').forEach(handle => {
      handle.remove();
    });
  }

  function handleImageClick(e: Event) {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    console.log('Image clicked:', target.tagName, target);
    if (target.tagName === 'IMG') {
      console.log('Processing image click');
      // Remove selection from other images
      document.querySelectorAll('.image-wrapper.selected').forEach(wrapper => {
        wrapper.classList.remove('selected');
      });
      
      removeAllHandles();
      addResizeHandle(target as HTMLImageElement);
      
      // Add selection state
      const wrapper = target.closest('.image-wrapper');
      if (wrapper) {
        wrapper.classList.add('selected');
        console.log('Added selected class to wrapper');
      }
    }
  }

  function handleDocumentClick(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.closest('.image-wrapper') && !target.classList.contains('image-resize-handle')) {
      removeAllHandles();
      // Remove selection state
      document.querySelectorAll('.image-wrapper.selected').forEach(wrapper => {
        wrapper.classList.remove('selected');
      });
    }
  }

  // Initialize event listeners with delegation
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' && target.closest('.prose-editor')) {
      handleImageClick(e);
    } else {
      handleDocumentClick(e);
    }
  });

  // Observer for new images in the editor
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const images = element.querySelectorAll('img');
          images.forEach((img) => {
            if (img.closest('.prose-editor')) {
              // Ensure image has proper styling
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              img.style.cursor = 'pointer';
            }
          });
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return {
    destroy: () => {
      observer.disconnect();
      removeAllHandles();
      document.querySelectorAll('.image-wrapper.selected').forEach(wrapper => {
        wrapper.classList.remove('selected');
      });
    }
  };
}