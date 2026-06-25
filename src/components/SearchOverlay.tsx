import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useChannels } from '@/hooks/useChannels';
import { useWatchChannel } from '@/hooks/useWatchChannel';
import { useTMDB, getPoster } from '@/hooks/useTMDB';
import { filterChannelsByQuery } from '@/lib/searchUtils';
import { Film, Radio, Tv, Loader2 } from 'lucide-react';
import type { Movie, TVShow } from '@/types';

const MAX_PER_SECTION = 5;

interface SearchOverlayProps {
  query: string;
  variant?: 'dropdown' | 'inline';
}

export default function SearchOverlay({ query, variant = 'dropdown' }: SearchOverlayProps) {
  const { setSelectedDetail, setIsSearchOpen } = useApp();
  const { channels } = useChannels();
  const watchChannel = useWatchChannel();
  const { searchMulti } = useTMDB();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTvShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(false);

  const channelResults = useMemo(
    () => filterChannelsByQuery(channels, query).slice(0, MAX_PER_SECTION),
    [channels, query],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      const results = await searchMulti(query);
      if (cancelled) return;
      if (results) {
        setMovies(results.filter(r => r.media_type === 'movie').slice(0, MAX_PER_SECTION) as Movie[]);
        setTvShows(results.filter(r => r.media_type === 'tv').slice(0, MAX_PER_SECTION) as TVShow[]);
      } else {
        setMovies([]);
        setTvShows([]);
      }
      setLoading(false);
    };

    void run();
    return () => { cancelled = true; };
  }, [query, searchMulti]);

  const hasResults = channelResults.length > 0 || movies.length > 0 || tvShows.length > 0;
  const showEmpty = !loading && !hasResults;

  const handleChannelClick = (channel: (typeof channelResults)[0]) => {
    watchChannel({
      id: channel.id,
      name: channel.name,
      logo: channel.logo,
      streamUrl: channel.streamUrl,
    });
    setIsSearchOpen(false);
  };

  const handleMovieClick = (movie: Movie) => {
    setSelectedDetail({ id: movie.id, type: 'movie' });
    setIsSearchOpen(false);
  };

  const handleTVClick = (show: TVShow) => {
    setSelectedDetail({ id: show.id, type: 'tv' });
    setIsSearchOpen(false);
  };

  return (
    <div
      className={
        variant === 'dropdown'
          ? 'absolute left-0 right-0 top-[calc(100%+6px)] z-[60] rounded-xl border border-[rgba(139,92,246,0.2)] bg-[#14141f] shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden'
          : 'overflow-hidden'
      }
      role="listbox"
      aria-label="Search results"
    >
      {loading && !hasResults && (
        <div className="flex items-center justify-center gap-2 py-8 text-[#9ca3af] text-sm">
          <Loader2 size={16} className="animate-spin text-[#8b5cf6]" />
          Searching…
        </div>
      )}

      {showEmpty && (
        <div className="py-8 px-4 text-center text-sm text-[#6b7280]">
          No results for &ldquo;{query}&rdquo;
        </div>
      )}

      {channelResults.length > 0 && (
        <section className="py-2">
          <div className="flex items-center gap-2 px-4 py-2">
            <Radio size={14} className="text-[#06b6d4]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Channels</span>
          </div>
          <ul>
            {channelResults.map(channel => (
              <li key={channel.id}>
                <button
                  type="button"
                  role="option"
                  onClick={() => handleChannelClick(channel)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 sm:py-2.5 text-left hover:bg-[#1e1e2d] active:bg-[#1e1e2d] transition-colors focus-visible:outline-none focus-visible:bg-[#1e1e2d] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(139,92,246,0.45)]"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#0a0a0f] border border-[rgba(139,92,246,0.15)] flex items-center justify-center shrink-0 overflow-hidden">
                    {channel.logo ? (
                      <img src={channel.logo} alt="" className="max-h-[70%] max-w-[70%] object-contain" />
                    ) : (
                      <Radio size={14} className="text-[#8b5cf6]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#f1f1f4] truncate">{channel.name}</p>
                    <p className="text-[11px] text-[#6b7280] truncate">{channel.category} · {channel.country}</p>
                  </div>
                  {channel.isLive && (
                    <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.15)]">
                      <span className="live-dot" />
                      <span className="text-[9px] font-bold text-[#ef4444] uppercase">Live</span>
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {movies.length > 0 && (
        <section className={`py-2 ${channelResults.length > 0 ? 'border-t border-[rgba(139,92,246,0.1)]' : ''}`}>
          <div className="flex items-center gap-2 px-4 py-2">
            <Film size={14} className="text-[#8b5cf6]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Movies</span>
          </div>
          <ul>
            {movies.map(movie => (
              <li key={movie.id}>
                <button
                  type="button"
                  role="option"
                  onClick={() => handleMovieClick(movie)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 sm:py-2.5 text-left hover:bg-[#1e1e2d] active:bg-[#1e1e2d] transition-colors focus-visible:outline-none focus-visible:bg-[#1e1e2d] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(139,92,246,0.45)]"
                >
                  <img
                    src={getPoster(movie.poster_path, 'w92')}
                    alt=""
                    className="w-9 h-[54px] rounded object-cover shrink-0 bg-[#0a0a0f]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#f1f1f4] truncate">{movie.title}</p>
                    {movie.release_date && (
                      <p className="text-[11px] text-[#6b7280]">{movie.release_date.substring(0, 4)}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tvShows.length > 0 && (
        <section className={`py-2 ${(channelResults.length > 0 || movies.length > 0) ? 'border-t border-[rgba(139,92,246,0.1)]' : ''}`}>
          <div className="flex items-center gap-2 px-4 py-2">
            <Tv size={14} className="text-[#8b5cf6]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">TV Shows</span>
          </div>
          <ul>
            {tvShows.map(show => (
              <li key={show.id}>
                <button
                  type="button"
                  role="option"
                  onClick={() => handleTVClick(show)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 sm:py-2.5 text-left hover:bg-[#1e1e2d] active:bg-[#1e1e2d] transition-colors focus-visible:outline-none focus-visible:bg-[#1e1e2d] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(139,92,246,0.45)]"
                >
                  <img
                    src={getPoster(show.poster_path, 'w92')}
                    alt=""
                    className="w-9 h-[54px] rounded object-cover shrink-0 bg-[#0a0a0f]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#f1f1f4] truncate">{show.name}</p>
                    {show.first_air_date && (
                      <p className="text-[11px] text-[#6b7280]">{show.first_air_date.substring(0, 4)}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {loading && hasResults && (
        <div className="flex items-center justify-center gap-2 py-2 border-t border-[rgba(139,92,246,0.1)] text-[#6b7280] text-xs">
          <Loader2 size={12} className="animate-spin" />
          Loading more…
        </div>
      )}
    </div>
  );
}
