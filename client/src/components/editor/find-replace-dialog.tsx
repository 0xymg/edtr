import { useState, useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface FindReplaceDialogProps {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FindReplaceDialog({ editor, open, onOpenChange }: FindReplaceDialogProps) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWords, setWholeWords] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const { toast } = useToast();

  // Clear highlights when dialog closes
  useEffect(() => {
    if (!open && editor) {
      clearHighlights();
    }
  }, [open, editor]);

  const clearHighlights = useCallback(() => {
    if (!editor) return;
    
    const content = editor.getHTML();
    const cleanContent = content.replace(/<mark[^>]*>/g, '').replace(/<\/mark>/g, '');
    if (cleanContent !== content) {
      editor.commands.setContent(cleanContent);
    }
  }, [editor]);

  const highlightMatches = useCallback((searchText: string) => {
    if (!editor || !searchText.trim()) {
      clearHighlights();
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      return;
    }

    const content = editor.getHTML();
    const searchFlags = matchCase ? 'g' : 'gi';
    const pattern = wholeWords ? `\\b${searchText.trim()}\\b` : searchText.trim();
    
    try {
      const regex = new RegExp(pattern, searchFlags);
      const matches: RegExpExecArray[] = [];
      let match;
      
      // Collect all matches
      while ((match = regex.exec(content)) !== null) {
        matches.push(match);
        if (!searchFlags.includes('g')) break;
      }
      
      if (matches.length > 0) {
        // Replace matches with highlighted version (reverse order to maintain indices)
        let highlightedContent = content;
        
        for (let i = matches.length - 1; i >= 0; i--) {
          const match = matches[i];
          const start = match.index!;
          const end = start + match[0].length;
          const highlightClass = i === currentMatchIndex ? 'bg-yellow-400 text-black' : 'bg-yellow-200 text-black';
          const replacement = `<mark class="${highlightClass}">${match[0]}</mark>`;
          
          highlightedContent = highlightedContent.slice(0, start) + replacement + highlightedContent.slice(end);
        }
        
        editor.commands.setContent(highlightedContent);
        setTotalMatches(matches.length);
        
        // Scroll to current match
        setTimeout(() => {
          const markElements = document.querySelectorAll('mark');
          if (markElements[currentMatchIndex]) {
            markElements[currentMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        clearHighlights();
        setTotalMatches(0);
        setCurrentMatchIndex(0);
      }
    } catch (error) {
      clearHighlights();
      setTotalMatches(0);
      setCurrentMatchIndex(0);
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

    // First clear highlights to get clean content
    const content = editor.getHTML();
    const cleanContent = content.replace(/<mark[^>]*>/g, '').replace(/<\/mark>/g, '');
    
    const searchFlags = matchCase ? '' : 'i'; // Remove 'g' flag for single replacement
    const pattern = wholeWords ? `\\b${findText.trim()}\\b` : findText.trim();
    
    try {
      const regex = new RegExp(pattern, searchFlags);
      const newContent = cleanContent.replace(regex, replaceText);
      
      if (newContent !== cleanContent) {
        editor.commands.setContent(newContent);
        // Reset search after replacement
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
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid search pattern.",
        variant: "destructive",
      });
    }
  }, [editor, findText, replaceText, matchCase, wholeWords, totalMatches, highlightMatches, toast]);

  const replaceAll = useCallback(() => {
    if (!editor || !findText.trim() || totalMatches === 0) return;

    // Clear highlights to get clean content
    const content = editor.getHTML();
    const cleanContent = content.replace(/<mark[^>]*>/g, '').replace(/<\/mark>/g, '');
    
    const searchFlags = matchCase ? 'g' : 'gi';
    const pattern = wholeWords ? `\\b${findText.trim()}\\b` : findText.trim();
    
    try {
      const regex = new RegExp(pattern, searchFlags);
      const matches = cleanContent.match(regex);
      const newContent = cleanContent.replace(regex, replaceText);
      
      if (newContent !== cleanContent && matches) {
        editor.commands.setContent(newContent);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Find & Replace</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="find-input">Find</Label>
              {totalMatches > 0 && (
                <span className="text-sm text-muted-foreground">
                  {currentMatchIndex + 1} of {totalMatches}
                </span>
              )}
            </div>
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
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={findPrevious}
                disabled={totalMatches === 0}
              >
                ↑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={findNext}
                disabled={totalMatches === 0}
              >
                ↓
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="replace-input">Replace with</Label>
            <Input
              id="replace-input"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Enter replacement text..."
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="match-case"
                checked={matchCase}
                onCheckedChange={(checked) => setMatchCase(checked as boolean)}
              />
              <Label htmlFor="match-case">Match case</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="whole-words"
                checked={wholeWords}
                onCheckedChange={(checked) => setWholeWords(checked as boolean)}
              />
              <Label htmlFor="whole-words">Whole words</Label>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button onClick={replace} variant="secondary" disabled={totalMatches === 0}>
              Replace
            </Button>
            <Button onClick={replaceAll} variant="secondary" disabled={totalMatches === 0}>
              Replace All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
