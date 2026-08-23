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

const LANG_KEYWORDS: Record<SupportedLanguage, string[]> = {
  en: ['english', 'en-in', 'en-gb', 'en-us'],
  hi: ['hindi', 'हिन्दी', 'hi-in', 'hi_in', 'swara', 'madhur'],
  ml: ['malayalam', 'മലയാളം', 'ml-in', 'ml_in', 'sobhit', 'midhun'],
  ta: ['tamil', 'தமிழ்', 'ta-in', 'ta_in', 'valluvar', 'pallavi'],
  te: ['telugu', 'తెలుగు', 'te-in', 'te_in', 'mohan', 'shruti'],
  kn: ['kannada', 'ಕನ್ನಡ', 'kn-in', 'kn_in', 'gagan', 'sapna'],
  mr: ['marathi', 'मराठी', 'mr-in', 'mr_in', 'aarohi', 'manohar'],
  bn: ['bengali', 'bangla', 'বাংলা', 'bn-in', 'bn_in', 'bashkar', 'tanishaa'],
};

let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  if (!cachedVoices.length) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
}

export function findVoiceForLanguage(lang: SupportedLanguage): SpeechSynthesisVoice | undefined {
  const voices = getAvailableVoices();
  const targetCode = LANG_VOICE_CODES[lang].toLowerCase();
  const keywords = LANG_KEYWORDS[lang] || [];

  // 1. Exact match on BCP-47 language tag
  let voice = voices.find((v) => v.lang.replace('_', '-').toLowerCase() === targetCode);
  if (voice) return voice;

  // 2. Prefix match on language code (e.g., 'hi', 'ml', 'ta')
  voice = voices.find((v) => v.lang.toLowerCase().startsWith(lang));
  if (voice) return voice;

  // 3. Name keyword search (e.g., voice named "Google हिन्दी" or "Microsoft Valluvar")
  voice = voices.find((v) => {
    const nameLower = v.name.toLowerCase();
    return keywords.some((kw) => nameLower.includes(kw));
  });
  if (voice) return voice;

  return undefined;
}

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

  if (!text || text.trim() === '') {
    onEnd?.();
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const targetVoiceCode = LANG_VOICE_CODES[lang] || 'en-IN';
  utterance.lang = targetVoiceCode;
  utterance.rate = 0.92; // Natural cadence for Indian speech synthesis
  utterance.pitch = 1.0;

  const matchedVoice = findVoiceForLanguage(lang);
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
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
