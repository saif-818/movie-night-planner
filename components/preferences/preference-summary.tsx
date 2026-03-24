'use client';

import { AggregatedPreferences, GENRES, MOODS } from '@/lib/types/preferences';
import { Users, Heart, Star, Clock, Ban } from 'lucide-react';

interface PreferenceSummaryProps {
  aggregated: AggregatedPreferences;
}

export default function PreferenceSummary({ aggregated }: PreferenceSummaryProps) {
  const getGenreLabel = (genreId: string) => {
    return GENRES.find((g) => g.id === genreId)?.label || genreId;
  };

  const getGenreEmoji = (genreId: string) => {
    return GENRES.find((g) => g.id === genreId)?.emoji || '🎬';
  };

  const getMoodLabel = (moodId: string) => {
    return MOODS.find((m) => m.id === moodId)?.label || moodId;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
      <div className="flex items-center gap-2 mb-6">
        <Star className="w-6 h-6 text-blue-600" />
        <h3 className="text-2xl font-bold text-gray-900">Group Preferences</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Common Genres */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-pink-600" />
            <h4 className="font-semibold text-gray-900">Popular Genres</h4>
          </div>
          {aggregated.commonGenres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {aggregated.commonGenres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium"
                >
                  {getGenreEmoji(genre)} {getGenreLabel(genre)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No common genres across all participants
            </p>
          )}
        </div>

        {/* Mood */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Group Mood</h4>
          </div>
          <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium inline-block">
            {getMoodLabel(aggregated.mostPopularMood)}
          </span>
        </div>

        {/* Content Rating */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-yellow-600" />
            <h4 className="font-semibold text-gray-900">Content Rating</h4>
          </div>
          <p className="text-gray-700">
            Maximum: <span className="font-semibold">{aggregated.strictestRating}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Based on most restrictive preference
          </p>
        </div>

        {/* Runtime */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Max Runtime</h4>
          </div>
          <p className="text-gray-700">
            <span className="font-semibold">{aggregated.shortestRuntime}</span> minutes
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Based on shortest preference
          </p>
        </div>
      </div>

      {/* Excluded Genres */}
      {aggregated.excludedGenres.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Ban className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-gray-900">Excluded Genres</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {aggregated.excludedGenres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
              >
                ✗ {getGenreLabel(genre)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Participation Stats */}
      <div className="mt-6 p-4 bg-blue-100 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>{aggregated.participantCount}</strong> participant
          {aggregated.participantCount !== 1 ? 's' : ''} ha
          {aggregated.participantCount !== 1 ? 've' : 's'} set their preferences
        </p>
      </div>
    </div>
  );
}