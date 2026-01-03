// backend/src/utils/language.ts
// Language detection utility using franc (simple, no API calls needed)

import * as franc from 'franc';

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
}

/**
 * Detect language from text using franc library
 * Returns ISO 639-1 language code (2 letters) and confidence (0-1)
 */
export const detectLanguage = async (text: string): Promise<LanguageDetectionResult | null> => {
  if (!text || text.trim().length < 10) {
    return null;
  }

  try {
    // franc returns ISO 639-3 codes (3 letters), we need to map to ISO 639-1 (2 letters)
    const detected = franc.franc(text, { minLength: 10 });
    
    if (!detected || detected === 'und') {
      // 'und' means undetermined
      return null;
    }

    // Map ISO 639-3 to ISO 639-1
    const iso639_1 = iso6393To1(detected);
    
    // Calculate confidence based on text length and detection certainty
    // franc.francAll gives scores, but for simplicity we'll estimate confidence
    const confidence = text.length > 100 ? 0.8 : 0.6;

    return {
      language: iso639_1,
      confidence
    };
  } catch (error) {
    console.error('Language detection error:', error);
    return null;
  }
};

/**
 * Convert ISO 639-3 (3 letter) to ISO 639-1 (2 letter) codes
 */
function iso6393To1(code3: string): string {
  const map: Record<string, string> = {
    'eng': 'en',
    'spa': 'es',
    'fra': 'fr',
    'deu': 'de',
    'ita': 'it',
    'por': 'pt',
    'rus': 'ru',
    'zho': 'zh',
    'jpn': 'ja',
    'kor': 'ko',
    'ara': 'ar',
    'hin': 'hi',
    'nld': 'nl',
    'pol': 'pl',
    'tur': 'tr',
    'ukr': 'uk',
    'swe': 'sv',
    'dan': 'da',
    'fin': 'fi',
    'nor': 'no',
    'ces': 'cs',
    'ell': 'el',
    'heb': 'he',
    'tha': 'th',
    'vie': 'vi',
    'ind': 'id',
    'ron': 'ro',
    'hun': 'hu',
    'cat': 'ca',
  };

  return map[code3] || code3.substring(0, 2); // Fallback: use first 2 chars
}
