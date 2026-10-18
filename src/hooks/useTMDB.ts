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
import { FALLBACK_MOVIES, FALLBACK_TV, getTmdbApiKey, isTmdbKeyConfigured } from '@/lib/catalogFallback';

const TMDB_API_KEY = getTmdbApiKey();
const TMDB_DIRECT_BASE = 'https://api.themoviedb.org/3';
const TMDB_DEV_PROXY = '/api/tmdb';
export const IMG_BASE = 'https://image.tmdb.org/t/p';

function appendKey(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}api_key=${TMDB_API_KEY}`;
}

async function fetchTMDB<T>(endpoint: string): Promise<T> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key missing.');
  }

  const pathWithKey = appendKey(endpoint);
  const urls = import.meta.env.DEV
    ? [`${TMDB_DEV_PROXY}${pathWithKey}`, `${TMDB_DIRECT_BASE}${pathWithKey}`]
    : [`${TMDB_DIRECT_BASE}${pathWithKey}`, `${TMDB_DEV_PROXY}${pathWithKey}`];

  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('TMDB authentication failed. Check that VITE_TMDB_API_KEY is valid.');
        }
        throw new Error(`TMDB Error: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('TMDB request failed');
    }
  }
  throw lastError ?? new Error('TMDB request failed');
}

type TMDBPage<T> = { results: T[]; page: number; total_pages: number; total_results: number };

const MOVIE_SORT: Record<FilterState['sortBy'], string> = {
  popularity: 'popularity.desc',
  newest: 'primary_release_date.desc',
  rating: 'vote_average.desc',
  az: 'original_title.asc',
};

const TV_SORT: Record<FilterState['sortBy'], string> = {
  popularity: 'popularity.desc',
  newest: 'first_air_date.desc',
  rating: 'vote_average.desc',
  az: 'name.asc',
};

export function sortMovies(items: Movie[], sortBy: FilterState['sortBy']): Movie[] {
  const copy = [...items];
  switch (sortBy) {
    case 'newest':
      return copy.sort((a, b) => {
        const hasA = a.poster_path ? 1 : 0;
        const hasB = b.poster_path ? 1 : 0;
        if (hasA !== hasB) return hasB - hasA;
        return (b.release_date || '').localeCompare(a.release_date || '');
      });
    case 'rating':
      return copy.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    case 'az':
      return copy.sort((a, b) => {
        const hasA = a.poster_path ? 1 : 0;
        const hasB = b.poster_path ? 1 : 0;
        if (hasA !== hasB) return hasB - hasA;
        return (a.title || '').localeCompare(b.title || '');
      });
    case 'popularity':
    default:
      return copy;
  }
}

export function sortTVShows(items: TVShow[], sortBy: FilterState['sortBy']): TVShow[] {
  const copy = [...items];
  switch (sortBy) {
    case 'newest':
      return copy.sort((a, b) => {
        const hasA = a.poster_path ? 1 : 0;
        const hasB = b.poster_path ? 1 : 0;
        if (hasA !== hasB) return hasB - hasA;
        return (b.first_air_date || '').localeCompare(a.first_air_date || '');
      });
    case 'rating':
      return copy.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    case 'az':
      return copy.sort((a, b) => {
        const hasA = a.poster_path ? 1 : 0;
        const hasB = b.poster_path ? 1 : 0;
        if (hasA !== hasB) return hasB - hasA;
        return (a.name || '').localeCompare(b.name || '');
      });
    case 'popularity':
    default:
      return copy;
  }
}

function buildDiscoverParams(
  type: 'movie' | 'tv',
  filter: FilterState,
  genreId: number | undefined,
  page: number,
): string | null {
  const hasFilters = Boolean(
    genreId ||
    filter.yearFrom ||
    filter.yearTo ||
    filter.ratingMin > 0 ||
    filter.country ||
    filter.sortBy !== 'popularity',
  );
  if (!hasFilters) return null;

  const effectiveSort =
    filter.sortBy === 'popularity' && filter.mode === 'top_rated'
      ? 'rating'
      : filter.sortBy;

  const params = new URLSearchParams({
    language: 'en-US',
    include_adult: 'false',
    page: String(page),
    sort_by: type === 'movie' ? MOVIE_SORT[effectiveSort] : TV_SORT[effectiveSort],
  });

  if (effectiveSort === 'rating' || filter.mode === 'top_rated') {
    params.set('vote_count.gte', '50');
  } else if (effectiveSort === 'newest' || effectiveSort === 'az') {
    params.set('vote_count.gte', '5');
  }

  if (genreId) params.set('with_genres', String(genreId));
  if (filter.ratingMin > 0) params.set('vote_average.gte', String(filter.ratingMin));
  if (filter.country) params.set('with_origin_country', filter.country.toUpperCase());

  const today = new Date().toISOString().slice(0, 10);

  if (type === 'movie') {
    if (filter.yearFrom) params.set('primary_release_date.gte', `${filter.yearFrom}-01-01`);
    else if (filter.mode === 'upcoming') params.set('primary_release_date.gte', today);
    if (filter.yearTo) params.set('primary_release_date.lte', `${filter.yearTo}-12-31`);
    else if (effectiveSort === 'newest' && filter.mode !== 'upcoming') {
      params.set('primary_release_date.lte', today);
    }
  } else {
    if (filter.yearFrom) params.set('first_air_date.gte', `${filter.yearFrom}-01-01`);
    if (filter.yearTo) params.set('first_air_date.lte', `${filter.yearTo}-12-31`);
    else if (effectiveSort === 'newest') {
      params.set('first_air_date.lte', today);
    }
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

function filterFallbackMoviesCatalog(filter: FilterState, genreId?: number): Movie[] {
  let list = [...FALLBACK_MOVIES];
  if (genreId) list = list.filter(m => m.genre_ids.includes(genreId));
  if (filter.ratingMin > 0) list = list.filter(m => m.vote_average >= filter.ratingMin);
  if (filter.yearFrom) {
    const from = Number(filter.yearFrom);
    if (!Number.isNaN(from)) list = list.filter(m => Number(m.release_date?.slice(0, 4) || 0) >= from);
  }
  if (filter.yearTo) {
    const to = Number(filter.yearTo);
    if (!Number.isNaN(to)) list = list.filter(m => Number(m.release_date?.slice(0, 4) || 9999) <= to);
  }
  const effectiveSort =
    filter.sortBy === 'popularity' && filter.mode === 'top_rated'
      ? 'rating'
      : filter.sortBy === 'popularity' && (filter.mode === 'now_playing' || filter.mode === 'upcoming')
        ? 'newest'
        : filter.sortBy;
  return sortMovies(list, effectiveSort);
}

function filterFallbackTVCatalog(filter: FilterState, genreId?: number): TVShow[] {
  let list = [...FALLBACK_TV];
  if (genreId) list = list.filter(t => t.genre_ids.includes(genreId));
  if (filter.ratingMin > 0) list = list.filter(t => t.vote_average >= filter.ratingMin);
  if (filter.yearFrom) {
    const from = Number(filter.yearFrom);
    if (!Number.isNaN(from)) list = list.filter(t => Number(t.first_air_date?.slice(0, 4) || 0) >= from);
  }
  if (filter.yearTo) {
    const to = Number(filter.yearTo);
    if (!Number.isNaN(to)) list = list.filter(t => Number(t.first_air_date?.slice(0, 4) || 9999) <= to);
  }
  const effectiveSort =
    filter.sortBy === 'popularity' && filter.mode === 'top_rated'
      ? 'rating'
      : filter.sortBy === 'popularity' && (filter.mode === 'on_air' || filter.mode === 'airing_today')
        ? 'newest'
        : filter.sortBy;
  return sortTVShows(list, effectiveSort);
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
    const sorted = sortMovies(data.results, filter.sortBy);
    return {
      results: sorted,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  } catch {
    const filtered = filterFallbackMoviesCatalog(filter, genreId);
    const slice = filtered.slice((page - 1) * 20, page * 20);
    return { results: slice, page, totalPages: 1, totalResults: filtered.length };
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
    const sorted = sortTVShows(data.results, filter.sortBy);
    return {
      results: sorted,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  } catch {
    const filtered = filterFallbackTVCatalog(filter, genreId);
    const slice = filtered.slice((page - 1) * 20, page * 20);
    return { results: slice, page, totalPages: 1, totalResults: filtered.length };
  }
}

export async function searchMovies(
  query: string,
  page = 1,
  sortBy: FilterState['sortBy'] = 'popularity',
): Promise<PaginatedResult<Movie>> {
  try {
    const data = await fetchTMDB<TMDBPage<Movie>>(
      `/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=${page}`,
    );
    return {
      results: sortMovies(data.results, sortBy),
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  } catch {
    const q = query.toLowerCase();
    const filtered = sortMovies(
      FALLBACK_MOVIES.filter(m => m.title.toLowerCase().includes(q)),
      sortBy,
    );
    return { results: filtered, page: 1, totalPages: 1, totalResults: filtered.length };
  }
}

export async function searchTVShows(
  query: string,
  page = 1,
  sortBy: FilterState['sortBy'] = 'popularity',
): Promise<PaginatedResult<TVShow>> {
  try {
    const data = await fetchTMDB<TMDBPage<TVShow>>(
      `/search/tv?query=${encodeURIComponent(query)}&language=en-US&page=${page}`,
    );
    return {
      results: sortTVShows(data.results, sortBy),
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    };
  } catch {
    const q = query.toLowerCase();
    const filtered = sortTVShows(
      FALLBACK_TV.filter(t => t.name.toLowerCase().includes(q)),
      sortBy,
    );
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
    wrap(
      () => fetchTMDB<Movie>(`/movie/${id}?language=en-US&append_to_response=credits`),
      () => FALLBACK_MOVIES.find(m => m.id === id) ?? {
        ...FALLBACK_MOVIES[0],
        id,
      },
    ),
  [wrap]);

  const fetchTVDetails = useCallback((id: number) =>
    wrap<TVShow>(
      async () => {
        const data = await fetchTMDB<TVShow & { external_ids?: { imdb_id?: string } }>(
          `/tv/${id}?language=en-US&append_to_response=credits,external_ids`,
        );
        return { ...data, imdb_id: data.external_ids?.imdb_id ?? data.imdb_id };
      },
      () => {
        const match = FALLBACK_TV.find(t => t.id === id) ?? { ...FALLBACK_TV[0], id };
        return { ...match, number_of_seasons: match.number_of_seasons ?? 3 };
      },
    ),
  [wrap]);

  const fetchTVSeason = useCallback((id: number, season: number) =>
    wrap(
      () => fetchTMDB<TVSeason>(`/tv/${id}/season/${season}?language=en-US`),
      () => ({
        id: id * 100 + season,
        name: `Season ${season}`,
        season_number: season,
        episode_count: 10,
        poster_path: null,
        air_date: '2024-01-01',
        episodes: Array.from({ length: 10 }, (_, idx) => ({
          id: id * 1000 + season * 100 + idx + 1,
          name: `Episode ${idx + 1}`,
          overview: `Season ${season}, Episode ${idx + 1}`,
          still_path: null,
          episode_number: idx + 1,
          season_number: season,
          air_date: '2024-01-01',
          runtime: 45,
        })),
      }),
    ),
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
