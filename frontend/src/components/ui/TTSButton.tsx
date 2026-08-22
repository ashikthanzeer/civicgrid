import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Square } from 'lucide-react';
import { speakText, stopSpeech } from '../../utils/speech';
import { useI18n } from '../../i18n/useI18n';

interface TTSButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export const TTSButton: React.FC<TTSButtonProps> = ({ text, label, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { language } = useI18n();

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const handleToggle = useCallback(() => {
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    } else {
      const success = speakText(
        text,
        language,
        () => setIsPlaying(false),
        () => setIsPlaying(false),
      );
      if (success) {
        setIsPlaying(true);
      }
    }
  }, [isPlaying, text, language]);

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={isPlaying ? 'Stop audio' : 'Listen to audio summary'}
      aria-label={isPlaying ? 'Stop audio' : 'Listen to audio summary'}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-90 active:scale-95 ${className}`}
      style={{
        borderColor: isPlaying ? 'var(--color-primary)' : 'var(--color-border)',
        backgroundColor: isPlaying
          ? 'color-mix(in srgb, var(--color-primary) 14%, transparent)'
          : 'var(--color-surface)',
        color: isPlaying ? 'var(--color-primary)' : 'var(--color-text)',
      }}
    >
      {isPlaying ? (
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
  );
};
