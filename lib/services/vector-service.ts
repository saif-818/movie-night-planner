import { Pinecone } from "@pinecone-database/pinecone";
import { ContentEmbedding, GoogleGenAI } from "@google/genai";
import { TMDBService, MovieDetails } from "./tmdb-service";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let pineconeClient: Pinecone | null = null;

async function getPineconeClient() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

export interface MovieVector {
  id: string;
  values: number[];
  metadata: {
    movieId: number;
    title: string;
    overview: string;
    genres: string;
    year: number;
    rating: number;
    runtime: number;
  };
}

export class VectorService {
  // Generate embedding for text using OpenAI
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: [
          {
            role: "user",
            parts: [{ text }],
          },
        ],
        config:{
            outputDimensionality: 1536,
        }
      });

      const embedding = response?.embeddings?.[0]?.values;

      if (!embedding) {
        throw new Error("No embedding returned from API");
      }

      return embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  }

  // Store movie in vector database
  static async storeMovie(movie: MovieDetails): Promise<void> {
    try {
      const client = await getPineconeClient();
      const index = client.index(process.env.PINECONE_INDEX_NAME!);

      // Generate text representation
      const text = TMDBService.movieToText(movie);

      // Generate embedding
      const embedding = await this.generateEmbedding(text);

      // Store in Pinecone
      await index.upsert({
        records: [
          {
            id: `movie-${movie.id}`,
            values: embedding,
            metadata: {
              movieId: movie.id,
              title: movie.title,
              overview: movie.overview,
              genres: movie.genres?.map((g) => g.name).join(", ") || "",
              year: new Date(movie.release_date).getFullYear(),
              rating: movie.vote_average,
              runtime: movie.runtime || 0,
            },
          },
        ],
      });

      console.log(`✅ Stored movie in vector DB: ${movie.title}`);
    } catch (error) {
      console.error("Error storing movie:", error);
      throw new Error("Failed to store movie in vector database");
    }
  }

  // Store multiple movies
  static async storeMultipleMovies(movies: MovieDetails[]): Promise<void> {
    try {
      const client = await getPineconeClient();
      const index = client.index(process.env.PINECONE_INDEX_NAME!);

      // Generate embeddings for all movies
      const vectors = await Promise.all(
        movies.map(async (movie) => {
          const text = TMDBService.movieToText(movie);
          const embedding = await this.generateEmbedding(text);

          return {
            id: `movie-${movie.id}`,
            values: embedding,
            metadata: {
              movieId: movie.id,
              title: movie.title,
              overview: movie.overview,
              genres: movie.genres?.map((g) => g.name).join(", ") || "",
              year: new Date(movie.release_date).getFullYear(),
              rating: movie.vote_average,
              runtime: movie.runtime || 0,
            },
          };
        })
      );

      // Batch upsert
      await index.upsert({ records: vectors });

      console.log(`✅ Stored ${movies.length} movies in vector DB`);
    } catch (error) {
      console.error("Error storing multiple movies:", error);
      throw new Error("Failed to store movies in vector database");
    }
  }

  // Search for similar movies using vector similarity
  static async searchSimilarMovies(
    queryText: string,
    topK: number = 20,
    filter?: any
  ): Promise<any[]> {
    try {
      const client = await getPineconeClient();
      const index = client.index(process.env.PINECONE_INDEX_NAME!);

      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(queryText);

      // Search in Pinecone
      const results = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter,
      });

      return results.matches || [];
    } catch (error) {
      console.error("Error searching similar movies:", error);
      throw new Error("Failed to search for similar movies");
    }
  }

  // Initialize vector database with popular movies
  static async initializeWithPopularMovies(count: number = 100): Promise<void> {
    try {
      console.log(`🎬 Initializing vector DB with ${count} popular movies...`);

      // Get top rated movies
      const pages = Math.ceil(count / 20);
      const allMovies: MovieDetails[] = [];

      for (let page = 1; page <= pages; page++) {
        const movies = await TMDBService.getTopRatedMovies(page);
        const movieDetails = await TMDBService.getMultipleMovieDetails(
          movies
            .slice(0, Math.min(20, count - allMovies.length))
            .map((m) => m.id)
        );
        allMovies.push(...movieDetails);

        if (allMovies.length >= count) break;
      }

      // Store in batches of 10
      for (let i = 0; i < allMovies.length; i += 10) {
        const batch = allMovies.slice(i, i + 10);
        await this.storeMultipleMovies(batch);
        console.log(
          `Progress: ${Math.min(i + 10, allMovies.length)}/${allMovies.length}`
        );
      }

      console.log(`✅ Vector DB initialized with ${allMovies.length} movies`);
    } catch (error) {
      console.error("Error initializing vector DB:", error);
      throw error;
    }
  }
}
