export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  genres?: Genre[];
  runtime?: number;
  imdb_id?: string;
  media_type?: string;
  original_language?: string;
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  genres?: Genre[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  imdb_id?: string;
  media_type?: string;
}

export interface TVEpisode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  air_date: string;
  runtime?: number;
}

export interface TVSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date: string;
  episodes?: TVEpisode[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  category: string;
  country: string;
  isLive: boolean;
  streamUrl?: string;
  altPaths?: string[];
}

export interface FavoriteChannel {
  id: string;
  name: string;
  logo: string;
  category: string;
  country: string;
  streamUrl?: string;
  addedAt: number;
}

export type StreamingSource = 'vidsrcto' | 'vidking' | 'vidsync' | 'rivestream' | 'rivestreamAgg' | 'rivestreamTorrent' | 'vidsrcme';

export interface SourceConfig {
  id: StreamingSource;
  name: string;
  description: string;
  enabled: boolean;
}

export interface WatchItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  addedAt: number;
}

export interface HistoryItem {
  id: number;
  type: 'movie' | 'tv' | 'live';
  title: string;
  poster_path: string | null;
  watchedAt: number;
  progress?: number;
  season?: number;
  episode?: number;
}

export interface ContinueWatchingItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  progress: number;
  season?: number;
  episode?: number;
  updatedAt: number;
}

export type PageType = 'home' | 'movies' | 'tvshows' | 'livetv' | 'sports' | 'watchlist' | 'history' | 'settings';

export type SelectedVideo = {
  tmdbId: number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  title: string;
  imdbId?: string | null;
  poster_path?: string | null;
};

export type MovieCatalogMode = 'popular' | 'trending' | 'top_rated' | 'now_playing' | 'upcoming';
export type TVCatalogMode = 'popular' | 'trending' | 'top_rated' | 'on_air' | 'airing_today';

export interface FilterState {
  mode: MovieCatalogMode | TVCatalogMode;
  genre: string;
  yearFrom: string;
  yearTo: string;
  ratingMin: number;
  country: string;
  sortBy: 'popularity' | 'newest' | 'rating' | 'az';
}

export interface PaginatedResult<T> {
  results: T[];
  page: number;
  totalPages: number;
  totalResults: number;
}
