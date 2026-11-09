export const GNANI_SPEECH_LANGUAGES = [
  { label: "Bengali", code: "bn-IN" },
  { label: "English (India)", code: "en-IN" },
  { label: "Gujarati", code: "gu-IN" },
  { label: "Hindi", code: "hi-IN" },
  { label: "Kannada", code: "kn-IN" },
  { label: "Malayalam", code: "ml-IN" },
  { label: "Marathi", code: "mr-IN" },
  { label: "Punjabi", code: "pa-IN" },
  { label: "Tamil", code: "ta-IN" },
  { label: "Telugu", code: "te-IN" },
] as const;

export type GnaniSpeechLanguage = (typeof GNANI_SPEECH_LANGUAGES)[number]["code"];

const legacyLanguageCodes: Record<string, GnaniSpeechLanguage> = {
  bengali: "bn-IN", english: "en-IN", gujarati: "gu-IN", hindi: "hi-IN",
  kannada: "kn-IN", malayalam: "ml-IN", marathi: "mr-IN", punjabi: "pa-IN",
  tamil: "ta-IN", telugu: "te-IN",
};

export function toGnaniLanguageCode(language: unknown): GnaniSpeechLanguage {
  const value = typeof language === "string" ? language.trim() : "";
  const code = GNANI_SPEECH_LANGUAGES.find((item) => item.code.toLowerCase() === value.toLowerCase())?.code;
  return code ?? legacyLanguageCodes[value.toLowerCase()] ?? "hi-IN";
}

export function getGnaniLanguageLabel(language: unknown): string {
  const code = toGnaniLanguageCode(language);
  return GNANI_SPEECH_LANGUAGES.find((item) => item.code === code)?.label ?? "Hindi";
}
