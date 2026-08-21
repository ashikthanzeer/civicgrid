import React from 'react';
import { Check, Palette, ShieldCheck } from 'lucide-react';
import { useTheme, type Theme } from '../theme/useTheme';

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Preferences are stored in this browser and apply across all pages.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="surface-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                Appearance
              </p>
              <h2 className="mt-2 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Color theme
              </h2>
            </div>
            <Palette className="h-5 w-5 shrink-0" style={{ color: 'var(--color-muted)' }} />
          </div>
          <div className="mt-6 flex flex-col gap-2">
            {THEME_OPTIONS.map((option) => {
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className="relative rounded-[var(--radius)] border px-4 py-3 text-left text-sm font-semibold transition-colors"
                  style={{
                    color: active ? 'var(--color-primary-fg)' : 'var(--color-text)',
                    backgroundColor: active ? 'var(--color-primary)' : 'var(--color-background)',
                    borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >
                  {active && <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                Trust
              </p>
              <h2 className="mt-2 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Civic intelligence
              </h2>
            </div>
            <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: 'var(--color-muted)' }} />
          </div>
          <p className="mt-5 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Every complaint keeps its original citizen voice alongside the structured interpretation,
            so context never disappears behind automation.
          </p>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
