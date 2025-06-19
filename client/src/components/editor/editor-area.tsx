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
  
  const margins = pdfMarginPresets?.[pdfMargins] || { top: 8, right: 8, bottom: 8, left: 8 };
  const paddingStyle = {
    paddingTop: `${mmToPx(margins.top)}px`,
    paddingRight: `${mmToPx(margins.right)}px`,
    paddingBottom: `${mmToPx(margins.bottom)}px`,
    paddingLeft: `${mmToPx(margins.left)}px`,
  };

  // A4 aspect ratio: 210mm × 297mm (1:1.414)
  // Calculate height based on current width to maintain A4 proportions
  const a4AspectRatio = 297 / 210; // height/width ratio
  
  return (
    <div className="flex-1 p-8 flex justify-center">
      <div 
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
        style={{
          width: '100%',
          maxWidth: '800px',
          aspectRatio: `1 / ${a4AspectRatio}`,
          minHeight: '600px'
        }}
      >
        <EditorContent 
          editor={editor} 
          className="prose-editor focus:outline-none h-full"
          style={paddingStyle}
        />
      </div>
    </div>
  );
}
