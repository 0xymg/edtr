import { Editor } from '@tiptap/react';
import { EditorContent } from '@tiptap/react';
import { PDFMarginType, PDFMarginSettings } from '@/hooks/use-document';

interface EditorAreaProps {
  editor: Editor | null;
  pdfMargins?: PDFMarginType;
  pdfMarginPresets?: Record<PDFMarginType, PDFMarginSettings>;
}

export function EditorArea({ editor, pdfMargins = 'normal', pdfMarginPresets }: EditorAreaProps) {
  // Convert mm to pixels (approximate: 1mm ≈ 3.78px)
  const mmToPx = (mm: number) => mm * 3.78;
  
  // A4 dimensions: 210mm x 297mm
  const a4Width = mmToPx(210);
  const a4Height = mmToPx(297);
  
  const margins = pdfMarginPresets?.[pdfMargins] || { top: 8, right: 8, bottom: 8, left: 8 };
  const paddingStyle = {
    paddingTop: `${mmToPx(margins.top)}px`,
    paddingRight: `${mmToPx(margins.right)}px`,
    paddingBottom: `${mmToPx(margins.bottom)}px`,
    paddingLeft: `${mmToPx(margins.left)}px`,
  };

  return (
    <div className="flex-1 flex justify-center py-8">
      <div 
        className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
        style={{ 
          width: `${a4Width}px`, 
          minHeight: `${a4Height}px`,
          maxWidth: '100%'
        }}
      >
        <EditorContent 
          editor={editor} 
          className="prose-editor focus:outline-none w-full h-full"
          style={paddingStyle}
        />
      </div>
    </div>
  );
}
