import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface DocumentState {
  title: string;
  content: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
}

export function useDocument() {
  const { toast } = useToast();
  const [document, setDocument] = useState<DocumentState>({
    title: 'Untitled Document',
    content: '',
    isDirty: false,
    isSaving: false,
    lastSaved: null,
  });

  // Auto-save functionality
  useEffect(() => {
    if (!document.isDirty) return;

    const timer = setTimeout(() => {
      autoSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [document.content, document.isDirty]);

  const autoSave = useCallback(async () => {
    if (!document.isDirty) return;

    setDocument(prev => ({ ...prev, isSaving: true }));

    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real app, this would save to backend
    localStorage.setItem('current-document', JSON.stringify({
      title: document.title,
      content: document.content,
    }));

    setDocument(prev => ({
      ...prev,
      isDirty: false,
      isSaving: false,
      lastSaved: new Date(),
    }));
  }, [document.content, document.title, document.isDirty]);

  const updateContent = useCallback((content: string) => {
    setDocument(prev => ({
      ...prev,
      content,
      isDirty: content !== prev.content,
    }));
  }, []);

  const updateTitle = useCallback((title: string) => {
    setDocument(prev => ({
      ...prev,
      title,
      isDirty: true,
    }));
  }, []);

  const newDocument = useCallback(() => {
    if (document.isDirty) {
      const shouldContinue = confirm('You have unsaved changes. Are you sure you want to create a new document?');
      if (!shouldContinue) return;
    }

    setDocument({
      title: 'Untitled Document',
      content: '',
      isDirty: false,
      isSaving: false,
      lastSaved: null,
    });
    
    toast({
      title: "New Document",
      description: "Created a new document.",
    });
  }, [document.isDirty, toast]);

  const openDocument = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.txt';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        setDocument({
          title: file.name.replace(/\.[^/.]+$/, ''),
          content,
          isDirty: false,
          isSaving: false,
          lastSaved: new Date(file.lastModified),
        });
        
        toast({
          title: "Document Opened",
          description: `Opened ${file.name}`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to open document.",
          variant: "destructive",
        });
      }
    };
    
    input.click();
  }, [toast]);

  const saveDocument = useCallback(() => {
    const blob = new Blob([document.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.title}.html`;
    a.click();
    URL.revokeObjectURL(url);

    setDocument(prev => ({
      ...prev,
      isDirty: false,
      lastSaved: new Date(),
    }));

    toast({
      title: "Document Saved",
      description: `Saved as ${document.title}.html`,
    });
  }, [document.content, document.title, toast]);

  const exportAsText = useCallback(() => {
    // Create a temporary div to extract plain text from HTML
    const div = document.createElement('div');
    div.innerHTML = document.content;
    const plainText = div.textContent || div.innerText || '';
    
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Document Exported",
      description: `Exported as ${document.title}.txt`,
    });
  }, [document.content, document.title, toast]);

  // Load document from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('current-document');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDocument(prev => ({
          ...prev,
          title: parsed.title || 'Untitled Document',
          content: parsed.content || '',
          isDirty: false,
        }));
      } catch (error) {
        console.error('Failed to load saved document:', error);
      }
    }
  }, []);

  return {
    document,
    updateContent,
    updateTitle,
    newDocument,
    openDocument,
    saveDocument,
    exportAsText,
    autoSave,
  };
}
