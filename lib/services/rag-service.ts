import OpenAI from 'openai';
import { VectorService } from './vector-service';
import { TMDBService, MovieDetails } from './tmdb-service';
import { AggregatedPreferences } from '@/lib/types/preferences';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MovieSuggestion {
  movie: MovieDetails;
  reasoning: string;
  score: number;
  matchedPreferences: string[];
}

export class RAGService {
  // Generate movie suggestions using RAG
  static async generateSuggestions(
    aggregatedPrefs: AggregatedPreferences,
    count: number = 5
  ): Promise<MovieSuggestion[]> {
    try {
      console.log('🤖 Generating movie suggestions with RAG...');

      // Step 1: Create search query from preferences
      const searchQuery = this.createSearchQuery(aggregatedPrefs);
      console.log('🔍 Search query:', searchQuery);

      // Step 2: Retrieve relevant movies from vector DB
      const vectorResults = await VectorService.searchSimilarMovies(
        searchQuery,
        30 // Get more candidates than needed
      );

      console.log(`📚 Retrieved ${vectorResults.length} candidate movies from vector DB`);

      // Step 3: Get full movie details
      const movieIds = vectorResults.map((r: any) => r.metadata.movieId);
      const movieDetails = await TMDBService.getMultipleMovieDetails(movieIds);

      // Step 4: Filter movies based on hard constraints
      const filteredMovies = this.filterByConstraints(movieDetails, aggregatedPrefs);
      console.log(`✂️ Filtered to ${filteredMovies.length} movies matching constraints`);

      // Step 5: Use LLM to rank and explain recommendations
      const suggestions = await this.rankWithLLM(
        filteredMovies.slice(0, 15), // Send top 15 to LLM
        aggregatedPrefs,
        count
      );

      console.log(`✅ Generated ${suggestions.length} final suggestions`);

      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw new Error('Failed to generate movie suggestions');
    }
  }

  // Create search query from aggregated preferences
  private static createSearchQuery(prefs: AggregatedPreferences): string {
    const parts: string[] = [];

    // Add genres
    if (prefs.commonGenres.length > 0) {
      parts.push(`Genres: ${prefs.commonGenres.join(', ')}`);
    }

    // Add mood description
    const moodDescriptions: Record<string, string> = {
      'light-hearted': 'fun, uplifting, and entertaining',
      'intense': 'gripping, suspenseful, and thrilling',
      'emotional': 'deep, moving, and touching',
      'mind-bending': 'complex, thought-provoking, and clever',
      'relaxing': 'easy-going, calm, and pleasant',
      'inspirational': 'uplifting, motivating, and empowering',
    };

    parts.push(`Mood: ${moodDescriptions[prefs.mostPopularMood] || prefs.mostPopularMood}`);

    // Add exclusions
    if (prefs.excludedGenres.length > 0) {
      parts.push(`Avoid: ${prefs.excludedGenres.join(', ')}`);
    }

    return parts.join('. ');
  }

  // Filter movies by hard constraints
  private static filterByConstraints(
    movies: MovieDetails[],
    prefs: AggregatedPreferences
  ): MovieDetails[] {
    return movies.filter((movie) => {
      // Filter by runtime
      if (movie.runtime && movie.runtime > prefs.shortestRuntime) {
        return false;
      }

      // Filter by excluded genres
      const movieGenreNames = movie.genres?.map(g => g.name.toLowerCase()) || [];
      const hasExcludedGenre = prefs.excludedGenres.some(excluded =>
        movieGenreNames.includes(excluded.toLowerCase())
      );

      if (hasExcludedGenre) {
        return false;
      }

      // Filter by minimum rating (at least 6.0)
      if (movie.vote_average < 6.0) {
        return false;
      }

      return true;
    });
  }

  // Use LLM to rank movies and generate explanations
  private static async rankWithLLM(
    movies: MovieDetails[],
    prefs: AggregatedPreferences,
    topN: number
  ): Promise<MovieSuggestion[]> {
    try {
      const prompt = `You are a movie recommendation expert. Based on the following group preferences, rank these movies and explain why each would be a great choice for the group.

GROUP PREFERENCES:
- Common Genres: ${prefs.commonGenres.join(', ')}
- Mood: ${prefs.mostPopularMood}
- Max Runtime: ${prefs.shortestRuntime} minutes
- Content Rating: ${prefs.strictestRating} or below
- Excluded Genres: ${prefs.excludedGenres.join(', ') || 'None'}
- Participants: ${prefs.participantCount}

CANDIDATE MOVIES:
${movies.map((m, idx) => `${idx + 1}. "${m.title}" (${new Date(m.release_date).getFullYear()})
   - Genres: ${m.genres?.map(g => g.name).join(', ')}
   - Runtime: ${m.runtime} min
   - Rating: ${m.vote_average}/10
   - Overview: ${m.overview.slice(0, 200)}...`).join('\n\n')}

Please select the top ${topN} movies that would best satisfy this group. For each movie, provide:
1. Why it's a good match for the group's preferences
2. What specific preferences it satisfies
3. Any potential concerns or trade-offs

Return your response as a JSON array with this structure:
[
  {
    "movieTitle": "Movie Title",
    "reasoning": "Detailed explanation of why this movie is perfect for the group",
    "matchedPreferences": ["preference 1", "preference 2"],
    "score": 95
  }
]

Score should be 0-100 based on how well it matches the preferences.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert movie recommendation system. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content || '{}';
      const llmResponse = JSON.parse(content);
      
      // Handle both array and object with array responses
      const rankings = Array.isArray(llmResponse) ? llmResponse : llmResponse.suggestions || [];

      // Map LLM rankings back to movie details
      const suggestions: MovieSuggestion[] = rankings
        .map((rank: any) => {
          const movie = movies.find(m => m.title === rank.movieTitle);
          if (!movie) return null;

          return {
            movie,
            reasoning: rank.reasoning,
            score: rank.score || 0,
            matchedPreferences: rank.matchedPreferences || [],
          };
        })
        .filter((s : MovieSuggestion | null): s is MovieSuggestion => s !== null)
        .slice(0, topN);

      return suggestions;
    } catch (error) {
      console.error('Error ranking with LLM:', error);
      
      // Fallback: return movies with basic reasoning
      return movies.slice(0, topN).map((movie, idx) => ({
        movie,
        reasoning: `This ${movie.genres?.map(g => g.name).join('/')} movie matches your group's preferences for ${prefs.commonGenres.join(', ')} with a ${prefs.mostPopularMood} mood.`,
        score: 90 - (idx * 5),
        matchedPreferences: prefs.commonGenres,
      }));
    }
  }

  // Generate a single movie recommendation with explanation
  static async explainRecommendation(
    movie: MovieDetails,
    prefs: AggregatedPreferences
  ): Promise<string> {
    try {
      const prompt = `Explain why "${movie.title}" would be a great movie choice for a group with these preferences:

- Genres they enjoy: ${prefs.commonGenres.join(', ')}
- Mood: ${prefs.mostPopularMood}
- ${prefs.participantCount} participants

Movie details:
- Genres: ${movie.genres?.map(g => g.name).join(', ')}
- Overview: ${movie.overview}
- Runtime: ${movie.runtime} minutes
- Rating: ${movie.vote_average}/10

Provide a 2-3 sentence explanation that would convince the group this is a good choice.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      return response.choices[0].message.content || 'This movie matches your preferences.';
    } catch (error) {
      console.error('Error explaining recommendation:', error);
      return `This ${movie.genres?.map(g => g.name).join('/')} movie is highly rated and matches your group's taste.`;
    }
  }
}