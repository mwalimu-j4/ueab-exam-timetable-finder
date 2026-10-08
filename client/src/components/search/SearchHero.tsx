import { useState, useEffect } from 'react';
import { Search, X, Cloud } from 'lucide-react';
import { getTimeGreeting } from '@/utils/timeGreeting';

interface SearchHeroProps {
  value: string;
  onChange: (val: string) => void;
}

const PLACEHOLDERS = ['INSY 210', 'Database', 'COSC272'];
const QUICK_CHIPS = ['COSC', 'INSY', 'MATH', 'NRSG', 'RELT', 'CHEM', 'BIOL'];

export function SearchHero({ value, onChange }: SearchHeroProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [greeting, setGreeting] = useState(getTimeGreeting());
  const [isMobile, setIsMobile] = useState(false);

  // Cycle placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update greeting every 30 minutes
  useEffect(() => {
    setGreeting(getTimeGreeting());
    const interval = setInterval(() => {
      setGreeting(getTimeGreeting());
    }, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, []);

  // Detect mobile for autofocus
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="relative bg-brand-gradient overflow-hidden">
      {/* Decorative blurred circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-5 sm:py-8 md:py-10 max-w-2xl">
        <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-1">
          {greeting.greeting} 👋
        </h1>
        <p className="text-white/90 text-sm sm:text-base md:text-lg text-center mb-4 sm:mb-6">
          {greeting.subtitle}
        </p>

        {/* Search input */}
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden mb-3">
          <div className="flex items-center px-4 h-14 sm:h-16">
            <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={PLACEHOLDERS[placeholderIndex]}
              autoFocus={!isMobile}
              aria-label="Search for your exam"
              className="flex-1 px-3 py-3 text-base outline-none focus:ring-2 focus:ring-[#8A3FD8] rounded-xl mx-1"
            />
            {value && (
              <button
                onClick={() => onChange('')}
                aria-label="Clear search"
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <button onClick={() => window.dispatchEvent(new Event('ueab-open-student-access'))} className="flex-1 min-h-[40px] rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-semibold flex items-center justify-center gap-2">
            <Cloud className="h-4 w-4" /> Save timetable
          </button>
          {value && <button onClick={() => onChange('')} className="min-h-[40px] rounded-xl bg-white/20 hover:bg-white/30 text-white px-4 text-sm font-semibold">Clear</button>}
        </div>

        {/* Quick filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => onChange(chip)}
              className="flex-shrink-0 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-full transition-colors backdrop-blur-sm"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Visually hidden live region for screen readers */}
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {/* This will be updated by the parent with result count */}
        </span>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
