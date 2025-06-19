import { useCallback, useState } from 'react';
import { marked } from 'marked';
import TurndownService from 'turndown';

export function useMarkdown() {
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });

  const htmlToMarkdown = useCallback((html: string): string => {
    // If HTML is empty or just whitespace, return empty string
    if (!html || html.trim() === '' || html === '<p></p>') {
      return '';
    }

    // Clean up the HTML before conversion
    let cleanHtml = html;
    
    // Remove empty paragraphs
    cleanHtml = cleanHtml.replace(/<p[^>]*>(\s*)<\/p>/g, '');
    
    // Fix consecutive single character paragraphs - merge them
    cleanHtml = cleanHtml.replace(/(<p[^>]*>[^<]{1,3}<\/p>(\s*)){2,}/g, (match) => {
      // Extract all single character content from consecutive paragraphs
      const singleCharMatches = match.match(/<p[^>]*>([^<]*?)<\/p>/g);
      if (singleCharMatches) {
        const combinedText = singleCharMatches
          .map(p => p.replace(/<\/?p[^>]*>/g, ''))
          .join('');
        return `<p>${combinedText}</p>`;
      }
      return match;
    });
    
    // Handle TipTap's specific HTML structure issues
    cleanHtml = cleanHtml.replace(/<p[^>]*><\/p>/g, ''); // Remove completely empty paragraphs
    cleanHtml = cleanHtml.replace(/(<br\s*\/?>)+/g, '\n'); // Convert breaks to newlines
    
    try {
      return turndownService.turndown(cleanHtml);
    } catch (error) {
      console.warn('Error converting HTML to markdown:', error);
      // Fallback: extract text content only
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cleanHtml;
      return tempDiv.textContent || tempDiv.innerText || '';
    }
  }, [turndownService]);

  const markdownToHtml = useCallback((markdown: string): string => {
    return marked.parse(markdown) as string;
  }, []);

  const toggleMarkdownMode = useCallback(() => {
    setIsMarkdownMode(prev => !prev);
  }, []);

  return {
    isMarkdownMode,
    toggleMarkdownMode,
    htmlToMarkdown,
    markdownToHtml,
  };
}