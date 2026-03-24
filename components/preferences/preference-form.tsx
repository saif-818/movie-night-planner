'use client';

import { useState } from 'react';
import { UserPreferences, GENRES, MOODS, CONTENT_RATINGS, RUNTIME_OPTIONS } from '@/lib/types/preferences';
import { Check } from 'lucide-react';

interface PreferenceFormProps {
  roomId: string;
  userId: string;
  initialPreferences?: UserPreferences | null;
  onSaved?: () => void;
}

export default function PreferenceForm({
  roomId,
  userId,
  initialPreferences,
  onSaved,
}: PreferenceFormProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(
    initialPreferences || {
      genres: [],
      mood: 'light-hearted',
      contentRating: 'PG-13',
      maxRuntime: 120,
      excludeGenres: [],
      requireSubtitles: false,
      customNotes: '',
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleGenre = (genreId: string) => {
    setPreferences((prev) => ({
      ...prev,
      genres: prev.genres.includes(genreId)
        ? prev.genres.filter((g) => g !== genreId)
        : [...prev.genres, genreId],
    }));
  };

  const toggleExcludeGenre = (genreId: string) => {
    setPreferences((prev) => ({
      ...prev,
      excludeGenres: prev.excludeGenres?.includes(genreId)
        ? prev.excludeGenres.filter((g) => g !== genreId)
        : [...(prev.excludeGenres || []), genreId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    if (preferences.genres.length === 0) {
      setError('Please select at least one genre');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          preferences,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences');
      }

      if (onSaved) {
        onSaved();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Favorite Genres */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          What genres do you enjoy? <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-600 mb-4">Select all that apply</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {GENRES.map((genre) => {
            const isSelected = preferences.genres.includes(genre.id);
            const isExcluded = preferences.excludeGenres?.includes(genre.id);

            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGenre(genre.id)}
                disabled={isExcluded}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : isExcluded
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="text-2xl mb-1">{genre.emoji}</div>
                <div className="text-sm font-medium">{genre.label}</div>
                {isSelected && (
                  <Check className="w-4 h-4 mx-auto mt-1 text-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exclude Genres */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Any genres to avoid?
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Movies with these genres will be excluded
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {GENRES.map((genre) => {
            const isExcluded = preferences.excludeGenres?.includes(genre.id);
            const isSelected = preferences.genres.includes(genre.id);

            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleExcludeGenre(genre.id)}
                disabled={isSelected}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isExcluded
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : isSelected
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="text-2xl mb-1 grayscale opacity-50">
                  {genre.emoji}
                </div>
                <div className="text-sm font-medium">{genre.label}</div>
                {isExcluded && <div className="text-xs text-red-600 mt-1">✗ Excluded</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mood */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          What mood are you in? <span className="text-red-500">*</span>
        </label>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MOODS.map((mood) => {
            const isSelected = preferences.mood === mood.id;

            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => setPreferences({ ...preferences, mood: mood.id })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="font-semibold text-gray-900">{mood.label}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {mood.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Rating */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Maximum content rating <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {CONTENT_RATINGS.map((rating) => {
            const isSelected = preferences.contentRating === rating.id;

            return (
              <button
                key={rating.id}
                type="button"
                onClick={() =>
                  setPreferences({ ...preferences, contentRating: rating.id })
                }
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {rating.label}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {rating.description}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Runtime */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Maximum runtime <span className="text-red-500">*</span>
        </label>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {RUNTIME_OPTIONS.map((option) => {
            const isSelected = preferences.maxRuntime === option.maxMinutes;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  setPreferences({ ...preferences, maxRuntime: option.maxMinutes })
                }
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="font-semibold text-gray-900 text-center">
                  {option.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Any other preferences?
        </label>
        <textarea
          value={preferences.customNotes || ''}
          onChange={(e) =>
            setPreferences({ ...preferences, customNotes: e.target.value })
          }
          placeholder="E.g., Must have a happy ending, prefer movies from the 2010s, etc."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          rows={3}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || preferences.genres.length === 0}
        className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Saving...' : 'Save Preferences'}
      </button>
    </form>
  );
}