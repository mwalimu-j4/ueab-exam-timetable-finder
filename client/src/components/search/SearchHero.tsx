import { useState, useEffect } from 'react';
import { Search, X, Cloud, Sparkles } from 'lucide-react';
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
    <>
    <section className="relative overflow-hidden bg-brand-gradient">
      {/* Decorative blurred circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-3xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" /> Your exam, at a glance
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          {greeting.greeting} 👋
        </h1>
        <p className="mb-6 mt-2 text-sm leading-6 text-white/85 sm:text-base md:text-lg">
          {greeting.subtitle}
        </p>

        {/* Search input */}
        <div className="relative mb-3 overflow-hidden rounded-2xl border border-white/30 bg-white shadow-2xl shadow-purple-950/20">
          <div className="flex h-14 items-center px-4 sm:h-16 sm:px-5">
            <Search className="h-5 w-5 flex-shrink-0 text-[#6d28a9]" />
            <input
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={PLACEHOLDERS[placeholderIndex]}
              autoFocus={!isMobile}
              aria-label="Search for your exam"
              className="mx-1 min-w-0 flex-1 rounded-xl px-3 py-3 text-base font-bold text-slate-900 caret-[#8A3FD8] outline-none placeholder:font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-[#8A3FD8] sm:text-lg"
            />
            {value && (
              <button
                onClick={() => onChange('')}
                aria-label="Clear search"
                className="flex-shrink-0 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        <div className="mb-4 flex gap-2">
          <button onClick={() => window.dispatchEvent(new Event('ueab-open-student-access'))} className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-white/15 text-sm font-semibold text-white transition-colors hover:bg-white/25">
            <Cloud className="h-4 w-4" /> Save timetable
          </button>
          {value && <button onClick={() => onChange('')} className="min-h-[44px] rounded-xl bg-white/15 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/25">Clear</button>}
        </div>

        {/* Quick filter chips */}
        <div className="flex justify-center gap-2 overflow-x-auto scrollbar-hide sm:flex-wrap">
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => onChange(chip)}
              className="flex-shrink-0 rounded-full border border-white/15 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              {chip}
            </button>
          ))}
          </div>
        </div>

        {/* Visually hidden live region for screen readers */}
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {/* This will be updated by the parent with result count */}
        </span>
      </div>
      </section>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
