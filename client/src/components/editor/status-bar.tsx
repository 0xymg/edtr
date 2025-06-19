import { EditorStats } from '@/hooks/use-editor';

interface StatusBarProps {
  stats: EditorStats;
  documentStatus: string;
  lastSaved: Date | null;
}

export function StatusBar({ stats, documentStatus, lastSaved }: StatusBarProps) {
  const formatLastSaved = (date: Date | null) => {
    if (!date) return '';
    return `Last saved: ${date.toLocaleTimeString()}`;
  };

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-6">
          <span>Words: {stats.words}</span>
          <span>Characters: {stats.characters}</span>
          <span>Lines: {stats.lines}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{formatLastSaved(lastSaved)}</span>
          <span>{documentStatus}</span>
        </div>
      </div>
    </footer>
  );
}
