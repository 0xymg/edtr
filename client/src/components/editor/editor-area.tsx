import { Editor } from '@tiptap/react';
import { EditorContent } from '@tiptap/react';
import { PDFMarginType, PDFMarginSettings } from '@/hooks/use-document';
import { ImageResizeHandler } from './image-resize-handler';
import { useRef, useState, useCallback } from 'react';

interface EditorAreaProps {
  editor: Editor | null;
  pdfMargins?: PDFMarginType;
  pdfMarginPresets?: Record<PDFMarginType, PDFMarginSettings>;
}

export function EditorArea({ editor, pdfMargins = 'normal', pdfMarginPresets }: EditorAreaProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Convert mm to pixels (approximate: 1mm ≈ 3.78px)
  const mmToPx = (mm: number) => mm * 3.78;
  
  const margins = pdfMarginPresets?.[pdfMargins] || { top: 8, right: 8, bottom: 8, left: 8 };
  const paddingStyle = {
    paddingTop: `${mmToPx(margins.top)}px`,
    paddingRight: `${mmToPx(margins.right)}px`,
    paddingBottom: `${mmToPx(margins.bottom)}px`,
    paddingLeft: `${mmToPx(margins.left)}px`,
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0 && editor) {
      imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const src = event.target?.result as string;
          if (src) {
            editor.chain().focus().setImage({ src, alt: file.name, title: file.name }).run();
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }, [editor]);

  return (
    <div className="flex-1 p-8">
      <div 
        ref={editorRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative ${isDragOver ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20' : ''}`}
      >
        <EditorContent 
          editor={editor} 
          className="prose-editor focus:outline-none min-h-[600px]"
          style={paddingStyle}
        />
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-100/80 dark:bg-blue-900/40 rounded-lg border-2 border-dashed border-blue-400">
            <div className="text-center">
              <div className="text-2xl mb-2">📁</div>
              <p className="text-blue-700 dark:text-blue-300 font-medium">Drop images here to add them to your document</p>
            </div>
          </div>
        )}
      </div>
      <ImageResizeHandler editorRef={editorRef} />
    </div>
  );
}
