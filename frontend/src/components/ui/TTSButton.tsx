import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, Square, Globe, Loader2, ChevronDown, Check } from 'lucide-react';
import { speakText, stopSpeech } from '../../utils/speech';
import { useI18n } from '../../i18n/useI18n';
import { SUPPORTED_LANGUAGES } from '../../i18n/translations';
import { translateComplaintText } from '../../api/complaints';
import type { SupportedLanguage } from '../../i18n/types';

interface TTSButtonProps {
  text: string;
  label?: string;
  className?: string;
  showSubtitle?: boolean;
}

export const TTSButton: React.FC<TTSButtonProps> = ({
  text,
  label,
  className = '',
  showSubtitle = true,
}) => {
  const { language } = useI18n();
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(language);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);

  const translationCache = useRef<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync selected language when global UI language changes (if not playing)
  useEffect(() => {
    if (!isPlaying) {
      setSelectedLang(language);
    }
  }, [language, isPlaying]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const activeLangMeta = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  const handlePlayInLanguage = useCallback(
    async (targetLang: SupportedLanguage) => {
      if (isPlaying) {
        stopSpeech();
        setIsPlaying(false);
        return;
      }

      if (!text || text.trim() === '') return;

      let textToSpeak = text;

      if (targetLang !== 'en') {
        const cacheKey = `${targetLang}_${text}`;
        if (translationCache.current[cacheKey]) {
          textToSpeak = translationCache.current[cacheKey];
          setTranslatedText(textToSpeak);
        } else {
          setIsTranslating(true);
          try {
            const translated = await translateComplaintText(text, targetLang);
            translationCache.current[cacheKey] = translated;
            textToSpeak = translated;
            setTranslatedText(translated);
          } catch {
            textToSpeak = text;
          } finally {
            setIsTranslating(false);
          }
        }
      } else {
        setTranslatedText(null);
      }

      const success = speakText(
        textToSpeak,
        targetLang,
        () => setIsPlaying(false),
        () => setIsPlaying(false),
      );

      if (success) {
        setIsPlaying(true);
      }
    },
    [isPlaying, text],
  );

  const handleLanguageSelect = (langCode: SupportedLanguage) => {
    setSelectedLang(langCode);
    setDropdownOpen(false);
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    }
    // Auto-play immediately in selected language for smooth UX
    setTimeout(() => {
      handlePlayInLanguage(langCode);
    }, 50);
  };

  return (
    <div className="relative inline-flex flex-col gap-1.5" ref={dropdownRef}>
      <div className={`inline-flex items-center rounded-lg border shadow-sm ${className}`}
        style={{
          borderColor: isPlaying ? 'var(--color-primary)' : 'var(--color-border)',
          backgroundColor: isPlaying
            ? 'color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))'
            : 'var(--color-surface)',
        }}
      >
        {/* Main Speak / Stop Button */}
        <button
          type="button"
          onClick={() => handlePlayInLanguage(selectedLang)}
          disabled={isTranslating}
          title={isPlaying ? 'Stop audio playback' : `Listen to complaint in ${activeLangMeta.nativeLabel}`}
          aria-label={isPlaying ? 'Stop audio playback' : `Listen to complaint in ${activeLangMeta.nativeLabel}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          style={{
            color: isPlaying ? 'var(--color-primary)' : 'var(--color-text)',
          }}
        >
          {isTranslating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: 'var(--color-primary)' }} />
              <span className="text-[11px] opacity-80">Translating...</span>
            </>
          ) : isPlaying ? (
            <>
              <Square className="h-3.5 w-3.5 animate-pulse text-red-500 fill-current" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Volume2 className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />
              <span>{label || 'Listen'}</span>
            </>
          )}
        </button>

        <div className="h-4 w-px bg-[var(--color-border)] opacity-60" />

        {/* Language Selection Pill / Dropdown Toggle */}
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          title="Select language to listen in"
          aria-label="Select language to listen in"
          aria-expanded={dropdownOpen}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] rounded-r-lg"
          style={{
            color: isPlaying ? 'var(--color-primary)' : 'var(--color-muted)',
          }}
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="font-semibold text-[11px]">{activeLangMeta.nativeLabel}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Language Selection Popover */}
      {dropdownOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            Listen in Language:
          </p>
          <div className="space-y-0.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === selectedLang;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                    isSelected
                      ? 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] font-semibold'
                      : 'hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]'
                  }`}
                  style={{
                    color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.nativeLabel}</span>
                    <span className="text-[10px] opacity-60">({lang.label})</span>
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5" style={{ color: 'var(--color-primary)' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtitle / Translated script readout when playing non-English */}
      {showSubtitle && translatedText && selectedLang !== 'en' && isPlaying && (
        <div
          className="rounded-lg border px-3 py-1.5 text-xs font-medium animate-in fade-in slide-in-from-top-1"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 6%, transparent)',
            color: 'var(--color-text)',
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-wide block mb-0.5" style={{ color: 'var(--color-primary)' }}>
            🗣️ {activeLangMeta.nativeLabel}:
          </span>
          <p className="leading-relaxed italic">"{translatedText}"</p>
        </div>
      )}
    </div>
  );
};
