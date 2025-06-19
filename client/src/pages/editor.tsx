import { useEffect } from 'react';
import { Toolbar } from '@/components/editor/toolbar';
import { EditorArea } from '@/components/editor/editor-area';
import { StatusBar } from '@/components/editor/status-bar';
import { FindReplaceDialog } from '@/components/editor/find-replace-dialog';
import { MarkdownEditor } from '@/components/editor/markdown-editor';
import { useTheme } from '@/components/theme-provider';
import { useEditor } from '@/hooks/use-editor';
import { useDocument } from '@/hooks/use-document';
import { useMarkdown } from '@/hooks/use-markdown';
import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Editor() {
  const { theme, toggleTheme } = useTheme();
  const { document: currentDocument, updateContent, updateTitle, newDocument, openDocument, saveDocument, exportAsText } = useDocument();
  const { isMarkdownMode, toggleMarkdownMode, htmlToMarkdown, markdownToHtml } = useMarkdown();
  const { editor, stats, formatText, setContent, getContent, clearContent, undo, redo, canUndo, canRedo } = useEditor(
    currentDocument.content,
    updateContent
  );
  
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);

  // Update editor content when document changes
  useEffect(() => {
    if (editor && currentDocument.content !== getContent()) {
      setContent(currentDocument.content);
    }
  }, [currentDocument.content, editor, setContent, getContent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            newDocument();
            break;
          case 'o':
            e.preventDefault();
            openDocument();
            break;
          case 's':
            e.preventDefault();
            saveDocument();
            break;
          case 'f':
            e.preventDefault();
            setFindReplaceOpen(true);
            break;
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              redo();
            } else {
              e.preventDefault();
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'b':
            e.preventDefault();
            formatText('bold');
            break;
          case 'i':
            e.preventDefault();
            formatText('italic');
            break;
          case 'u':
            e.preventDefault();
            formatText('underline');
            break;
          case '1':
            e.preventDefault();
            formatText('heading-1');
            break;
          case '2':
            e.preventDefault();
            formatText('heading-2');
            break;
          case '3':
            e.preventDefault();
            formatText('heading-3');
            break;
        }
      }
      
      if (e.key === 'Escape') {
        setFindReplaceOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [newDocument, openDocument, saveDocument, undo, redo, formatText]);

  const handleToggleMarkdown = () => {
    if (editor) {
      if (isMarkdownMode) {
        // Converting from markdown to HTML
        const currentContent = getContent();
        const htmlContent = markdownToHtml(currentContent);
        setContent(htmlContent);
      } else {
        // Converting from HTML to markdown
        const htmlContent = getContent();
        const textContent = editor.getText();
        
        // If it's just plain text without formatting, use the text directly
        if (textContent.trim() === '') {
          setContent('');
        } else if (htmlContent === `<p>${textContent}</p>` || htmlContent.replace(/<[^>]*>/g, '') === textContent) {
          // Simple case: just plain text in paragraphs
          setContent(textContent);
        } else {
          // Complex case: try to convert HTML to markdown
          const markdownContent = htmlToMarkdown(htmlContent);
          setContent(markdownContent);
        }
      }
    }
    toggleMarkdownMode();
  };

  const handleExportMarkdown = () => {
    if (editor) {
      const currentContent = getContent();
      const markdownContent = isMarkdownMode 
        ? currentContent 
        : htmlToMarkdown(currentContent);
      
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentDocument.title}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">WordPad Pro</h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentDocument.title}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <div className={`w-2 h-2 rounded-full ${currentDocument.isSaving ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
              <span>{currentDocument.isSaving ? 'Saving...' : 'Auto-saved'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar
        editor={editor}
        formatText={formatText}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onNew={newDocument}
        onOpen={openDocument}
        onSave={saveDocument}
        onExport={exportAsText}
        onFindReplace={() => setFindReplaceOpen(true)}
        isMarkdownMode={isMarkdownMode}
        onToggleMarkdown={handleToggleMarkdown}
        onExportMarkdown={handleExportMarkdown}
      />

      {/* Editor Area */}
      {isMarkdownMode ? (
        <MarkdownEditor 
          content={getContent()} 
          onChange={updateContent}
          className="flex-1"
        />
      ) : (
        <EditorArea editor={editor} />
      )}

      {/* Status Bar */}
      <StatusBar
        stats={stats}
        documentStatus={currentDocument.isSaving ? 'Saving...' : currentDocument.isDirty ? 'Modified' : 'Saved'}
        lastSaved={currentDocument.lastSaved}
      />

      {/* Find Replace Dialog */}
      <FindReplaceDialog
        editor={editor}
        open={findReplaceOpen}
        onOpenChange={setFindReplaceOpen}
      />
    </div>
  );
}
