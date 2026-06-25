import { useState, useCallback } from 'react';
import type {
  Movie,
  TVShow,
  Genre,
  TVSeason,
  PaginatedResult,
  FilterState,
  MovieCatalogMode,
  TVCatalogMode,
} from '@/types';
import { FALLBACK_MOVIES, FALLBACK_TV, isTmdbKeyConfigured } from '@/lib/catalogFallback';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_DIRECT_BASE = 'https://api.themoviedb.org/3';
const TMDB_DEV_PROXY = '/api/tmdb';
export const IMG_BASE = 'https://image.tmdb.org/t/p';

function buildTMDBUrl(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const separator = path.includes('?') ? '&' : '?';
  const pathWithKey = `${path}${separator}api_key=${TMDB_API_KEY}`;

  if (import.meta.env.DEV) {
    return `${TMDB_DEV_PROXY}${pathWithKey}`;
  }

  return `${TMDB_DIRECT_BASE}${pathWithKey}`;
}

async function fetchTMDB<T>(endpoint: string): Promise<T> {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    throw new Error(
      'TMDB API key missing. Add VITE_TMDB_API_KEY to your .env file (get a free key at themoviedb.org).',
    );
  }

  const res = await fetch(buildTMDBUrl(endpoint));
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('TMDB authentication failed. Check that VITE_TMDB_API_KEY is valid.');
    }
    throw new Error(`TMDB Error: ${res.status}`);
  }
  return res.json();
}

type TMDBPage<T> = { results: T[]; page: number; total_pages: number; total_results: number };

const MOVIE_SORT: Record<FilterState['sortBy'], string> = {
  popularity: 'popularity.desc',
  newest: 'primary_release_date.desc',
  rating: 'vote_average.desc',
  az: 'title.asc',
};

const TV_SORT: Record<FilterState['sortBy'], string> = {
  popularity: 'popularity.desc',
  newest: 'first_air_date.desc',
  rating: 'vote_average.desc',
  az: 'name.asc',
};

function buildDiscoverParams(
  type: 'movie' | 'tv',
  filter: FilterState,
  genreId: number | undefined,
  page: number,
): string | null {
  const hasFilters = Boolean(
    genreId || filter.yearFrom || filter.yearTo || filter.ratingMin > 0 || filter.country,
  );
  if (!hasFilters) return null;

  const params = new URLSearchParams({
    language: 'en-US',
    page: String(page),
    sort_by: type === 'movie' ? MOVIE_SORT[filter.sortBy] : TV_SORT[filter.sortBy],
  });

  if (genreId) params.set('with_genres', String(genreId));
  if (filter.ratingMin > 0) params.set('vote_average.gte', String(filter.ratingMin));
  if (filter.country) params.set('with_origin_country', filter.country.toUpperCase());

  if (type === 'movie') {
    if (filter.yearFrom) params.set('primary_release_date.gte', `${filter.yearFrom}-01-01`);
    if (filter.yearTo) params.set('primary_release_date.lte', `${filter.yearTo}-12-31`);
  } else {
    if (filter.yearFrom) params.set('first_air_date.gte', `${filter.yearFrom}-01-01`);
    if (filter.yearTo) params.set('first_air_date.lte', `${filter.yearTo}-12-31`);
  }

  return `/discover/${type}?${params}`;
}

function movieListEndpoint(mode: MovieCatalogMode, page: number): string {
  switch (mode) {
    case 'trending': return `/trending/movie/week?language=en-US&page=${page}`;
    case 'top_rated': return `/movie/top_rated?language=en-US&page=${page}`;
    case 'now_playing': return `/movie/now_playing?language=en-US&page=${page}`;
    case 'upcoming': return `/movie/upcoming?language=en-US&page=${page}`;
    default: return `/movie/popular?language=en-US&page=${page}`;
  }
}

function tvListEndpoint(mode: TVCatalogMode, page: number): string {
  switch (mode) {
    case 'trending': return `/trending/tv/week?language=en-US&page=${page}`;
    case 'top_rated': return `/tv/top_rated?language=en-US&page=${page}`;
    case 'on_air': return `/tv/on_the_air?language=en-US&page=${page}`;
    case 'airing_today': return `/tv/airing_today?language=en-US&page=${page}`;
    default: return `/tv/popular?language=en-US&page=${page}`;
  }
}

export async function queryMovieCatalog(
  filter: FilterState,
  genreId: number | undefined,
  page: number,
): Promise<PaginatedResult<Movie>> {
  try {
    const discover = buildDiscoverParams('movie', filter, genreId, page);
    const endpoint = discover ?? movieListEndpoint(filter.mode as MovieCatalogMode, page);
    const data = await fetchTMDB<TMDBPage<Movie>>(endpoint);
    return {
      results: data.results,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  } catch {
    const slice = FALLBACK_MOVIES.slice((page - 1) * 20, page * 20);
    return { results: slice, page, totalPages: 1, totalResults: FALLBACK_MOVIES.length };
  }
}

export async function queryTVCatalog(
  filter: FilterState,
  genreId: number | undefined,
  page: number,
): Promise<PaginatedResult<TVShow>> {
  try {
    const discover = buildDiscoverParams('tv', filter, genreId, page);
    const endpoint = discover ?? tvListEndpoint(filter.mode as TVCatalogMode, page);
    const data = await fetchTMDB<TMDBPage<TVShow>>(endpoint);
    return {
      results: data.results,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  } catch {
    const slice = FALLBACK_TV.slice((page - 1) * 20, page * 20);
    return { results: slice, page, totalPages: 1, totalResults: FALLBACK_TV.length };
  }
}

export async function searchMovies(query: string, page = 1): Promise<PaginatedResult<Movie>> {
  try {
    const data = await fetchTMDB<TMDBPage<Movie>>(
      `/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=${page}`,
    );
    return {
      results: data.results,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  } catch {
    const q = query.toLowerCase();
    const filtered = FALLBACK_MOVIES.filter(m => m.title.toLowerCase().includes(q));
    return { results: filtered, page: 1, totalPages: 1, totalResults: filtered.length };
  }
}

export async function searchTVShows(query: string, page = 1): Promise<PaginatedResult<TVShow>> {
  try {
    const data = await fetchTMDB<TMDBPage<TVShow>>(
      `/search/tv?query=${encodeURIComponent(query)}&language=en-US&page=${page}`,
    );
    return {
      results: data.results,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  } catch {
    const q = query.toLowerCase();
    const filtered = FALLBACK_TV.filter(t => t.name.toLowerCase().includes(q));
    return { results: filtered, page: 1, totalPages: 1, totalResults: filtered.length };
  }
}

export function getPoster(path: string | null, size: string = 'w342'): string {
  return path ? `${IMG_BASE}/${size}${path}` : '/logo.png';
}

export function getBackdrop(path: string | null, size: string = 'original'): string {
  return path ? `${IMG_BASE}/${size}${path}` : '/hero-1.jpg';
}

export const GENRES: Genre[] = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' }, { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' },
  { id: 10770, name: 'TV Movie' }, { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
  { id: 10759, name: 'Action & Adventure' }, { id: 10762, name: 'Kids' },
  { id: 10763, name: 'News' }, { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' }, { id: 10768, name: 'War & Politics' },
];

export const MOVIE_GENRE_IDS = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53, 10752, 37];
export const TV_GENRE_IDS = [10759, 16, 35, 80, 99, 18, 10762, 10763, 10764, 10765, 10766, 10767, 10768, 9648, 10751];

export function getGenreName(id: number): string {
  return GENRES.find(g => g.id === id)?.name || '';
}

export function isTmdbConfigured(): boolean {
  return isTmdbKeyConfigured();
}

function filterFallbackMovies(query?: string): Movie[] {
  if (!query) return [...FALLBACK_MOVIES];
  const q = query.toLowerCase();
  return FALLBACK_MOVIES.filter(m => m.title.toLowerCase().includes(q));
}

function filterFallbackTV(query?: string): TVShow[] {
  if (!query) return [...FALLBACK_TV];
  const q = query.toLowerCase();
  return FALLBACK_TV.filter(t => t.name.toLowerCase().includes(q));
}

export function useTMDB() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrap = useCallback(async <T>(fn: () => Promise<T>, fallback?: () => T): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error';
      if (fallback) {
        setError(isTmdbKeyConfigured() ? message : `${message} Showing curated catalog.`);
        return fallback();
      }
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrendingMovies = useCallback(() =>
    wrap(
      () => fetchTMDB<{ results: Movie[] }>('/trending/movie/week?language=en-US').then(r => r.results),
      () => FALLBACK_MOVIES.slice(0, 12),
    ),
  [wrap]);

  const fetchTrendingTV = useCallback(() =>
    wrap(
      () => fetchTMDB<{ results: TVShow[] }>('/trending/tv/week?language=en-US').then(r => r.results),
      () => FALLBACK_TV.slice(0, 12),
    ),
  [wrap]);

  const fetchPopularMovies = useCallback((page = 1) =>
    wrap(
      () => fetchTMDB<{ results: Movie[] }>(`/movie/popular?language=en-US&page=${page}`).then(r => r.results),
      () => FALLBACK_MOVIES,
    ),
  [wrap]);

  const fetchPopularTV = useCallback((page = 1) =>
    wrap(
      () => fetchTMDB<{ results: TVShow[] }>(`/tv/popular?language=en-US&page=${page}`).then(r => r.results),
      () => FALLBACK_TV,
    ),
  [wrap]);

  const fetchMovieDetails = useCallback((id: number) =>
    wrap(() => fetchTMDB<Movie>(`/movie/${id}?language=en-US&append_to_response=credits`)),
  [wrap]);

  const fetchTVDetails = useCallback((id: number) =>
    wrap(async () => {
      const data = await fetchTMDB<TVShow & { external_ids?: { imdb_id?: string } }>(
        `/tv/${id}?language=en-US&append_to_response=credits,external_ids`,
      );
      return { ...data, imdb_id: data.external_ids?.imdb_id ?? data.imdb_id };
    }),
  [wrap]);

  const fetchTVSeason = useCallback((id: number, season: number) =>
    wrap(() => fetchTMDB<TVSeason>(`/tv/${id}/season/${season}?language=en-US`)),
  [wrap]);

  const searchMulti = useCallback((query: string) =>
    wrap(
      () => fetchTMDB<{ results: (Movie | TVShow)[] }>(`/search/multi?query=${encodeURIComponent(query)}&language=en-US`).then(r =>
        r.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv'),
      ),
      () => [
        ...filterFallbackMovies(query).map(m => ({ ...m, media_type: 'movie' as const })),
        ...filterFallbackTV(query).map(t => ({ ...t, media_type: 'tv' as const })),
      ],
    ),
  [wrap]);

  const fetchMoviesByGenre = useCallback((genreId: number, page = 1) =>
    wrap(
      () => fetchTMDB<{ results: Movie[] }>(`/discover/movie?with_genres=${genreId}&language=en-US&page=${page}`).then(r => r.results),
      () => FALLBACK_MOVIES.filter(m => m.genre_ids.includes(genreId)),
    ),
  [wrap]);

  const fetchTVByGenre = useCallback((genreId: number, page = 1) =>
    wrap(
      () => fetchTMDB<{ results: TVShow[] }>(`/discover/tv?with_genres=${genreId}&language=en-US&page=${page}`).then(r => r.results),
      () => FALLBACK_TV.filter(t => t.genre_ids.includes(genreId)),
    ),
  [wrap]);

  return {
    loading,
    error,
    fetchTrendingMovies,
    fetchTrendingTV,
    fetchPopularMovies,
    fetchPopularTV,
    fetchMovieDetails,
    fetchTVDetails,
    fetchTVSeason,
    searchMulti,
    fetchMoviesByGenre,
    fetchTVByGenre,
    GENRES,
  };
}
