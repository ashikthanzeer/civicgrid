// Web Speech API Text-to-Speech (TTS) utility supporting Indian languages
import type { SupportedLanguage } from '../i18n/types';

const LANG_VOICE_CODES: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ml: 'ml-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
};

export function speakText(
  text: string,
  lang: SupportedLanguage = 'en',
  onEnd?: () => void,
  onError?: () => void,
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis is not supported in this browser.');
    onError?.();
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_VOICE_CODES[lang] || 'en-IN';
  utterance.rate = 0.95; // Slightly slower for clarity
  utterance.pitch = 1.0;

  // Try to find a matching voice if available
  const voices = window.speechSynthesis.getVoices();
  const targetVoiceCode = LANG_VOICE_CODES[lang];
  const matchedVoice = voices.find(
    (v) => v.lang.replace('_', '-') === targetVoiceCode || v.lang.startsWith(lang),
  );
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = () => {
    onError?.();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}
