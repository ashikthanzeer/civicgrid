import React from 'react';
import { Check, Palette, ShieldCheck, Languages } from 'lucide-react';
import { useTheme, type Theme } from '../theme/useTheme';
import { useI18n } from '../i18n/useI18n';

const THEME_OPTIONS: { value: Theme; key: 'lightTheme' | 'darkTheme' }[] = [
  { value: 'light', key: 'lightTheme' },
  { value: 'dark', key: 'darkTheme' },
];

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, languages, t } = useI18n();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">{t.settings.pageTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          {t.settings.pageSubtitle}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Language Selection Card */}
        <div className="surface-card p-6 md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                {t.settings.languageTitle}
              </p>
              <h2 className="mt-2 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {t.settings.chooseLanguage}
              </h2>
            </div>
            <Languages className="h-5 w-5 shrink-0" style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {t.settings.languageDesc}
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {languages.map((lang) => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className="relative flex flex-col items-start justify-between rounded-[var(--radius)] border p-3.5 text-left transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    color: active ? 'var(--color-primary-fg)' : 'var(--color-text)',
                    backgroundColor: active ? 'var(--color-primary)' : 'var(--color-background)',
                    borderColor: active ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-base font-bold">{lang.nativeLabel}</span>
                    {active && <Check className="h-4 w-4 shrink-0" />}
                  </div>
                  <span
                    className="mt-1 text-xs font-medium"
                    style={{
                      color: active ? 'color-mix(in srgb, var(--color-primary-fg) 80%, transparent)' : 'var(--color-muted)',
                    }}
                  >
                    {lang.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Card */}
        <div className="surface-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                {t.settings.appearanceTitle}
              </p>
              <h2 className="mt-2 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {t.settings.themeLabel}
              </h2>
            </div>
            <Palette className="h-5 w-5 shrink-0" style={{ color: 'var(--color-muted)' }} />
          </div>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {t.settings.appearanceDesc}
          </p>
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
                  {t.settings[option.key]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Trust Card */}
        <div className="surface-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                {t.settings.trustTitle}
              </p>
              <h2 className="mt-2 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {t.nav.brandSubtitle}
              </h2>
            </div>
            <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: 'var(--color-muted)' }} />
          </div>
          <p className="mt-5 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {t.settings.trustDesc}
          </p>
          <p className="mt-4 text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
            {t.settings.storageNotice}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
