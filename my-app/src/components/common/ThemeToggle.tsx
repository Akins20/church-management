'use client';

import { useTheme, type ThemeChoice } from '@/lib/theme';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

const OPTIONS: { value: ThemeChoice; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { value: 'light', icon: SunIcon, label: 'Light' },
  { value: 'system', icon: ComputerDesktopIcon, label: 'System' },
  { value: 'dark', icon: MoonIcon, label: 'Dark' },
];

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();

  if (collapsed) {
    // Cycle through the options when the rail is collapsed
    const order: ThemeChoice[] = ['light', 'system', 'dark'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    const Active = OPTIONS.find((o) => o.value === theme)?.icon ?? ComputerDesktopIcon;
    return (
      <button
        onClick={() => setTheme(next)}
        title={`Theme: ${theme}`}
        className="w-full p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-black/[0.06] dark:hover:bg-white/10 transition-colors"
      >
        <Active className="w-5 h-5 mx-auto" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-black/[0.04] dark:bg-white/5">
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            title={o.label}
            className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-colors ${
              active
                ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
