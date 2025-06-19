import { Editor } from '@tiptap/react';
import { EditorContent } from '@tiptap/react';

interface EditorAreaProps {
  editor: Editor | null;
  margins?: number;
}

export function EditorArea({ editor, margins = 8 }: EditorAreaProps) {
  const marginPx = margins * 3.78; // Convert mm to px (approx)
  
  return (
    <div className="flex-1 p-8 bg-gray-100 dark:bg-gray-900">
      <div 
        className="min-h-[600px] shadow-lg rounded"
        style={{ 
          padding: `${marginPx}px`,
          maxWidth: '210mm', // A4 width
          margin: '0 auto',
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        <EditorContent 
          editor={editor} 
          className="prose-editor focus:outline-none"
        />
      </div>
    </div>
  );
}
