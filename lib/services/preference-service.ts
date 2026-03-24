import { prisma } from '@/lib/db';
import { publishEvent, TOPICS } from '@/lib/kafka/producer';
import { UserPreferences, AggregatedPreferences } from '@/lib/types/preferences';

export class PreferenceService {
  // Save user preferences
  static async savePreferences(
    roomId: string,
    userId: string,
    preferences: UserPreferences
  ) {
    try {
      // Update participant with preferences
      const participant = await prisma.participant.update({
        where: {
          roomId_userId: {
            roomId,
            userId,
          },
        },
        data: {
          preferences: preferences as any,
        },
      });

      // Publish PREFERENCE_UPDATED event
      await publishEvent(TOPICS.USER_ACTIVITY, {
        type: 'PREFERENCE_UPDATED',
        roomId,
        userId,
        timestamp: Date.now(),
        data: {
          preferences,
        },
      });

      return participant;
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  // Get preferences for a specific user
  static async getUserPreferences(roomId: string, userId: string) {
    try {
      const participant = await prisma.participant.findUnique({
        where: {
          roomId_userId: {
            roomId,
            userId,
          },
        },
      });

      if (!participant || !participant.preferences) {
        return null;
      }

      return participant.preferences as unknown as UserPreferences;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  }

  // Aggregate preferences across all participants
  static async aggregatePreferences(roomId: string): Promise<AggregatedPreferences> {
    try {
      const participants = await prisma.participant.findMany({
        where: { roomId },
      });

      const participantsWithPreferences = participants.filter(
        (p) => p.preferences !== null
      );

      if (participantsWithPreferences.length === 0) {
        throw new Error('No preferences set yet');
      }

      // Extract all preferences
      const allPreferences = participantsWithPreferences.map(
        (p) => p.preferences as unknown as UserPreferences
      );

      // Count genre occurrences
      const genreCount: Record<string, number> = {};
      const moodCount: Record<string, number> = {};
      const excludedGenresSet = new Set<string>();

      allPreferences.forEach((pref) => {
        // Count genres
        pref.genres.forEach((genre) => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });

        // Count moods
        moodCount[pref.mood] = (moodCount[pref.mood] || 0) + 1;

        // Collect excluded genres
        pref.excludeGenres?.forEach((genre) => excludedGenresSet.add(genre));
      });

      // Find common genres (appears in at least 50% of preferences)
      const threshold = Math.ceil(participantsWithPreferences.length / 2);
      const commonGenres = Object.entries(genreCount)
        .filter(([_, count]) => count >= threshold)
        .sort((a, b) => b[1] - a[1])
        .map(([genre]) => genre);

      // Find most popular mood
      const mostPopularMood = Object.entries(moodCount).sort(
        (a, b) => b[1] - a[1]
      )[0][0];

      // Find strictest content rating
      const ratingOrder = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
      const strictestRating = allPreferences
        .map((p) => p.contentRating)
        .reduce((strictest, current) => {
          return ratingOrder.indexOf(current) < ratingOrder.indexOf(strictest)
            ? current
            : strictest;
        });

      // Find shortest runtime
      const shortestRuntime = Math.min(
        ...allPreferences.map((p) => p.maxRuntime)
      );

      // Build preferences by user map
      const preferencesByUser: Record<string, UserPreferences> = {};
      participantsWithPreferences.forEach((participant) => {
        preferencesByUser[participant.userId] = participant.preferences as unknown as UserPreferences;
      });

      return {
        commonGenres,
        mostPopularMood,
        strictestRating,
        shortestRuntime,
        excludedGenres: Array.from(excludedGenresSet),
        participantCount: participantsWithPreferences.length,
        preferencesByUser,
      };
    } catch (error) {
      console.error('Error aggregating preferences:', error);
      throw error;
    }
  }

  // Check if all participants have set preferences
  static async allPreferencesSet(roomId: string): Promise<boolean> {
    try {
      const participants = await prisma.participant.findMany({
        where: { roomId },
      });

      return participants.every((p) => p.preferences !== null);
    } catch (error) {
      console.error('Error checking preferences:', error);
      return false;
    }
  }

  // Get preference completion status
  static async getPreferenceStatus(roomId: string) {
    try {
      const participants = await prisma.participant.findMany({
        where: { roomId },
      });

      const total = participants.length;
      const completed = participants.filter((p) => p.preferences !== null).length;

      return {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        allComplete: completed === total && total > 0,
      };
    } catch (error) {
      console.error('Error getting preference status:', error);
      throw error;
    }
  }
}