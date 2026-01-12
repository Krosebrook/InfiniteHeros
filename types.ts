
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const MAX_STORY_PAGES = 10;
export const LETTERS_PAGE = 11;
export const BACK_COVER_PAGE = 12;
export const TOTAL_PAGES = 12; // 0 to 12 = 13 faces.
export const INITIAL_PAGES = 2;
export const GATE_PAGE = 2;
export const BATCH_SIZE = 6;
export const DECISION_PAGES = [3, 5, 7, 9]; // Frequent decision points for a dynamic narrative

export const GENRES = ["Classic Horror", "Superhero Action", "Dark Sci-Fi", "High Fantasy", "Neon Noir Detective", "Wasteland Apocalypse", "Lighthearted Comedy", "Teen Drama / Slice of Life", "Custom"];

export const ART_STYLES = [
    "Modern American (Vibrant)",
    "Silver Age (Vintage 1960s)",
    "Golden Age (Vintage 1940s)",
    "Manga (Standard B&W)",
    "Manga (Retro 90s Anime)",
    "Franco-Belgian (Ligne Claire)",
    "European (Moebius Sci-Fi)",
    "Noir (High Contrast B&W)",
    "Pulp Magazine (Rough)",
    "Painted (Alex Ross Style)",
    "Watercolor (Dreamy)",
    "Paper Cutout (Collage)",
    "8-Bit Pixel Art"
];

export const TONES = [
    "ACTION-HEAVY (Short, punchy dialogue. Focus on kinetics.)",
    "INNER-MONOLOGUE (Heavy captions revealing thoughts.)",
    "QUIPPY (Characters use humor as a defense mechanism.)",
    "OPERATIC (Grand, dramatic declarations and high stakes.)",
    "CASUAL (Natural dialogue, focus on relationships/gossip.)",
    "WHOLESOME (Warm, gentle, optimistic.)"
];

export const LANGUAGES = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'ar-EG', name: 'Arabic (Egypt)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
    { code: 'id-ID', name: 'Indonesian (Indonesia)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'ko-KR', name: 'Korean (South Korea)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ru-RU', name: 'Russian (Russia)' },
    { code: 'ua-UA', name: 'Ukrainian (Ukraine)' },
    { code: 'vi-VN', name: 'Vietnamese (Vietnam)' },
    { code: 'zh-CN', name: 'Chinese (China)' }
];

export interface ComicFace {
  id: string;
  type: 'cover' | 'story' | 'letters' | 'back_cover';
  imageUrl?: string;
  videoUrl?: string; // New: For Veo motion comics
  narrative?: Beat;
  choices: string[];
  resolvedChoice?: string;
  isLoading: boolean;
  isAnimating?: boolean; // New: Loading state for video gen
  pageIndex?: number;
  isDecisionPage?: boolean;
  lettersContent?: LetterItem[];
}

export interface LetterItem {
  user: string;
  location: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'confused';
}

export interface Beat {
  caption?: string;
  dialogue?: string;
  scene: string;
  choices: string[];
  focus_char: 'hero' | 'friend' | 'villain' | 'other';
}

export interface Persona {
  base64: string;
  desc: string;
  name?: string;
  backstory?: string;
}

export interface GameState {
  hero: Persona | null;
  friend: Persona | null;
  villain: Persona | null;
  comicFaces: ComicFace[];
  currentSheetIndex: number;
  isStarted: boolean;
  selectedGenre: string;
  selectedArtStyle: string;
  selectedLanguage: string;
  storyTone: string;
  timestamp: number;
}
