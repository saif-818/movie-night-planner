export const GENRES = [
    { id: 'action', label: 'Action', emoji: '💥' },
    { id: 'comedy', label: 'Comedy', emoji: '😂' },
    { id: 'drama', label: 'Drama', emoji: '🎭' },
    { id: 'horror', label: 'Horror', emoji: '👻' },
    { id: 'thriller', label: 'Thriller', emoji: '🔪' },
    { id: 'romance', label: 'Romance', emoji: '💕' },
    { id: 'sci-fi', label: 'Sci-Fi', emoji: '🚀' },
    { id: 'fantasy', label: 'Fantasy', emoji: '🧙' },
    { id: 'animation', label: 'Animation', emoji: '🎨' },
    { id: 'documentary', label: 'Documentary', emoji: '📽️' },
    { id: 'mystery', label: 'Mystery', emoji: '🔍' },
    { id: 'adventure', label: 'Adventure', emoji: '🗺️' },
  ] as const;
  
  export const MOODS = [
    { id: 'light-hearted', label: 'Light-Hearted', description: 'Fun and uplifting' },
    { id: 'intense', label: 'Intense', description: 'Gripping and suspenseful' },
    { id: 'emotional', label: 'Emotional', description: 'Deep and moving' },
    { id: 'mind-bending', label: 'Mind-Bending', description: 'Complex and thought-provoking' },
    { id: 'relaxing', label: 'Relaxing', description: 'Easy-going and chill' },
    { id: 'inspirational', label: 'Inspirational', description: 'Uplifting and motivating' },
  ] as const;
  
  export const CONTENT_RATINGS = [
    { id: 'G', label: 'G - General Audiences', description: 'All ages' },
    { id: 'PG', label: 'PG - Parental Guidance', description: 'Some material may not be suitable for children' },
    { id: 'PG-13', label: 'PG-13', description: 'Parents strongly cautioned' },
    { id: 'R', label: 'R - Restricted', description: '17+ or with parent' },
    { id: 'NC-17', label: 'NC-17', description: 'Adults only' },
  ] as const;
  
  export const RUNTIME_OPTIONS = [
    { id: 'short', label: 'Short (< 90 min)', maxMinutes: 90 },
    { id: 'medium', label: 'Medium (90-120 min)', maxMinutes: 120 },
    { id: 'long', label: 'Long (120-150 min)', maxMinutes: 150 },
    { id: 'epic', label: 'Epic (150+ min)', maxMinutes: 999 },
  ] as const;
  
  export interface UserPreferences {
    genres: string[];
    mood: string;
    contentRating: string;
    maxRuntime: number;
    excludeGenres: string[];
    requireSubtitles: boolean;
    mustBeOnStreaming?: string[]; // e.g., ['Netflix', 'Amazon Prime']
    yearRange?: {
      min?: number;
      max?: number;
    };
    customNotes?: string;
  }
  
  export interface AggregatedPreferences {
    commonGenres: string[];
    mostPopularMood: string;
    strictestRating: string;
    shortestRuntime: number;
    excludedGenres: string[];
    participantCount: number;
    preferencesByUser: Record<string, UserPreferences>;
  }