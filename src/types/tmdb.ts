
// Simplified TMDB types, expand as needed

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string; // YYYY-MM-DD
  vote_average: number; // 0-10
  genres: TMDBGenre[];
  status: string; // e.g., "Released", "Post Production"
  tagline?: string;
  imdb_id?: string;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string; // YYYY-MM-DD
  last_air_date?: string; // YYYY-MM-DD
  vote_average: number; // 0-10
  genres: TMDBGenre[];
  status: string; // e.g., "Returning Series", "Ended", "Canceled"
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TMDBSeasonBrief[];
  tagline?: string;
  episode_run_time?: number[];
}

export interface TMDBSeasonBrief {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  overview?: string;
}

export interface TMDBSeasonDetails extends TMDBSeasonBrief {
  episodes: TMDBEpisode[];
  _id: string; // internal id often used by tmdb for season
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  still_path: string | null;
  vote_average: number;
  runtime?: number | null; // in minutes
}

export type TMDBMediaResult = (TMDBMovie | TMDBTVShow) & { media_type?: 'movie' | 'tv' };

export interface TMDBMultiSearchResponse {
  page: number;
  results: TMDBMediaResult[];
  total_pages: number;
  total_results: number;
}

// For TV Show Season Details
export interface TMDBTVSeasonResponse {
  _id: string;
  air_date: string;
  episodes: TMDBEpisode[];
  name: string;
  overview: string;
  id: number; // This is the season_id NOT the show_id
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}
