'use client';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="rounded-full celo-border px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm celo-card hover:scale-105 transition-transform duration-200"
    >
      {isDark ? 'Yellow' : 'Dark'}
    </button>
  );
}



