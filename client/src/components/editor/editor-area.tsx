import { Editor } from '@tiptap/react';
import { EditorContent } from '@tiptap/react';

interface EditorAreaProps {
  editor: Editor | null;
}

export function EditorArea({ editor }: EditorAreaProps) {
  return (
    <div className="flex-1 p-8">
      <EditorContent 
        editor={editor} 
        className="prose-editor focus:outline-none min-h-[600px]"
      />
    </div>
  );
}
