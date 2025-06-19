import { useCallback, useState } from 'react';
import { marked } from 'marked';
import TurndownService from 'turndown';

export function useMarkdown() {
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  const htmlToMarkdown = useCallback((html: string): string => {
    return turndownService.turndown(html);
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