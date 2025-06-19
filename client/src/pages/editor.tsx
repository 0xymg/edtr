import { useEffect } from 'react';
import { Toolbar } from '@/components/editor/toolbar';
import { EditorArea } from '@/components/editor/editor-area';
import { StatusBar } from '@/components/editor/status-bar';

import { useTheme } from '@/components/theme-provider';
import { useEditor } from '@/hooks/use-editor';
import { useDocument } from '@/hooks/use-document';
import { useState } from 'react';
import { Moon, Sun, Check, X, Download, Upload, ChevronDown, FileText, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SettingsDialog } from '@/components/settings-dialog';

export default function Editor() {
  const { theme, toggleTheme } = useTheme();
  const { document: currentDocument, updateContent, updateTitle, newDocument, openDocument, saveDocument, exportAsText, exportAsHTML, exportAsMarkdown, importFromMarkdown, exportAsPDF, exportAsDocx, pdfMargins, setPdfMargins, pdfMarginPresets } = useDocument();
  const { editor, stats, formatText, setContent, getContent, clearContent, undo, redo, canUndo, canRedo } = useEditor(
    currentDocument.content,
    updateContent
  );
  

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
      

    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [newDocument, openDocument, saveDocument, undo, redo, formatText]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Main Content Container */}
      <div className="flex-1 flex flex-col" style={{ paddingTop: '25px' }}>
        <div className="max-w-[1200px] mx-auto w-full flex-1 flex flex-col px-4">
          
          {/* Header Content - Now inside wrapper */}
          <div className="flex items-center justify-between py-3 mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-md font-bold text-lg cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                EDTR.
              </div>
              
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" title="Import/Export Document">
                    <Download className="w-4 h-4 mr-2" />
                    File
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={importFromMarkdown}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Markdown
                  </DropdownMenuItem>
                  <hr className="my-1" />
                  <DropdownMenuItem onClick={exportAsText}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportAsHTML}>
                    <FileIcon className="w-4 h-4 mr-2" />
                    Export as HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportAsMarkdown}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportAsPDF()}>
                    <FileIcon className="w-4 h-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportAsDocx}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as DOCX
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
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
              
              <SettingsDialog 
                pdfMargins={pdfMargins}
                setPdfMargins={setPdfMargins}
                pdfMarginPresets={pdfMarginPresets}
              />
            </div>
          </div>
          
          {/* Integrated Editor Container */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden -mx-4">
            {/* Toolbar - Integrated top section */}
            <div className="border-b border-gray-200 dark:border-gray-700">
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

              />
            </div>

            {/* Editor Area - Integrated main section */}
            <EditorArea 
              editor={editor} 
              pdfMargins={pdfMargins}
              pdfMarginPresets={pdfMarginPresets}
            />
          </div>
          
          {/* Tips Section */}
          <div className="w-full py-3 -mx-4 px-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-6 gap-y-1 justify-center">
              <span>💡 <strong>Tip:</strong> Use Ctrl+1, Ctrl+2, Ctrl+3 for headings</span>
              <span>⚡ <strong>Auto-save:</strong> Changes saved every 2 seconds</span>
              <span>🔍 <strong>Find:</strong> Press Ctrl+F to search and replace</span>
              <span>📁 <strong>Export:</strong> PDF, DOCX, and text formats available</span>
            </div>
          </div>
          
          {/* Advertisement Section */}
          <div className="w-full py-4">
            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">Advertisement</div>
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-8 min-h-[100px] flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  Google Ad Space
                  <div className="text-xs mt-1 opacity-60">728x90 Banner</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ marginTop: '25px' }}>
        <StatusBar
          stats={stats}
          documentStatus={currentDocument.isSaving ? 'Saving...' : currentDocument.isDirty ? 'Modified' : 'Saved'}
          lastSaved={currentDocument.lastSaved}
        />
      </div>


    </div>
  );
}
