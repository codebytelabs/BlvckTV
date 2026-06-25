import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useTMDB } from '@/hooks/useTMDB';
import HeroBanner from '@/components/HeroBanner';
import Carousel from '@/components/Carousel';
import PosterCard from '@/components/PosterCard';
import TMDBErrorState from '@/components/TMDBErrorState';
import ChannelCard from '@/components/ChannelCard';
import { useChannels } from '@/hooks/useChannels';
import type { Movie, TVShow } from '@/types';

const GENRE_PILLS = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Documentary', 'Animation'];

export default function HomePage() {
  const { setCurrentPage, continueWatching, refreshContinueWatching } = useApp();
  const { fetchTrendingMovies, fetchTrendingTV, fetchPopularMovies, error } = useTMDB();
  const { liveChannels } = useChannels();
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingTV, setTrendingTV] = useState<TVShow[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    refreshContinueWatching();
  }, [refreshContinueWatching]);

  useEffect(() => {
    const load = async () => {
      setInitialLoading(true);
      const [tm, tv, pm] = await Promise.all([
        fetchTrendingMovies(),
        fetchTrendingTV(),
        fetchPopularMovies(),
      ]);
      if (tm) setTrendingMovies(tm);
      if (tv) setTrendingTV(tv);
      if (pm) setPopularMovies(pm);
      setInitialLoading(false);
    };
    load();
  }, [fetchTrendingMovies, fetchTrendingTV, fetchPopularMovies, retryCount]);

  const hasContent = trendingMovies.length > 0 || trendingTV.length > 0 || popularMovies.length > 0;
  const showError = error && !hasContent && !initialLoading;

  if (showError) {
    return (
      <div className="pb-10">
        <TMDBErrorState message={error} onRetry={() => setRetryCount(c => c + 1)} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {initialLoading && !hasContent ? (
        <div className="space-y-8">
          <div className="skeleton rounded-[24px]" style={{ height: 450 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((__, j) => (
                <div key={j} className="skeleton rounded-[10px] shrink-0" style={{ width: 180, height: 270 }} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          <HeroBanner movies={popularMovies} />

          {continueWatching.length > 0 && (
            <Carousel title="Continue Watching" action={{ label: 'See All', onClick: () => {} }}>
              {continueWatching.map(cw => (
                <div key={`${cw.type}-${cw.id}`} className="carousel-item">
                  <PosterCard
                    item={{ id: cw.id, title: cw.title, name: cw.title, poster_path: cw.poster_path, overview: '', backdrop_path: null, genre_ids: [], vote_average: 0, release_date: '', first_air_date: '' } as Movie & TVShow}
                    type={cw.type}
                    progress={cw.progress}
                    resumeSeason={cw.season}
                    resumeEpisode={cw.episode}
                  />
                </div>
              ))}
            </Carousel>
          )}

          <Carousel title="Trending Movies" action={{ label: 'See All', onClick: () => setCurrentPage('movies') }}>
            {trendingMovies.map(movie => (
              <div key={movie.id} className="carousel-item">
                <PosterCard item={movie} type="movie" />
              </div>
            ))}
          </Carousel>

          <Carousel title="Trending TV Shows" action={{ label: 'See All', onClick: () => setCurrentPage('tvshows') }}>
            {trendingTV.map(show => (
              <div key={show.id} className="carousel-item">
                <PosterCard item={show} type="tv" />
              </div>
            ))}
          </Carousel>

      <Carousel title="Live Now" action={{ label: 'Browse All', onClick: () => setCurrentPage('livetv') }}>
        {liveChannels.slice(0, 12).map(channel => (
              <div key={channel.id} className="carousel-item" style={{ width: 180 }}>
                <ChannelCard channel={channel} />
              </div>
            ))}
          </Carousel>

          <Carousel title="Recently Added" action={{ label: 'Browse', onClick: () => setCurrentPage('movies') }}>
            {popularMovies.slice(0, 12).map(movie => (
              <div key={movie.id} className="carousel-item">
                <PosterCard item={movie} type="movie" />
              </div>
            ))}
          </Carousel>

          <div>
            <h2 className="text-lg font-bold text-[#f1f1f4] mb-4 px-1">Browse by Genre</h2>
            <div className="flex items-center gap-3 flex-wrap">
              {GENRE_PILLS.map(genre => (
                <button
                  key={genre}
                  onClick={() => setCurrentPage('movies')}
                  className="px-5 py-2.5 rounded-full bg-[#1e1e2d] text-[#9ca3af] text-sm font-medium hover:bg-[rgba(139,92,246,0.2)] hover:text-[#f1f1f4] transition-all duration-200 border border-[rgba(139,92,246,0.1)]"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
