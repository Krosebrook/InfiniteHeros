
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const MAX_STORY_PAGES = 10;
export const LETTERS_PAGE = 11;
export const BACK_COVER_PAGE = 12;
export const TOTAL_PAGES = 12; 
export const INITIAL_PAGES = 2;
export const GATE_PAGE = 2;
export const BATCH_SIZE = 6;
export const DECISION_PAGES = [3, 5, 7, 9];

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
    "8-Bit Pixel Art",
    "Claymation",
    "Abstract Expressionism",
    "Chalkboard Sketch"
];

export const TONES = [
    "ACTION-HEAVY",
    "INNER-MONOLOGUE",
    "QUIPPY",
    "OPERATIC",
    "CASUAL",
    "WHOLESOME"
];

export const LANGUAGES = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'zh-CN', name: 'Chinese (China)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'ru-RU', name: 'Russian (Russia)' },
    { code: 'ko-KR', name: 'Korean (South Korea)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
    { code: 'ar-EG', name: 'Arabic (Egypt)' }
];

export interface WorldState {
    inventory: string[];
    status: string[]; // e.g., "Injured Leg", "Cursed"
    location_tags: string[];
}

export interface Bubble {
    id: string;
    text: string;
    type: 'speech' | 'thought' | 'caption' | 'sfx';
    character?: string;
    x: number; // Percent 0-100
    y: number; // Percent 0-100
}

export interface ComicFace {
  id: string;
  type: 'cover' | 'story' | 'letters' | 'back_cover';
  imageUrl?: string;
  videoUrl?: string;
  narrative?: Beat;
  choices: string[];
  resolvedChoice?: string;
  isLoading: boolean;
  isAnimating?: boolean;
  pageIndex?: number;
  isDecisionPage?: boolean;
  lettersContent?: LetterItem[];
  bubbles?: Bubble[]; 
  // Graph Fields
  parentId?: string;
  choiceLabel?: string; // The choice that led to this node from parent
}

export interface LetterItem {
  user: string;
  location: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'confused';
}

export interface Beat {
  scene: string;
  choices: string[];
  focus_char: 'hero' | 'friend' | 'villain' | 'other';
  bubbles: Bubble[]; 
  world_update?: {
      add_items?: string[];
      remove_items?: string[];
      add_status?: string[];
      remove_status?: string[];
  };
}

export interface Persona {
  base64: string;
  desc: string;
  name?: string;
  backstory?: string;
}

export interface TTSSettings {
    autoPlay: boolean;
    defaultVoice: string; // Used for 'other' or narrator
    playbackSpeed: number; // 0.5 to 2.0
}

export interface GameState {
  hero: Persona | null;
  friend: Persona | null;
  villain: Persona | null;
  comicFaces: ComicFace[];
  storyTree?: Record<string, ComicFace>; // Full history
  currentSheetIndex: number;
  isStarted: boolean;
  selectedGenre: string;
  selectedArtStyle: string;
  selectedLanguage: string;
  storyTone: string;
  timestamp: number;
  worldState: WorldState;
  ttsSettings?: TTSSettings;
}
