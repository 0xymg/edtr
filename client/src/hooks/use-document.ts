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

export type PDFMarginType = 'narrower' | 'narrow' | 'normal' | 'wide' | 'wider';

export interface PDFMarginSettings {
  type: PDFMarginType;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const PDF_MARGIN_PRESETS: Record<PDFMarginType, PDFMarginSettings> = {
  narrower: { type: 'narrower', top: 3, right: 3, bottom: 3, left: 3 },
  narrow: { type: 'narrow', top: 5, right: 5, bottom: 5, left: 5 },
  normal: { type: 'normal', top: 8, right: 8, bottom: 8, left: 8 },
  wide: { type: 'wide', top: 10, right: 10, bottom: 10, left: 10 },
  wider: { type: 'wider', top: 12, right: 12, bottom: 12, left: 12 },
};

export function useDocument() {
  const { toast } = useToast();
  const [documentState, setDocumentState] = useState<DocumentState>({
    title: 'Untitled Document',
    content: '',
    isDirty: false,
    isSaving: false,
    lastSaved: null,
  });
  
  const [pdfMargins, setPdfMargins] = useState<PDFMarginType>('normal');

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

    try {
      const documentToSave = {
        title: documentState.title,
        content: documentState.content,
        lastSaved: new Date().toISOString(),
        id: Date.now().toString(),
      };
      
      localStorage.setItem('current-document', JSON.stringify(documentToSave));
      
      const existingDocs = JSON.parse(localStorage.getItem('saved-documents') || '[]');
      const docIndex = existingDocs.findIndex((doc: any) => doc.title === documentState.title);
      
      if (docIndex >= 0) {
        existingDocs[docIndex] = documentToSave;
      } else {
        existingDocs.push(documentToSave);
      }
      
      localStorage.setItem('saved-documents', JSON.stringify(existingDocs));

      setDocumentState(prev => ({
        ...prev,
        isDirty: false,
        isSaving: false,
        lastSaved: new Date(),
      }));
    } catch (error) {
      console.error('Auto-save failed:', error);
      setDocumentState(prev => ({ ...prev, isSaving: false }));
    }
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
    input.accept = '.html,.txt,.md,.markdown';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const fileContent = await file.text();
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        let processedContent = '';
        let title = fileName.replace(/\.[^/.]+$/, '');

        // Process content based on file type
        if (fileExtension === 'md' || fileExtension === 'markdown') {
          // Convert markdown to HTML
          const markdownToHtml = (markdown: string): string => {
            let html = markdown;
            
            // Convert headings
            html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
            html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
            html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
            html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
            html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
            html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
            
            // Convert bold and italic
            html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
            html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
            html = html.replace(/_(.+?)_/g, '<em>$1</em>');
            
            // Convert inline code
            html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
            
            // Convert code blocks
            const codeBlockRegex = /```([\s\S]*?)```/g;
            html = html.replace(codeBlockRegex, '<pre><code>$1</code></pre>');
            
            // Convert links
            html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
            
            // Convert images
            html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
            
            // Convert horizontal rules
            html = html.replace(/^---$/gm, '<hr>');
            html = html.replace(/^\*\*\*$/gm, '<hr>');
            
            // Convert unordered lists
            html = html.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li>$1</li>');
            html = html.replace(/(<li>.*<\/li>)/, '<ul>$1</ul>');
            
            // Convert ordered lists
            html = html.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>');
            
            // Convert blockquotes
            html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
            
            // Convert line breaks to paragraphs
            const lines = html.split('\n');
            const paragraphs: string[] = [];
            let currentParagraph = '';
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              
              // Skip empty lines
              if (line === '') {
                if (currentParagraph.trim()) {
                  // Check if it's already a block element
                  if (!currentParagraph.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|hr)/)) {
                    paragraphs.push(`<p>${currentParagraph.trim()}</p>`);
                  } else {
                    paragraphs.push(currentParagraph.trim());
                  }
                  currentParagraph = '';
                }
                continue;
              }
              
              // If it's a block element, add it directly
              if (line.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|hr)/)) {
                if (currentParagraph.trim()) {
                  paragraphs.push(`<p>${currentParagraph.trim()}</p>`);
                  currentParagraph = '';
                }
                paragraphs.push(line);
              } else {
                currentParagraph += (currentParagraph ? ' ' : '') + line;
              }
            }
            
            // Add remaining paragraph
            if (currentParagraph.trim()) {
              if (!currentParagraph.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|hr)/)) {
                paragraphs.push(`<p>${currentParagraph.trim()}</p>`);
              } else {
                paragraphs.push(currentParagraph.trim());
              }
            }
            
            return paragraphs.join('\n');
          };

          processedContent = markdownToHtml(fileContent);
          
          // Extract title from first heading if exists
          const firstHeadingMatch = fileContent.match(/^#\s+(.+)$/m);
          if (firstHeadingMatch) {
            title = firstHeadingMatch[1];
          }
        } else if (fileExtension === 'txt') {
          // Convert plain text to HTML paragraphs
          const lines = fileContent.split('\n');
          const paragraphs = lines
            .filter(line => line.trim())
            .map(line => `<p>${line}</p>`)
            .join('\n');
          processedContent = paragraphs || '<p></p>';
        } else if (fileExtension === 'html') {
          // Use HTML content as-is
          processedContent = fileContent;
        } else {
          // Default: treat as plain text
          processedContent = `<p>${fileContent}</p>`;
        }

        setDocumentState({
          title,
          content: processedContent,
          isDirty: false,
          isSaving: false,
          lastSaved: new Date(file.lastModified),
        });
        
        toast({
          title: "Document Opened",
          description: `Opened ${fileName}`,
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
    try {
      // Save to localStorage
      const documentToSave = {
        title: documentState.title,
        content: documentState.content,
        lastSaved: new Date().toISOString(),
        id: Date.now().toString(), // Simple ID generation
      };
      
      // Save current document
      localStorage.setItem('current-document', JSON.stringify(documentToSave));
      
      // Also save to documents list for future access
      const existingDocs = JSON.parse(localStorage.getItem('saved-documents') || '[]');
      const docIndex = existingDocs.findIndex((doc: any) => doc.title === documentState.title);
      
      if (docIndex >= 0) {
        existingDocs[docIndex] = documentToSave;
      } else {
        existingDocs.push(documentToSave);
      }
      
      localStorage.setItem('saved-documents', JSON.stringify(existingDocs));

      setDocumentState(prev => ({
        ...prev,
        isDirty: false,
        lastSaved: new Date(),
      }));

      toast({
        title: "Document Saved",
        description: `Saved "${documentState.title}" to local storage`,
      });
    } catch (error) {
      toast({
        title: "Save Error",
        description: "Failed to save document. Please try again.",
        variant: "destructive",
      });
    }
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

  const exportAsHTML = useCallback(() => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${documentState.title}</title>
    <style>
        body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
        }
        p {
            margin-bottom: 16px;
        }
        ul, ol {
            margin-bottom: 16px;
            padding-left: 24px;
        }
        li {
            margin-bottom: 4px;
        }
        strong {
            font-weight: 600;
        }
        em {
            font-style: italic;
        }
        u {
            text-decoration: underline;
        }
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
    </style>
</head>
<body>
    ${documentState.content}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${documentState.title}.html`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Document Exported",
      description: `Exported as ${documentState.title}.html`,
    });
  }, [documentState.content, documentState.title, toast]);

  const exportAsMarkdown = useCallback(() => {
    // Create a temporary div to parse HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = documentState.content;

    // Function to convert HTML nodes to markdown
    const htmlToMarkdown = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const childContent = Array.from(element.childNodes)
          .map(child => htmlToMarkdown(child))
          .join('');

        switch (tagName) {
          case 'h1':
            return `# ${childContent}\n\n`;
          case 'h2':
            return `## ${childContent}\n\n`;
          case 'h3':
            return `### ${childContent}\n\n`;
          case 'h4':
            return `#### ${childContent}\n\n`;
          case 'h5':
            return `##### ${childContent}\n\n`;
          case 'h6':
            return `###### ${childContent}\n\n`;
          case 'p':
            if (childContent.trim() === '') return '\n';
            return `${childContent}\n\n`;
          case 'strong':
          case 'b':
            return `**${childContent}**`;
          case 'em':
          case 'i':
            return `*${childContent}*`;
          case 'u':
            return `<u>${childContent}</u>`;
          case 'br':
            return '\n';
          case 'ul':
            return `${childContent}\n`;
          case 'ol':
            return `${childContent}\n`;
          case 'li':
            const parentTag = element.parentElement?.tagName.toLowerCase();
            const prefix = parentTag === 'ol' ? '1. ' : '- ';
            return `${prefix}${childContent}\n`;
          case 'blockquote':
            return childContent.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
          case 'code':
            return `\`${childContent}\``;
          case 'pre':
            return `\`\`\`\n${childContent}\n\`\`\`\n\n`;
          case 'a':
            const href = element.getAttribute('href');
            return href ? `[${childContent}](${href})` : childContent;
          case 'img':
            const src = element.getAttribute('src');
            const alt = element.getAttribute('alt') || '';
            return src ? `![${alt}](${src})` : '';
          case 'hr':
            return '---\n\n';
          default:
            return childContent;
        }
      }

      return '';
    };

    // Convert HTML to markdown
    let markdownContent = Array.from(tempDiv.childNodes)
      .map(node => htmlToMarkdown(node))
      .join('');

    // Clean up extra newlines
    markdownContent = markdownContent.replace(/\n{3,}/g, '\n\n');
    markdownContent = markdownContent.trim();

    // Add title as main heading if content doesn't start with a heading
    const finalContent = `# ${documentState.title}\n\n${markdownContent}`;

    const blob = new Blob([finalContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${documentState.title}.md`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Document Exported",
      description: `Exported as ${documentState.title}.md`,
    });
  }, [documentState.content, documentState.title, toast]);

  const importFromMarkdown = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown';
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const markdownContent = e.target?.result as string;
        if (!markdownContent) return;

        // Function to convert markdown to HTML
        const markdownToHtml = (markdown: string): string => {
          let html = markdown;
          
          // Convert headings
          html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
          html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
          html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
          html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
          html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
          html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
          
          // Convert bold and italic
          html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
          html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
          html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
          html = html.replace(/_(.+?)_/g, '<em>$1</em>');
          
          // Convert inline code
          html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
          
          // Convert code blocks
          const codeBlockRegex = /```([\s\S]*?)```/g;
          html = html.replace(codeBlockRegex, '<pre><code>$1</code></pre>');
          
          // Convert links
          html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
          
          // Convert images
          html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
          
          // Convert horizontal rules
          html = html.replace(/^---$/gm, '<hr>');
          html = html.replace(/^\*\*\*$/gm, '<hr>');
          
          // Convert unordered lists
          html = html.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li>$1</li>');
          html = html.replace(/(<li>.*<\/li>)/, '<ul>$1</ul>');
          
          // Convert ordered lists
          html = html.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>');
          
          // Convert blockquotes
          html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
          
          // Convert line breaks to paragraphs
          const lines = html.split('\n');
          const paragraphs: string[] = [];
          let currentParagraph = '';
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (line === '') {
              if (currentParagraph.trim()) {
                // Check if it's already a block element
                if (!currentParagraph.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|hr)/)) {
                  paragraphs.push(`<p>${currentParagraph.trim()}</p>`);
                } else {
                  paragraphs.push(currentParagraph.trim());
                }
                currentParagraph = '';
              }
              continue;
            }
            
            // If it's a block element, add it directly
            if (line.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|hr)/)) {
              if (currentParagraph.trim()) {
                paragraphs.push(`<p>${currentParagraph.trim()}</p>`);
                currentParagraph = '';
              }
              paragraphs.push(line);
            } else {
              currentParagraph += (currentParagraph ? ' ' : '') + line;
            }
          }
          
          // Add remaining paragraph
          if (currentParagraph.trim()) {
            if (!currentParagraph.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|hr)/)) {
              paragraphs.push(`<p>${currentParagraph.trim()}</p>`);
            } else {
              paragraphs.push(currentParagraph.trim());
            }
          }
          
          return paragraphs.join('\n');
        };

        // Convert markdown to HTML
        const htmlContent = markdownToHtml(markdownContent);
        
        // Extract title from first heading or use filename
        let title = file.name.replace(/\.(md|markdown)$/i, '');
        const firstHeadingMatch = markdownContent.match(/^#\s+(.+)$/m);
        if (firstHeadingMatch) {
          title = firstHeadingMatch[1];
        }

        // Update document state
        setDocumentState(prev => ({
          ...prev,
          title,
          content: htmlContent,
          isDirty: true,
        }));

        toast({
          title: "Markdown Imported",
          description: `Successfully imported ${file.name}`,
        });
      };

      reader.readAsText(file);
    };

    input.click();
  }, [toast]);

  const exportAsPDF = useCallback(async () => {
    try {
      const margins = PDF_MARGIN_PRESETS[pdfMargins];
      const contentWidth = 210 - margins.left - margins.right; // A4 width minus margins
      
      // Create a temporary div with the content for rendering
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = documentState.content;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = `${contentWidth * 3.78}px`; // Convert mm to px (approx)
      tempDiv.style.padding = `${margins.top * 3.78 + 20}px ${margins.right * 3.78}px ${margins.bottom * 3.78 + 20}px ${margins.left * 3.78}px`; // Add extra padding
      tempDiv.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      tempDiv.style.fontSize = '16px';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.color = '#000000';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.wordBreak = 'break-word';
      tempDiv.style.pageBreakInside = 'avoid';
      
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
        hrElement.style.borderTop = '1px solid #efefef';
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
        width: contentWidth * 3.78,
        height: tempDiv.scrollHeight
      });

      window.document.body.removeChild(tempDiv);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Calculate usable page height in mm, then convert to pixels
      const usablePageHeightMM = 297 - margins.top - margins.bottom - 10; // A4 height minus margins and safety
      const pixelsPerMM = canvas.height / imgHeight;
      const pageHeightPixels = usablePageHeightMM * pixelsPerMM;
      
      let currentY = 0;
      let pageNumber = 0;
      
      while (currentY < canvas.height) {
        if (pageNumber > 0) {
          pdf.addPage();
        }
        
        // Calculate how much content fits on this page
        const remainingContent = canvas.height - currentY;
        const contentForThisPage = Math.min(pageHeightPixels, remainingContent);
        
        // Create canvas for this page
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        pageCanvas.width = canvas.width;
        pageCanvas.height = contentForThisPage;
        
        if (pageCtx) {
          // White background
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          
          // Draw content slice
          pageCtx.drawImage(
            canvas,
            0, currentY, canvas.width, contentForThisPage,
            0, 0, canvas.width, contentForThisPage
          );
          
          // Add to PDF
          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          const pageHeightMM = contentForThisPage / pixelsPerMM;
          
          pdf.addImage(pageImgData, 'PNG', margins.left, margins.top + 2, imgWidth, pageHeightMM);
        }
        
        currentY += contentForThisPage;
        pageNumber++;
      }

      pdf.save(`${documentState.title}.pdf`);

      toast({
        title: "PDF Exported",
        description: `Exported as ${documentState.title}.pdf with ${margins.type} margins`,
      });
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  }, [documentState.content, documentState.title, toast, pdfMargins]);

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

  // Auto-save with debouncing - save 2 seconds after user stops typing
  useEffect(() => {
    if (!documentState.isDirty) return;
    
    const timeoutId = setTimeout(() => {
      try {
        const documentToSave = {
          title: documentState.title,
          content: documentState.content,
          lastSaved: new Date().toISOString(),
          id: Date.now().toString(),
        };
        
        localStorage.setItem('current-document', JSON.stringify(documentToSave));
        
        const existingDocs = JSON.parse(localStorage.getItem('saved-documents') || '[]');
        const docIndex = existingDocs.findIndex((doc: any) => doc.title === documentState.title);
        
        if (docIndex >= 0) {
          existingDocs[docIndex] = documentToSave;
        } else {
          existingDocs.push(documentToSave);
        }
        
        localStorage.setItem('saved-documents', JSON.stringify(existingDocs));

        setDocumentState(prev => ({
          ...prev,
          isDirty: false,
          lastSaved: new Date(),
        }));
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [documentState.content, documentState.title, documentState.isDirty]);

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
    exportAsHTML,
    exportAsMarkdown,
    importFromMarkdown,
    exportAsPDF,
    exportAsDocx,
    autoSave,
    pdfMargins,
    setPdfMargins,
    pdfMarginPresets: PDF_MARGIN_PRESETS,
  };
}
