export function enableImageResize() {
  let isResizing = false;
  let currentImage: HTMLImageElement | null = null;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;

  function createResizeHandle(): HTMLElement {
    const handle = document.createElement('div');
    handle.className = 'image-resize-handle';
    handle.style.cssText = `
      position: absolute;
      bottom: -5px;
      right: -5px;
      width: 12px;
      height: 12px;
      background: #3b82f6;
      border: 2px solid white;
      border-radius: 50%;
      cursor: nw-resize;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    return handle;
  }

  function addResizeHandle(img: HTMLImageElement) {
    if (img.parentElement?.querySelector('.image-resize-handle')) return;

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

    const handle = createResizeHandle();
    wrapper.appendChild(handle);

    img.style.width = img.style.width || `${img.naturalWidth}px`;
    img.style.height = 'auto';

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      currentImage = img;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = img.offsetWidth;
      startHeight = img.offsetHeight;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    });
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isResizing || !currentImage) return;

    const deltaX = e.clientX - startX;
    const aspectRatio = startHeight / startWidth;
    const newWidth = Math.max(100, Math.min(800, startWidth + deltaX));
    const newHeight = newWidth * aspectRatio;

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
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' && target.classList.contains('editor-image')) {
      removeAllHandles();
      addResizeHandle(target as HTMLImageElement);
    }
  }

  function handleDocumentClick(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.closest('.image-wrapper') && !target.classList.contains('editor-image')) {
      removeAllHandles();
    }
  }

  // Initialize event listeners
  document.addEventListener('click', handleImageClick);
  document.addEventListener('click', handleDocumentClick);

  // Observer for new images
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const images = element.querySelectorAll('img.editor-image');
          images.forEach((img) => {
            img.addEventListener('click', handleImageClick);
          });
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return {
    destroy: () => {
      document.removeEventListener('click', handleImageClick);
      document.removeEventListener('click', handleDocumentClick);
      observer.disconnect();
      removeAllHandles();
    }
  };
}