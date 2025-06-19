import { Editor } from '@tiptap/react';
import { EditorContent } from '@tiptap/react';

interface EditorAreaProps {
  editor: Editor | null;
}

export function EditorArea({ editor }: EditorAreaProps) {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="min-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 transition-all">
          <EditorContent 
            editor={editor} 
            className="prose-editor focus:outline-none min-h-full"
          />
        </div>
      </div>
    </div>
  );
}
