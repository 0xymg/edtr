import { Editor } from '@tiptap/react';
import { EditorContent } from '@tiptap/react';
import { PDFMarginType, PDFMarginSettings } from '@/hooks/use-document';
import { useEffect, useRef } from 'react';

interface EditorAreaProps {
  editor: Editor | null;
  pdfMargins?: PDFMarginType;
  pdfMarginPresets?: Record<PDFMarginType, PDFMarginSettings>;
}

export function EditorArea({ editor, pdfMargins = 'normal', pdfMarginPresets }: EditorAreaProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Convert mm to pixels (approximate: 1mm ≈ 3.78px)
  const mmToPx = (mm: number) => mm * 3.78;
  
  const margins = pdfMarginPresets?.[pdfMargins] || { top: 8, right: 8, bottom: 8, left: 8 };
  
  // A4 dimensions in pixels (210mm x 297mm)
  const a4Width = mmToPx(210);
  const a4Height = mmToPx(297);
  const contentHeight = a4Height - mmToPx(margins.top) - mmToPx(margins.bottom);

  const paddingStyle = {
    paddingTop: `${mmToPx(margins.top)}px`,
    paddingRight: `${mmToPx(margins.right)}px`,
    paddingBottom: `${mmToPx(margins.bottom)}px`,
    paddingLeft: `${mmToPx(margins.left)}px`,
  };

  // Add page break styling
  useEffect(() => {
    if (!editor || !editorRef.current) return;

    const addPageBreakStyles = () => {
      const style = document.createElement('style');
      style.textContent = `
        .prose-editor {
          background-image: 
            linear-gradient(to bottom, 
              transparent ${contentHeight - 40}px, 
              rgba(200, 200, 200, 0.3) ${contentHeight - 20}px, 
              rgba(200, 200, 200, 0.5) ${contentHeight}px,
              transparent ${contentHeight + 20}px
            );
          background-size: 100% ${contentHeight + mmToPx(margins.top) + mmToPx(margins.bottom)}px;
          background-repeat: repeat-y;
        }
        
        .prose-editor .ProseMirror {
          min-height: ${contentHeight}px;
        }
        
        .page-indicator {
          position: relative;
          margin: ${mmToPx(margins.bottom)}px 0 ${mmToPx(margins.top)}px 0;
          height: 1px;
          background: linear-gradient(to right, transparent, #ddd 20%, #ddd 80%, transparent);
        }
        
        .page-indicator::after {
          content: "Page Break";
          position: absolute;
          left: 50%;
          top: -10px;
          transform: translateX(-50%);
          background: white;
          padding: 0 10px;
          font-size: 12px;
          color: #999;
          white-space: nowrap;
        }
        
        @media print {
          .prose-editor {
            page-break-inside: avoid;
          }
          
          .page-indicator {
            page-break-before: always;
            visibility: hidden;
          }
        }
      `;
      
      const existingStyle = document.getElementById('a4-page-style');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      style.id = 'a4-page-style';
      document.head.appendChild(style);
    };

    addPageBreakStyles();

    return () => {
      const style = document.getElementById('a4-page-style');
      if (style) style.remove();
    };
  }, [editor, contentHeight, margins]);

  return (
    <div className="flex-1 p-8">
      <div ref={editorRef}>
        <EditorContent 
          editor={editor} 
          className="prose-editor focus:outline-none"
          style={{
            ...paddingStyle,
            minHeight: `${contentHeight}px`
          }}
        />
      </div>
    </div>
  );
}
