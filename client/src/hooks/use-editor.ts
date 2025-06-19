import { useEditor as useTipTapEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { useCallback, useEffect, useState } from 'react';

export interface EditorStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
}

export function useEditor(initialContent: string = '', onUpdate?: (content: string) => void) {
  const [stats, setStats] = useState<EditorStats>({
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    lines: 0
  });

  const editor = useTipTapEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      onUpdate?.(content);
      updateStats(editor);
    },
    onCreate: ({ editor }) => {
      updateStats(editor);
    },
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none',
      },
    },
  });

  const updateStats = useCallback((editor: Editor) => {
    const text = editor.getText();
    const html = editor.getHTML();
    
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const lines = text.split('\n').length;

    setStats({
      words,
      characters,
      charactersNoSpaces,
      lines
    });
  }, []);

  const formatText = useCallback((format: string, options?: any) => {
    if (!editor) return;

    switch (format) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'align-left':
        editor.chain().focus().setTextAlign('left').run();
        break;
      case 'align-center':
        editor.chain().focus().setTextAlign('center').run();
        break;
      case 'align-right':
        editor.chain().focus().setTextAlign('right').run();
        break;
      case 'color':
        editor.chain().focus().setColor(options.color).run();
        break;
      case 'font-family':
        editor.chain().focus().setFontFamily(options.fontFamily).run();
        break;
    }
  }, [editor]);

  const insertContent = useCallback((content: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(content).run();
  }, [editor]);

  const setContent = useCallback((content: string) => {
    if (!editor) return;
    editor.commands.setContent(content);
    updateStats(editor);
  }, [editor, updateStats]);

  const getContent = useCallback(() => {
    if (!editor) return '';
    return editor.getHTML();
  }, [editor]);

  const clearContent = useCallback(() => {
    if (!editor) return;
    editor.commands.clearContent();
    updateStats(editor);
  }, [editor, updateStats]);

  const undo = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().undo().run();
  }, [editor]);

  const redo = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().redo().run();
  }, [editor]);

  const canUndo = editor?.can().undo() ?? false;
  const canRedo = editor?.can().redo() ?? false;

  return {
    editor,
    stats,
    formatText,
    insertContent,
    setContent,
    getContent,
    clearContent,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
