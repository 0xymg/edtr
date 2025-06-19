import { useState, useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface FindReplacePanelProps {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FindReplacePanel({ editor, open, onOpenChange }: FindReplacePanelProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWords, setWholeWords] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const { toast } = useToast();

  // Clear highlights when panel closes
  useEffect(() => {
    if (!open && editor) {
      clearHighlights();
    }
  }, [open, editor]);

  const clearHighlights = useCallback(() => {
    if (!editor) return;
    
    // Remove any active selection highlighting
    const { selection } = editor.state;
    if (!selection.empty) {
      editor.commands.setTextSelection(selection.from);
    }
    
    // Remove the style element
    const styleEl = document.getElementById('find-highlight-style');
    if (styleEl) {
      styleEl.remove();
    }
  }, [editor]);

  const highlightMatches = useCallback((searchText: string) => {
    if (!editor || !searchText.trim()) {
      clearHighlights();
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      return;
    }

    const textContent = editor.getText();
    const searchFlags = matchCase ? 'g' : 'gi';
    const escapedText = searchText.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = wholeWords ? `\\b${escapedText}\\b` : escapedText;
    
    try {
      const regex = new RegExp(pattern, searchFlags);
      const matches = textContent.match(regex);
      
      if (matches && matches.length > 0) {
        setTotalMatches(matches.length);
        
        // Add visual feedback with CSS
        const styleEl = document.getElementById('find-highlight-style') || document.createElement('style');
        styleEl.id = 'find-highlight-style';
        styleEl.innerHTML = `
          .ProseMirror .selection {
            background-color: #eab308 !important;
          }
        `;
        if (!document.head.contains(styleEl)) {
          document.head.appendChild(styleEl);
        }
        
        // Find positions in the document
        let searchResults: { from: number; to: number }[] = [];
        const doc = editor.state.doc;
        
        doc.descendants((node, nodePos) => {
          if (node.isText && node.text) {
            const text = node.text;
            const nodeRegex = new RegExp(pattern, searchFlags);
            let match;
            
            while ((match = nodeRegex.exec(text)) !== null) {
              const startPos = nodePos + match.index;
              const endPos = startPos + match[0].length;
              searchResults.push({ from: startPos, to: endPos });
              
              if (!searchFlags.includes('g')) break;
            }
          }
        });
        
        // Select the current match
        if (searchResults[currentMatchIndex]) {
          const match = searchResults[currentMatchIndex];
          editor.commands.setTextSelection({ from: match.from, to: match.to });
          
          // Scroll to selection
          setTimeout(() => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              if (rect.top < 100 || rect.bottom > window.innerHeight - 100) {
                range.startContainer.parentElement?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center' 
                });
              }
            }
          }, 100);
        }
      } else {
        setTotalMatches(0);
        setCurrentMatchIndex(0);
        clearHighlights();
      }
    } catch (error) {
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      clearHighlights();
    }
  }, [editor, matchCase, wholeWords, currentMatchIndex, clearHighlights]);

  const findNext = useCallback(() => {
    if (!editor || !findText.trim()) return;

    if (totalMatches === 0) {
      highlightMatches(findText);
      return;
    }

    const nextIndex = (currentMatchIndex + 1) % totalMatches;
    setCurrentMatchIndex(nextIndex);
    highlightMatches(findText);
  }, [editor, findText, totalMatches, currentMatchIndex, highlightMatches]);

  const findPrevious = useCallback(() => {
    if (!editor || !findText.trim()) return;

    if (totalMatches === 0) {
      highlightMatches(findText);
      return;
    }

    const prevIndex = currentMatchIndex === 0 ? totalMatches - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    highlightMatches(findText);
  }, [editor, findText, totalMatches, currentMatchIndex, highlightMatches]);

  // Trigger search when find text changes
  useEffect(() => {
    if (findText.trim()) {
      setCurrentMatchIndex(0);
      highlightMatches(findText);
    } else {
      clearHighlights();
      setTotalMatches(0);
      setCurrentMatchIndex(0);
    }
  }, [findText, matchCase, wholeWords, highlightMatches, clearHighlights]);

  const replace = useCallback(() => {
    if (!editor || !findText.trim() || totalMatches === 0) return;

    const { selection } = editor.state;
    if (selection.empty) return;
    
    // Replace the selected text
    editor.commands.deleteSelection();
    editor.commands.insertContent(replaceText);
    
    // Update search after replacement
    setCurrentMatchIndex(0);
    setTimeout(() => {
      if (findText.trim()) {
        highlightMatches(findText);
      }
    }, 100);
    
    toast({
      title: "Replaced",
      description: `Replaced one occurrence of "${findText}"`,
    });
  }, [editor, findText, replaceText, totalMatches, highlightMatches, toast]);

  const replaceAll = useCallback(() => {
    if (!editor || !findText.trim() || totalMatches === 0) return;

    const textContent = editor.getText();
    const searchFlags = matchCase ? 'g' : 'gi';
    const escapedText = findText.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = wholeWords ? `\\b${escapedText}\\b` : escapedText;
    
    try {
      const regex = new RegExp(pattern, searchFlags);
      const matches = textContent.match(regex);
      
      if (matches && matches.length > 0) {
        // Use TipTap's command to replace all text content
        const newContent = textContent.replace(regex, replaceText);
        
        // Get current HTML and preserve formatting while replacing text
        const currentHTML = editor.getHTML();
        const updatedHTML = currentHTML.replace(
          new RegExp(escapedText, searchFlags),
          replaceText
        );
        
        editor.commands.setContent(updatedHTML);
        clearHighlights();
        setTotalMatches(0);
        setCurrentMatchIndex(0);
        
        toast({
          title: "Replaced All",
          description: `Replaced ${matches.length} occurrence(s) of "${findText}"`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid search pattern.",
        variant: "destructive",
      });
    }
  }, [editor, findText, replaceText, matchCase, wholeWords, totalMatches, clearHighlights, toast]);

  if (!open) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-lg">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Find & Replace</span>
          <div className="flex items-center space-x-2">
            {totalMatches > 0 && (
              <span className="text-sm text-muted-foreground">
                {currentMatchIndex + 1} of {totalMatches}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="find-input" className="text-xs">Find</Label>
            <div className="flex space-x-1">
              <Input
                id="find-input"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Enter text to find..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    findNext();
                  } else if (e.key === 'Escape') {
                    onOpenChange(false);
                  }
                }}
                className="flex-1 h-8"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={findPrevious}
                disabled={totalMatches === 0}
                className="h-8 px-2"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={findNext}
                disabled={totalMatches === 0}
                className="h-8 px-2"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="replace-input" className="text-xs">Replace with</Label>
            <Input
              id="replace-input"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Enter replacement text..."
              className="h-8"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="match-case"
                checked={matchCase}
                onCheckedChange={(checked) => setMatchCase(checked as boolean)}
              />
              <Label htmlFor="match-case" className="text-xs">Match case</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="whole-words"
                checked={wholeWords}
                onCheckedChange={(checked) => setWholeWords(checked as boolean)}
              />
              <Label htmlFor="whole-words" className="text-xs">Whole words</Label>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={replace} variant="secondary" size="sm" disabled={totalMatches === 0}>
              Replace
            </Button>
            <Button onClick={replaceAll} variant="secondary" size="sm" disabled={totalMatches === 0}>
              Replace All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}