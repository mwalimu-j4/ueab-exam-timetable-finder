import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchHeroProps {
  value: string;
  onChange: (val: string) => void;
}

const PLACEHOLDERS = ['COSC 440', 'Artificial Intelligence', 'INSY 210'];

export function SearchHero({ value, onChange }: SearchHeroProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative bg-brand-gradient rounded-b-[2rem] overflow-hidden">
      {/* Decorative blurred circles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-12 md:py-16 max-w-2xl">
        <h1 className="text-white text-3xl md:text-4xl font-bold text-center mb-3">
          Hi there 👋 Ready for exams?
        </h1>
        <p className="text-white/90 text-base md:text-lg text-center mb-8">
          Type your course code or name to find your exam in seconds.
        </p>

        {/* Search input */}
        <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex items-center px-4 h-14">
            <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={PLACEHOLDERS[placeholderIndex]}
              autoFocus
              aria-label="Search for your exam"
              className="flex-1 px-3 py-3 text-base outline-none focus:ring-2 focus:ring-[#8A3FD8] rounded-xl mx-1"
            />
            {value && (
              <button
                onClick={() => onChange('')}
                aria-label="Clear search"
                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Visually hidden live region for screen readers */}
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {/* This will be updated by the parent with result count */}
        </span>
      </div>
    </div>
  );
}
