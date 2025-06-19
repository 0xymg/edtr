import { Editor } from '@tiptap/react';
import { EditorContent } from '@tiptap/react';
import { PDFMarginType, PDFMarginSettings } from '@/hooks/use-document';
import { useEffect, useRef, useState, useCallback } from 'react';

interface EditorAreaProps {
  editor: Editor | null;
  pdfMargins?: PDFMarginType;
  pdfMarginPresets?: Record<PDFMarginType, PDFMarginSettings>;
}

export function EditorArea({ editor, pdfMargins = 'normal', pdfMarginPresets }: EditorAreaProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  
  // Convert mm to pixels (approximate: 1mm ≈ 3.78px)
  const mmToPx = (mm: number) => mm * 3.78;
  
  const margins = pdfMarginPresets?.[pdfMargins] || { top: 8, right: 8, bottom: 8, left: 8 };
  
  // A4 dimensions in pixels (210mm x 297mm)
  const a4Height = mmToPx(297);
  const contentHeight = a4Height - mmToPx(margins.top) - mmToPx(margins.bottom);

  // Monitor content height and add pages automatically
  const checkContentHeight = useCallback(() => {
    if (!editor || !editorRef.current) return;

    const editorElement = editorRef.current.querySelector('.ProseMirror');
    if (!editorElement) return;

    const actualContentHeight = editorElement.scrollHeight;
    const requiredPages = Math.max(1, Math.ceil(actualContentHeight / contentHeight));
    
    if (requiredPages !== pageCount) {
      setPageCount(requiredPages);
    }
  }, [editor, contentHeight, pageCount]);

  // Set up content monitoring
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setTimeout(checkContentHeight, 100); // Delay to ensure DOM is updated
    };

    editor.on('update', handleUpdate);
    editor.on('transaction', handleUpdate);

    // Initial check
    setTimeout(checkContentHeight, 100);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [editor, checkContentHeight]);

  // Generate page elements
  const pages = Array.from({ length: pageCount }, (_, index) => (
    <div
      key={index}
      className={`page-container ${index === 0 ? 'first-page' : ''}`}
      style={{
        minHeight: `${a4Height}px`,
        marginTop: index === 0 ? '0' : `${mmToPx(margins.top)}px`,
        marginBottom: `${mmToPx(margins.bottom)}px`,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        position: 'relative'
      }}
    >
      {index > 0 && (
        <div className="page-number" style={{
          position: 'absolute',
          top: '10px',
          right: '20px',
          fontSize: '12px',
          color: '#9ca3af',
          backgroundColor: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #e5e7eb'
        }}>
          Page {index + 1}
        </div>
      )}
    </div>
  ));

  const paddingStyle = {
    paddingTop: `${mmToPx(margins.top)}px`,
    paddingRight: `${mmToPx(margins.right)}px`,
    paddingBottom: `${mmToPx(margins.bottom)}px`,
    paddingLeft: `${mmToPx(margins.left)}px`,
  };

  return (
    <div className="flex-1 p-8">
      <div ref={editorRef} className="relative">
        {/* Background pages */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {pages}
        </div>
        
        {/* Editor content */}
        <div className="relative z-10">
          <EditorContent 
            editor={editor} 
            className="prose-editor focus:outline-none"
            style={{
              ...paddingStyle,
              minHeight: `${pageCount * a4Height + (pageCount - 1) * (mmToPx(margins.top) + mmToPx(margins.bottom))}px`,
              backgroundColor: 'transparent'
            }}
          />
        </div>
      </div>
    </div>
  );
}
