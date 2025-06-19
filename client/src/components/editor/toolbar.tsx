import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  FolderOpen,
  Save,
  Download,
  FileText,
  File,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Search,
  Type,
  ChevronDown,
  Minus,
  Image,
} from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ToolbarProps {
  editor: Editor | null;
  formatText: (format: string, options?: any) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onExportPDF: () => Promise<void>;
  onExportDocx: () => Promise<void>;

}

const fontFamilies = [
  'Inter',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
];

const fontSizes = ['12', '14', '16', '18', '20', '24', '28', '32'];

const colors = [
  '#000000', '#1f2937', '#374151', '#6b7280',
  '#dc2626', '#ea580c', '#d97706', '#ca8a04',
  '#65a30d', '#16a34a', '#059669', '#0d9488',
  '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

export function Toolbar({
  editor,
  formatText,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNew,
  onOpen,
  onSave,
  onExport,
  onExportPDF,
  onExportDocx,
}: ToolbarProps) {
  const [selectedColor, setSelectedColor] = useState('#000000');

  if (!editor) {
    return null;
  }

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    formatText('color', { color });
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-center space-x-1 flex-wrap gap-y-2">
          
          {/* File Operations */}
          <div className="flex items-center space-x-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" title="File Operations">
                  <File className="w-4 h-4 mr-1" />
                  File
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Document
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpen}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Open Document
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Undo/Redo */}
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onUndo} 
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRedo} 
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Font Controls */}
          <div className="flex items-center space-x-2">
            <Select
              value={editor.getAttributes('textStyle').fontFamily || 'Inter'}
              onValueChange={(value) => formatText('font-family', { fontFamily: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select defaultValue="16">
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Formatting */}
          <div className="flex items-center space-x-1">
            <Button
              variant={editor.isActive('bold') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => formatText('bold')}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('italic') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => formatText('italic')}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive('underline') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => formatText('underline')}
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Heading Styles */}
          <div className="flex items-center space-x-1">
            <Button
              variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => formatText('heading-1')}
              title="Heading 1"
            >
              <Type className="w-4 h-4" />
              <span className="text-xs ml-1">H1</span>
            </Button>
            <Button
              variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => formatText('heading-2')}
              title="Heading 2"
            >
              <Type className="w-4 h-4" />
              <span className="text-xs ml-1">H2</span>
            </Button>
            <Button
              variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => formatText('heading-3')}
              title="Heading 3"
            >
              <Type className="w-4 h-4" />
              <span className="text-xs ml-1">H3</span>
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Horizontal Line */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => formatText('horizontalRule')}
              title="Insert Horizontal Line"
            >
              <Minus className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Color */}
          <div className="flex items-center space-x-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" title="Text Color">
                  <Palette className="w-4 h-4" />
                  <div 
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 rounded"
                    style={{ backgroundColor: selectedColor }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="grid grid-cols-8 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Alignment */}
          <div className="flex items-center space-x-1">
            <Button
              variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => formatText('align-left')}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => formatText('align-center')}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => formatText('align-right')}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Image Upload */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file && editor) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const src = event.target?.result as string;
                      if (src) {
                        editor.chain().focus().setImage({ src }).run();
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              title="Insert Image"
            >
              <Image className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />


        </div>
      </div>
  );
}
