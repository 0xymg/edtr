import { useCallback, useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export function MarkdownEditor({ content, onChange, className = '' }: MarkdownEditorProps) {
  const [markdownContent, setMarkdownContent] = useState(content);

  useEffect(() => {
    setMarkdownContent(content);
  }, [content]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setMarkdownContent(newContent);
    onChange(newContent);
  }, [onChange]);

  return (
    <div className={`h-full ${className}`}>
      <Textarea
        value={markdownContent}
        onChange={handleChange}
        placeholder="Type your markdown here...

# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
`code`

- List item 1
- List item 2

1. Numbered item 1
2. Numbered item 2"
        className="h-full min-h-[600px] font-mono text-sm resize-none border-0 focus-visible:ring-0 p-8"
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
      />
    </div>
  );
}