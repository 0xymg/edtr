import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export interface DocumentState {
  title: string;
  content: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
}

export function useDocument() {
  const { toast } = useToast();
  const [documentState, setDocumentState] = useState<DocumentState>({
    title: 'Untitled Document',
    content: '',
    isDirty: false,
    isSaving: false,
    lastSaved: null,
  });

  // Auto-save functionality
  useEffect(() => {
    if (!documentState.isDirty) return;

    const timer = setTimeout(() => {
      autoSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [documentState.content, documentState.isDirty]);

  const autoSave = useCallback(async () => {
    if (!documentState.isDirty) return;

    setDocumentState(prev => ({ ...prev, isSaving: true }));

    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real app, this would save to backend
    localStorage.setItem('current-document', JSON.stringify({
      title: documentState.title,
      content: documentState.content,
    }));

    setDocumentState(prev => ({
      ...prev,
      isDirty: false,
      isSaving: false,
      lastSaved: new Date(),
    }));
  }, [documentState.content, documentState.title, documentState.isDirty]);

  const updateContent = useCallback((content: string) => {
    setDocumentState(prev => ({
      ...prev,
      content,
      isDirty: content !== prev.content,
    }));
  }, []);

  const updateTitle = useCallback((title: string) => {
    setDocumentState(prev => ({
      ...prev,
      title,
      isDirty: true,
    }));
  }, []);

  const newDocument = useCallback(() => {
    if (documentState.isDirty) {
      const shouldContinue = confirm('You have unsaved changes. Are you sure you want to create a new document?');
      if (!shouldContinue) return;
    }

    setDocumentState({
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
  }, [documentState.isDirty, toast]);

  const openDocument = useCallback(() => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.txt';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        setDocumentState({
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
    const blob = new Blob([documentState.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${documentState.title}.html`;
    a.click();
    URL.revokeObjectURL(url);

    setDocumentState(prev => ({
      ...prev,
      isDirty: false,
      lastSaved: new Date(),
    }));

    toast({
      title: "Document Saved",
      description: `Saved as ${documentState.title}.html`,
    });
  }, [documentState.content, documentState.title, toast]);

  const exportAsText = useCallback(() => {
    // Create a temporary div to extract plain text from HTML
    const div = window.document.createElement('div');
    div.innerHTML = documentState.content;
    const plainText = div.textContent || div.innerText || '';
    
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${documentState.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Document Exported",
      description: `Exported as ${documentState.title}.txt`,
    });
  }, [documentState.content, documentState.title, toast]);

  const exportAsPDF = useCallback(async () => {
    try {
      // Create a temporary div with the content for rendering
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = documentState.content;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      tempDiv.style.fontSize = '16px';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.color = '#000000';
      tempDiv.style.backgroundColor = '#ffffff';
      
      // Apply specific styles to headings to ensure they're captured properly
      const h1Elements = tempDiv.querySelectorAll('h1');
      h1Elements.forEach((h1) => {
        const element = h1 as HTMLElement;
        element.style.fontSize = '36px';
        element.style.fontWeight = '700';
        element.style.margin = '32px 0 20px 0';
        element.style.color = '#000000';
        element.style.lineHeight = '1.2';
        element.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      });
      
      const h2Elements = tempDiv.querySelectorAll('h2');
      h2Elements.forEach((h2) => {
        const element = h2 as HTMLElement;
        element.style.fontSize = '28px';
        element.style.fontWeight = '600';
        element.style.margin = '28px 0 16px 0';
        element.style.color = '#000000';
        element.style.lineHeight = '1.3';
        element.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      });
      
      const h3Elements = tempDiv.querySelectorAll('h3');
      h3Elements.forEach((h3) => {
        const element = h3 as HTMLElement;
        element.style.fontSize = '22px';
        element.style.fontWeight = '600';
        element.style.margin = '24px 0 12px 0';
        element.style.color = '#000000';
        element.style.lineHeight = '1.4';
        element.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      });
      
      // Style paragraphs
      const paragraphs = tempDiv.querySelectorAll('p');
      paragraphs.forEach((p) => {
        const element = p as HTMLElement;
        element.style.margin = '12px 0';
        element.style.fontSize = '16px';
        element.style.lineHeight = '1.6';
        element.style.color = '#000000';
        element.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      });
      
      // Style formatting elements
      const boldElements = tempDiv.querySelectorAll('strong, b');
      boldElements.forEach((element) => {
        (element as HTMLElement).style.fontWeight = '700';
      });
      
      const italicElements = tempDiv.querySelectorAll('em, i');
      italicElements.forEach((element) => {
        (element as HTMLElement).style.fontStyle = 'italic';
      });
      
      const underlineElements = tempDiv.querySelectorAll('u');
      underlineElements.forEach((element) => {
        (element as HTMLElement).style.textDecoration = 'underline';
      });
      
      // Style horizontal rules
      const hrElements = tempDiv.querySelectorAll('hr');
      hrElements.forEach((element) => {
        const hrElement = element as HTMLElement;
        hrElement.style.border = 'none';
        hrElement.style.borderTop = '2px solid #000000';
        hrElement.style.margin = '24px 0';
        hrElement.style.width = '100%';
        hrElement.style.height = '0';
      });
      
      window.document.body.appendChild(tempDiv);
      
      // Wait for styles to be applied
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 800,
        height: tempDiv.scrollHeight
      });

      window.document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${documentState.title}.pdf`);

      toast({
        title: "PDF Exported",
        description: `Exported as ${documentState.title}.pdf`,
      });
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  }, [documentState.content, documentState.title, toast]);

  const exportAsDocx = useCallback(async () => {
    try {
      // Parse HTML content and convert to DOCX elements
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = documentState.content;
      
      const paragraphs: any[] = [];
      
      // Convert HTML elements to DOCX paragraphs
      const processNode = (node: Node): TextRun[] => {
        const runs: TextRun[] = [];
        
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          if (text.trim()) {
            runs.push(new TextRun(text));
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const text = element.textContent || '';
          
          if (text.trim()) {
            let isBold = false;
            let isItalic = false;
            let isUnderline = false;
            
            // Check for formatting
            if (element.tagName === 'STRONG' || element.tagName === 'B') {
              isBold = true;
            }
            if (element.tagName === 'EM' || element.tagName === 'I') {
              isItalic = true;
            }
            if (element.tagName === 'U') {
              isUnderline = true;
            }
            
            runs.push(new TextRun({
              text,
              bold: isBold,
              italics: isItalic,
              underline: isUnderline ? {} : undefined,
            }));
          }
        }
        
        return runs;
      };

      // Process each child node
      Array.from(tempDiv.childNodes).forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          if (element.tagName === 'H1') {
            paragraphs.push(new Paragraph({
              children: processNode(node),
              heading: HeadingLevel.HEADING_1,
            }));
          } else if (element.tagName === 'H2') {
            paragraphs.push(new Paragraph({
              children: processNode(node),
              heading: HeadingLevel.HEADING_2,
            }));
          } else if (element.tagName === 'H3') {
            paragraphs.push(new Paragraph({
              children: processNode(node),
              heading: HeadingLevel.HEADING_3,
            }));
          } else {
            const runs = processNode(node);
            if (runs.length > 0) {
              paragraphs.push(new Paragraph({
                children: runs,
              }));
            }
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          if (text.trim()) {
            paragraphs.push(new Paragraph({
              children: [new TextRun(text)],
            }));
          }
        }
      });

      // If no paragraphs, add a default one
      if (paragraphs.length === 0) {
        paragraphs.push(new Paragraph({
          children: [new TextRun('Empty document')],
        }));
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      saveAs(new Blob([buffer]), `${documentState.title}.docx`);

      toast({
        title: "DOCX Exported",
        description: `Exported as ${documentState.title}.docx`,
      });
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to export DOCX. Please try again.",
        variant: "destructive",
      });
    }
  }, [documentState.content, documentState.title, toast]);

  // Load document from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('current-document');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDocumentState(prev => ({
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
    document: documentState,
    updateContent,
    updateTitle,
    newDocument,
    openDocument,
    saveDocument,
    exportAsText,
    exportAsPDF,
    exportAsDocx,
    autoSave,
  };
}
