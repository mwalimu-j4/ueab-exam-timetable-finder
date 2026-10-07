export const tokens = {
  colors: {
    brandViolet: '#8A3FD8',
    brandPink: '#C45AAA',
    brandCoral: '#E8786B',
    ink: '#1F1535',
    surface: '#FAF7FF',
    darkBg: '#140E24',
    darkCard: '#1E1633',
  },
  gradient: 'linear-gradient(135deg, #8A3FD8 0%, #C45AAA 55%, #E8786B 100%)',
} as const;

export const tw = {
  gradientBg: 'bg-brand-gradient',
  gradientText: 'bg-brand-gradient bg-clip-text text-transparent',
  primaryBtn: 'bg-brand-gradient text-white rounded-xl hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150',
  card: 'bg-white dark:bg-[#1E1633] rounded-2xl shadow-card',
  savedBtn: 'bg-[#8A3FD8]/10 text-[#8A3FD8] rounded-xl',
} as const;
