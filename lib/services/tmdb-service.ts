import axios from "axios";
import { createTMDBClient } from "@/lib/clients/tmdb-client";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL =
  process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
}

export interface MovieDetails extends TMDBMovie {
  runtime: number;
  genres: Array<{ id: number; name: string }>;
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
  production_companies: Array<{ id: number; name: string }>;
}

// Genre mapping
export const TMDB_GENRES: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  "sci-fi": 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

// Content rating mapping
const CONTENT_RATING_ORDER: Record<string, number> = {
  G: 0,
  PG: 1,
  "PG-13": 2,
  R: 3,
  "NC-17": 4,
};

export class TMDBService {
  // create tmdb client instance
  private static client = createTMDBClient();

  // Search for movies based on criteria
  static async discoverMovies(params: {
    genres?: string[];
    excludeGenres?: string[];
    minRating?: number;
    maxRuntime?: number;
    releaseYearMin?: number;
    releaseYearMax?: number;
    page?: number;
  }): Promise<TMDBMovie[]> {
    try {
      const genreIds = params.genres
        ?.map((g) => TMDB_GENRES[g])
        .filter(Boolean)
        .join(",");
      const excludeGenreIds = params.excludeGenres
        ?.map((g) => TMDB_GENRES[g])
        .filter(Boolean)
        .join(",");

      const response = await this.client.get(`/discover/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          with_genres: genreIds,
          without_genres: excludeGenreIds,
          "vote_average.gte": params.minRating || 6.0,
          "with_runtime.lte": params.maxRuntime || 180,
          "primary_release_date.gte": params.releaseYearMin
            ? `${params.releaseYearMin}-01-01`
            : undefined,
          "primary_release_date.lte": params.releaseYearMax
            ? `${params.releaseYearMax}-12-31`
            : undefined,
          sort_by: "popularity.desc",
          page: params.page || 1,
          include_adult: false,
          language: "en-US",
        },
      });

      return response.data.results || [];
    } catch (error) {
      console.error("Error discovering movies:", error);
      throw new Error("Failed to discover movies from TMDB");
    }
  }

  // Get movie details
  static async getMovieDetails(movieId: number): Promise<MovieDetails> {
    try {
      const response = await this.client.get(`/movie/${movieId}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: "en-US",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error getting movie details:", error);
      throw new Error("Failed to get movie details from TMDB");
    }
  }

  // Get multiple movie details
  static async getMultipleMovieDetails(
    movieIds: number[]
  ): Promise<MovieDetails[]> {
    try {
      const promises = movieIds.map((id) => this.getMovieDetails(id));
      return await Promise.all(promises);
    } catch (error) {
      console.error("Error getting multiple movie details:", error);
      throw new Error("Failed to get movie details");
    }
  }

  // Search movies by text query
  static async searchMovies(
    query: string,
    page: number = 1
  ): Promise<TMDBMovie[]> {
    try {
      const response = await this.client.get(`/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          query,
          page,
          include_adult: false,
          language: "en-US",
        },
      });

      return response.data.results || [];
    } catch (error) {
      console.error("Error searching movies:", error);
      throw new Error("Failed to search movies from TMDB");
    }
  }

  // Get poster URL
  static getPosterUrl(
    posterPath: string | null,
    size: "small" | "medium" | "large" = "medium"
  ): string {
    if (!posterPath) return "/placeholder-movie.png";

    const sizes = {
      small: "w185",
      medium: "w342",
      large: "w500",
    };

    return `https://image.tmdb.org/t/p/${sizes[size]}${posterPath}`;
  }

  // Get backdrop URL
  static getBackdropUrl(backdropPath: string | null): string {
    if (!backdropPath) return "/placeholder-backdrop.png";
    return `https://image.tmdb.org/t/p/w1280${backdropPath}`;
  }

  // Convert TMDB movie to searchable text
  static movieToText(movie: MovieDetails): string {
    const genreNames = movie.genres?.map((g) => g.name).join(", ") || "";
    return `${movie.title}. ${movie.overview} Genres: ${genreNames}. ${
      movie.tagline || ""
    }`;
  }

  // Get trending movies
  static async getTrendingMovies(
    timeWindow: "day" | "week" = "week"
  ): Promise<TMDBMovie[]> {
    try {
      const response = await this.client.get(`/trending/movie/${timeWindow}`, {
        params: {
          api_key: TMDB_API_KEY,
        },
      });

      return response.data.results || [];
    } catch (error) {
      console.error("Error getting trending movies:", error);
      throw new Error("Failed to get trending movies from TMDB");
    }
  }

  // Get top rated movies
  static async getTopRatedMovies(page: number = 1): Promise<TMDBMovie[]> {
    try {
      const response = await this.client.get("/movie/top_rated", {
        params: { page, language: "en-us" },
      });

      return response.data.results || [];
    } catch (error) {
      console.error("Error getting top rated movies:", error);
      throw new Error("Failed to get top rated movies from TMDB");
    }
  }
}
