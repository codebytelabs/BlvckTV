import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { queryMovieCatalog, searchMovies, GENRES } from '@/hooks/useTMDB';
import PosterCard from '@/components/PosterCard';
import PosterGridSkeleton from '@/components/PosterGridSkeleton';
import TMDBErrorState from '@/components/TMDBErrorState';
import MoviesEmptyState from '@/components/MoviesEmptyState';
import CatalogFilterBar from '@/components/CatalogFilterBar';
import { Loader2 } from 'lucide-react';
import type { Movie, FilterState } from '@/types';

const DEFAULT_FILTER: FilterState = {
  mode: 'popular',
  genre: '',
  yearFrom: '',
  yearTo: '',
  ratingMin: 0,
  country: '',
  sortBy: 'popularity',
};

export default function MoviesPage() {
  const { searchQuery } = useApp();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const genreId = filter.genre ? GENRES.find(g => g.name === filter.genre)?.id : undefined;

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const result = searchQuery
        ? await searchMovies(searchQuery, pageNum)
        : await queryMovieCatalog(filter, genreId, pageNum);

      setMovies(prev => append ? [...prev, ...result.results] : result.results);
      setPage(result.page);
      setTotalPages(result.totalPages);
      setTotalResults(result.totalResults);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load movies';
      setError(message);
      if (!append) setMovies([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, filter, genreId]);

  useEffect(() => {
    setPage(1);
    void loadPage(1, false);
  }, [loadPage]);

  const hasActiveFilters = Boolean(
    filter.genre || filter.yearFrom || filter.yearTo || filter.ratingMin > 0 || filter.country || searchQuery,
  );

  const canLoadMore = page < totalPages && !loading && !loadingMore;

  return (
    <div className="space-y-6 pb-10 page-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#f1f1f4]">Movies</h1>
        {!loading && !searchQuery && (
          <span className="text-xs text-[#6b7280] tabular-nums">
            Page {page} of {totalPages}
          </span>
        )}
      </div>

      {!searchQuery && (
        <CatalogFilterBar
          type="movie"
          filter={filter}
          onChange={setFilter}
          totalResults={loading ? undefined : totalResults}
        />
      )}

      {loading && movies.length === 0 ? (
        <PosterGridSkeleton />
      ) : error && movies.length === 0 ? (
        <TMDBErrorState message={error} onRetry={() => void loadPage(1, false)} />
      ) : movies.length === 0 ? (
        <MoviesEmptyState hasFilters={hasActiveFilters} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 sm:gap-5">
            {movies.map(movie => (
              <PosterCard key={`${movie.id}-${movie.title}`} item={movie} type="movie" />
            ))}
          </div>

          {canLoadMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => void loadPage(page + 1, true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1e1e2d] border border-[rgba(139,92,246,0.25)] text-[#f1f1f4] text-sm font-semibold hover:bg-[#2a2a3d] hover:border-[#8b5cf6] transition-colors"
              >
                Load more movies
              </button>
            </div>
          )}

          {loadingMore && (
            <div className="flex justify-center py-4 text-[#8b5cf6]">
              <Loader2 size={24} className="animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
