"use strict";
// backend/src/utils/language.ts
// Language detection utility using franc (simple, no API calls needed)
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLanguage = void 0;
const franc = __importStar(require("franc"));
/**
 * Detect language from text using franc library
 * Returns ISO 639-1 language code (2 letters) and confidence (0-1)
 */
const detectLanguage = async (text) => {
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
    }
    catch (error) {
        console.error('Language detection error:', error);
        return null;
    }
};
exports.detectLanguage = detectLanguage;
/**
 * Convert ISO 639-3 (3 letter) to ISO 639-1 (2 letter) codes
 */
function iso6393To1(code3) {
    const map = {
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
