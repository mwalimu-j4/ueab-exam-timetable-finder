import { WifiOff } from 'lucide-react';

interface EmptyStateProps {
  variant: 'idle' | 'no-results' | 'error' | 'loading';
  onChipClick?: (chip: string) => void;
}

export function EmptyState({ variant, onChipClick }: EmptyStateProps) {
  if (variant === 'loading') {
    return (
      <div className="space-y-4" aria-live="polite" aria-busy="true">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="bg-white dark:bg-[#1E1633] rounded-2xl shadow-card p-5 animate-pulse"
          >
            <div className="h-6 bg-[#8A3FD8]/10 rounded w-1/3 mb-3" />
            <div className="h-4 bg-[#8A3FD8]/10 rounded w-3/4 mb-2" />
            <div className="h-4 bg-[#8A3FD8]/10 rounded w-1/2 mb-2" />
            <div className="h-4 bg-[#8A3FD8]/10 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div className="text-center py-12">
        <WifiOff className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-base">
          Couldn't reach the server, please try again
        </p>
      </div>
    );
  }

  if (variant === 'no-results') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-gray-600 dark:text-gray-400 text-base">
          No exam found, check the spelling or try the course code
        </p>
      </div>
    );
  }

  // variant === 'idle'
  return (
    <div className="text-center py-12">
      <p className="text-gray-600 dark:text-gray-400 text-base mb-6">
        Search for your exam above
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        {['COSC', 'INSY', 'MATH'].map(chip => (
          <button
            key={chip}
            onClick={() => onChipClick?.(chip)}
            className="px-5 py-2.5 bg-[#8A3FD8]/10 text-[#8A3FD8] rounded-full font-medium hover:bg-[#8A3FD8]/20 transition-colors min-h-[44px]"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
