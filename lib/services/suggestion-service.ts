import { prisma } from '@/lib/db';
import { publishEvent, TOPICS } from '@/lib/kafka/producer';
import { PreferenceService } from './preference-service';
import { RAGService, MovieSuggestion } from './rag-service';

export class SuggestionService {
  // Generate and save suggestions for a room
  static async generateSuggestionsForRoom(roomId: string) {
    try {
      console.log(`🎬 Generating suggestions for room: ${roomId}`);

      // Get aggregated preferences
      const aggregated = await PreferenceService.aggregatePreferences(roomId);

      // Generate suggestions using RAG
      const suggestions = await RAGService.generateSuggestions(aggregated, 5);

      // Save to database
      const suggestionRecord = await prisma.suggestion.create({
        data: {
          roomId,
          movies: suggestions as any,
        },
      });

      // Publish event
      await publishEvent(TOPICS.SUGGESTIONS, {
        type: 'SUGGESTIONS_GENERATED',
        roomId,
        timestamp: Date.now(),
        data: {
          count: suggestions.length,
          suggestionId: suggestionRecord.id,
        },
      });

      console.log(`✅ Generated ${suggestions.length} suggestions for room ${roomId}`);

      return suggestionRecord;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw new Error('Failed to generate suggestions');
    }
  }

  // Get latest suggestions for a room
  static async getLatestSuggestions(roomId: string) {
    try {
      const suggestion = await prisma.suggestion.findFirst({
        where: { roomId },
        orderBy: { generatedAt: 'desc' },
      });

      return suggestion;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  }
}