import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, AlertTriangle } from 'lucide-react';
import { useI18n } from '../../i18n/useI18n';

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: Event & { error: string }) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

// Language options for Indian civic contexts
export const VOICE_LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'bn-IN', label: 'Bengali' },
] as const;

type VoiceLanguage = typeof VOICE_LANGUAGES[number]['code'];

type RecordingState = 'idle' | 'recording' | 'processing';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, disabled }) => {
  const { currentMeta } = useI18n();
  const [state, setState] = useState<RecordingState>('idle');
  const [language, setLanguage] = useState<VoiceLanguage>(() => (currentMeta.voiceCode as VoiceLanguage) || 'en-IN');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => !!getSpeechRecognition());
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTextRef = useRef('');

  // Sync voice language when global language changes
  useEffect(() => {
    if (currentMeta.voiceCode) {
      setLanguage(currentMeta.voiceCode as VoiceLanguage);
    }
  }, [currentMeta.voiceCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    setError(null);
    setInterimText('');
    finalTextRef.current = '';

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState('recording');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalSegment = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalSegment += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (finalSegment) {
        finalTextRef.current += finalSegment;
        onTranscript(finalTextRef.current.trim());
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      const errorMessages: Record<string, string> = {
        'not-allowed': 'Microphone access denied. Please allow microphone in browser settings.',
        'no-speech': 'No speech detected. Please try again.',
        'network': 'Network error. Please check your connection.',
        'audio-capture': 'No microphone found. Please connect a microphone.',
        'aborted': '',
      };
      const msg = errorMessages[event.error] ?? `Voice error: ${event.error}`;
      if (msg) setError(msg);
      setState('idle');
    };

    recognition.onend = () => {
      setState('idle');
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, onTranscript]);

  if (!isSupported) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-warning) 25%, transparent)',
          color: 'var(--color-muted)',
        }}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-warning)' }} />
        Voice input requires Chrome, Edge, or Safari.
      </div>
    );
  }

  const isRecording = state === 'recording';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Language selector */}
        <div className="relative min-w-[140px] flex-1 sm:flex-none">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as VoiceLanguage)}
            disabled={isRecording || disabled}
            className="rounded-lg border py-1.5 pl-3 pr-8 text-xs font-medium focus:outline-none appearance-none"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: isRecording ? 'not-allowed' : 'pointer',
            }}
            aria-label="Voice language"
          >
            {VOICE_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
          <div
            className="pointer-events-none absolute inset-y-0 right-2 flex items-center"
            style={{ color: 'var(--color-muted)' }}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Record / Stop button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
          className="relative flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-all"
          style={{
            backgroundColor: isRecording
              ? 'color-mix(in srgb, var(--color-danger) 12%, transparent)'
              : 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
            color: isRecording ? 'var(--color-danger)' : 'var(--color-primary)',
            border: `1px solid ${isRecording
              ? 'color-mix(in srgb, var(--color-danger) 30%, transparent)'
              : 'color-mix(in srgb, var(--color-primary) 25%, transparent)'}`,
          }}
        >
          {isRecording ? (
            <>
              {/* Pulse ring */}
              <span className="relative flex h-4 w-4 shrink-0">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ backgroundColor: 'var(--color-danger)' }}
                />
                <Square className="relative h-4 w-4 fill-current" />
              </span>
              Stop
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Speak
            </>
          )}
        </button>

        {/* Recording indicator */}
        {isRecording && (
          <span className="text-xs font-medium animate-pulse" style={{ color: 'var(--color-danger)' }}>
            ● Recording…
          </span>
        )}
      </div>

      {/* Live interim transcript preview */}
      {isRecording && interimText && (
        <div
          className="rounded-lg px-3 py-2 text-sm italic"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, transparent)',
            border: '1px dashed color-mix(in srgb, var(--color-primary) 30%, transparent)',
            color: 'var(--color-muted)',
          }}
        >
          {interimText}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-danger)' }}>
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};
