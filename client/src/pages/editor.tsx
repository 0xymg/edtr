import { useEffect } from 'react';
import { Toolbar } from '@/components/editor/toolbar';
import { EditorArea } from '@/components/editor/editor-area';
import { StatusBar } from '@/components/editor/status-bar';
import { FindReplaceDialog } from '@/components/editor/find-replace-dialog';
import { useTheme } from '@/components/theme-provider';
import { useEditor } from '@/hooks/use-editor';
import { useDocument } from '@/hooks/use-document';
import { useState } from 'react';
import { Moon, Sun, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Editor() {
  const { theme, toggleTheme } = useTheme();
  const { document: currentDocument, updateContent, updateTitle, newDocument, openDocument, saveDocument, exportAsText, exportAsPDF, exportAsDocx } = useDocument();
  const { editor, stats, formatText, setContent, getContent, clearContent, undo, redo, canUndo, canRedo } = useEditor(
    currentDocument.content,
    updateContent
  );
  
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');

  const startEditingTitle = () => {
    setEditingTitle(currentDocument.title);
    setIsEditingTitle(true);
  };

  const saveTitle = () => {
    if (editingTitle.trim()) {
      updateTitle(editingTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      cancelEditingTitle();
    }
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">WordPad Pro</h1>
            
            {isEditingTitle ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={handleTitleKeyPress}
                  className="text-sm w-48"
                  placeholder="Document name"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={saveTitle}
                  className="p-1 h-6 w-6"
                >
                  <Check className="w-3 h-3 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEditingTitle}
                  className="p-1 h-6 w-6"
                >
                  <X className="w-3 h-3 text-red-600" />
                </Button>
              </div>
            ) : (
              <span 
                className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 hover:underline"
                onClick={startEditingTitle}
                title="Click to rename document"
              >
                {currentDocument.title}
              </span>
            )}
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

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col">
        <div className="max-w-[1200px] mx-auto w-full flex-1 flex flex-col bg-white dark:bg-gray-800">
          
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
            onExportPDF={exportAsPDF}
            onExportDocx={exportAsDocx}
            onFindReplace={() => setFindReplaceOpen(true)}
          />

          {/* Editor Area */}
          <EditorArea editor={editor} />
        </div>
      </div>

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
