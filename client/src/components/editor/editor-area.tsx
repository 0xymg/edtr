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

  const paddingStyle = {
    paddingTop: `${mmToPx(margins.top)}px`,
    paddingRight: `${mmToPx(margins.right)}px`,
    paddingBottom: `${mmToPx(margins.bottom)}px`,
    paddingLeft: `${mmToPx(margins.left)}px`,
  };

  // Add CSS for true text flow between pages
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'page-break-styles';
    
    const totalPageHeight = a4Height;
    const gapBetweenPages = mmToPx(margins.top) + mmToPx(margins.bottom);
    
    style.textContent = `
      .prose-editor {
        position: relative;
        overflow: visible;
      }
      
      .prose-editor .ProseMirror {
        /* Use CSS columns to create actual text flow between pages */
        column-count: ${pageCount};
        column-fill: auto;
        column-gap: ${gapBetweenPages}px;
        column-width: auto;
        
        /* Set fixed height to force column breaks at page boundaries */
        height: ${contentHeight}px;
        overflow: visible;
        
        /* Visual page break indicators */
        background: 
          repeating-linear-gradient(
            to right,
            transparent 0%,
            transparent calc(${100 / pageCount}% - 1px),
            rgba(220, 220, 220, 0.8) calc(${100 / pageCount}% - 1px),
            rgba(220, 220, 220, 0.8) calc(${100 / pageCount}% + 1px),
            transparent calc(${100 / pageCount}% + 1px),
            transparent ${100 / pageCount}%
          ),
          repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent ${contentHeight - 20}px,
            rgba(255, 165, 0, 0.2) ${contentHeight - 20}px,
            rgba(255, 0, 0, 0.4) ${contentHeight - 5}px,
            rgba(255, 0, 0, 0.6) ${contentHeight}px,
            transparent ${contentHeight}px
          );
      }
      
      /* Text flow controls */
      .prose-editor .ProseMirror p {
        break-inside: auto;
        column-break-inside: auto;
        margin-bottom: 1em;
        line-height: 1.6;
        orphans: 2;
        widows: 2;
      }
      
      .prose-editor .ProseMirror div {
        break-inside: auto;
        column-break-inside: auto;
      }
      
      /* Prevent headers from breaking awkwardly */
      .prose-editor .ProseMirror h1,
      .prose-editor .ProseMirror h2,
      .prose-editor .ProseMirror h3,
      .prose-editor .ProseMirror h4,
      .prose-editor .ProseMirror h5,
      .prose-editor .ProseMirror h6 {
        break-after: avoid;
        column-break-after: avoid;
        break-inside: avoid;
        column-break-inside: avoid;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
      }
      
      /* Lists and blocks */
      .prose-editor .ProseMirror ul,
      .prose-editor .ProseMirror ol,
      .prose-editor .ProseMirror blockquote {
        break-inside: avoid;
        column-break-inside: avoid;
      }
      
      /* Single page layout when only one page */
      ${pageCount === 1 ? `
        .prose-editor .ProseMirror {
          column-count: 1;
          height: auto;
          min-height: ${contentHeight}px;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent ${contentHeight - 20}px,
            rgba(255, 165, 0, 0.2) ${contentHeight - 20}px,
            rgba(255, 0, 0, 0.4) ${contentHeight - 5}px,
            rgba(255, 0, 0, 0.6) ${contentHeight}px,
            rgba(200, 200, 200, 0.8) ${contentHeight}px,
            transparent ${contentHeight + 20}px
          );
        }
      ` : ''}
      
      @media print {
        .prose-editor .ProseMirror {
          column-count: 1 !important;
          height: auto !important;
          background: none !important;
          column-gap: 0 !important;
        }
        
        .prose-editor .ProseMirror > * {
          page-break-inside: avoid;
        }
        
        .prose-editor .ProseMirror h1,
        .prose-editor .ProseMirror h2,
        .prose-editor .ProseMirror h3,
        .prose-editor .ProseMirror h4,
        .prose-editor .ProseMirror h5,
        .prose-editor .ProseMirror h6 {
          page-break-after: avoid;
        }
      }
    `;
    
    const existingStyle = document.getElementById('page-break-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
    
    return () => {
      const style = document.getElementById('page-break-styles');
      if (style) style.remove();
    };
  }, [a4Height, margins, pageCount, contentHeight]);

  return (
    <div className="flex-1 p-8">
      <div ref={editorRef} className="relative">
        <EditorContent 
          editor={editor} 
          className="prose-editor focus:outline-none"
          style={{
            ...paddingStyle,
            minHeight: `${pageCount * a4Height + (pageCount - 1) * (mmToPx(margins.top) + mmToPx(margins.bottom))}px`
          }}
        />
      </div>
    </div>
  );
}
