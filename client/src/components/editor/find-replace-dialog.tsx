import { useState, useCallback } from 'react';
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
  const { toast } = useToast();

  const findNext = useCallback(() => {
    if (!editor || !findText.trim()) return;

    const content = editor.getText();
    const searchFlags = matchCase ? 'g' : 'gi';
    const pattern = wholeWords ? `\\b${findText.trim()}\\b` : findText.trim();
    
    try {
      const regex = new RegExp(pattern, searchFlags);
      const matches = content.match(regex);
      
      if (matches && matches.length > 0) {
        // For simplicity, we'll just highlight the search term
        // In a full implementation, you'd navigate through matches
        toast({
          title: "Found",
          description: `Found ${matches.length} occurrence(s) of "${findText}"`,
        });
      } else {
        toast({
          title: "Not Found",
          description: `"${findText}" was not found.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid search pattern.",
        variant: "destructive",
      });
    }
  }, [editor, findText, matchCase, wholeWords, toast]);

  const replace = useCallback(() => {
    if (!editor || !findText.trim()) return;

    const content = editor.getHTML();
    const searchFlags = matchCase ? 'g' : 'gi';
    const pattern = wholeWords ? `\\b${findText.trim()}\\b` : findText.trim();
    
    try {
      const regex = new RegExp(pattern, searchFlags);
      const newContent = content.replace(regex, replaceText);
      
      if (newContent !== content) {
        editor.commands.setContent(newContent);
        toast({
          title: "Replaced",
          description: `Replaced "${findText}" with "${replaceText}"`,
        });
      } else {
        toast({
          title: "Not Found",
          description: `"${findText}" was not found.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid search pattern.",
        variant: "destructive",
      });
    }
  }, [editor, findText, replaceText, matchCase, wholeWords, toast]);

  const replaceAll = useCallback(() => {
    if (!editor || !findText.trim()) return;

    const content = editor.getHTML();
    const searchFlags = matchCase ? 'g' : 'gi';
    const pattern = wholeWords ? `\\b${findText.trim()}\\b` : findText.trim();
    
    try {
      const regex = new RegExp(pattern, searchFlags);
      const matches = content.match(regex);
      const newContent = content.replace(regex, replaceText);
      
      if (newContent !== content && matches) {
        editor.commands.setContent(newContent);
        toast({
          title: "Replaced All",
          description: `Replaced ${matches.length} occurrence(s) of "${findText}" with "${replaceText}"`,
        });
      } else {
        toast({
          title: "Not Found",
          description: `"${findText}" was not found.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid search pattern.",
        variant: "destructive",
      });
    }
  }, [editor, findText, replaceText, matchCase, wholeWords, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Find & Replace</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="find-input">Find</Label>
            <Input
              id="find-input"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Enter text to find..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  findNext();
                }
              }}
            />
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
            <Button onClick={findNext} className="flex-1">
              Find Next
            </Button>
            <Button onClick={replace} variant="secondary" className="flex-1">
              Replace
            </Button>
            <Button onClick={replaceAll} variant="secondary" className="flex-1">
              Replace All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
