import { Film, SearchX } from 'lucide-react';

const PLACEHOLDER_KEY = 'your_tmdb_api_key_here';

function isTmdbConfigured(): boolean {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  return Boolean(key && key !== PLACEHOLDER_KEY);
}

interface MoviesEmptyStateProps {
  hasFilters: boolean;
}

export default function MoviesEmptyState({ hasFilters }: MoviesEmptyStateProps) {
  const tmdbOk = isTmdbConfigured();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {hasFilters ? (
        <SearchX size={56} className="text-[#6b7280] mb-4" style={{ opacity: 0.4 }} />
      ) : (
        <Film size={56} className="text-[#6b7280] mb-4" style={{ opacity: 0.4 }} />
      )}
      <p className="text-lg font-semibold text-[#9ca3af]">No movies found</p>
      <p className="text-sm text-[#6b7280] mt-2 max-w-sm">
        {hasFilters
          ? 'No titles match your filters. Try clearing filters or broadening your search.'
          : tmdbOk
            ? 'TMDB returned no results. Try again later or search for something else.'
            : 'Add a valid VITE_TMDB_API_KEY to your .env file to load movies from TMDB.'}
      </p>
      {!tmdbOk && (
        <a
          href="https://www.themoviedb.org/settings/api"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-xs font-semibold text-[#06b6d4] hover:text-[#8b5cf6] transition-colors"
        >
          Get a free TMDB API key →
        </a>
      )}
    </div>
  );
}
