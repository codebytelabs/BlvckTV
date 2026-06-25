import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Play, Plus, Info, Check } from 'lucide-react';
import type { Movie } from '@/types';

interface HeroBannerProps {
  movies: Movie[];
}

const HERO_BACKDROPS = ['/hero-1.jpg', '/hero-2.jpg', '/hero-3.jpg', '/hero-4.jpg'];

export default function HeroBanner({ movies }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const { setSelectedVideo, setSelectedDetail, toggleWatchlist, isWatchlisted } = useApp();

  const slides = movies.slice(0, 4).map((movie, i) => ({
    ...movie,
    backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : HERO_BACKDROPS[i],
  }));

  const nextSlide = useCallback(() => {
    setCurrent(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(nextSlide, 8000);
    return () => clearInterval(timer);
  }, [slides.length, nextSlide]);

  if (slides.length === 0) return null;

  const slide = slides[current];
  const watchlisted = isWatchlisted(slide.id, 'movie');

  return (
    <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-[24px] h-[52vw] min-h-[280px] max-h-[450px] sm:h-[450px]">
      {/* Backdrop slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-800"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img src={s.backdrop} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.7) 40%, transparent 70%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0a0a0f 0%, transparent 30%)' }} />
        </div>
      ))}

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-4 sm:p-10 z-10 w-full sm:max-w-[600px]">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>
            Featured
          </span>
          {slide.genre_ids?.slice(0, 3).map(gid => (
            <span key={gid} className="text-[11px] text-[#9ca3af] bg-[rgba(255,255,255,0.1)] px-2 py-0.5 rounded">
              {['Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 'Sci-Fi'][gid % 6]}
            </span>
          ))}
          <span className="text-[11px] text-[#6b7280]">{slide.release_date?.substring(0, 4)}</span>
          <span className="text-[11px] text-[#f59e0b]">&#9733; {slide.vote_average?.toFixed(1)}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#f1f1f4] mb-2 sm:mb-3 leading-tight">
          {slide.title}
        </h1>

        <p className="text-xs sm:text-sm text-[#9ca3af] mb-4 sm:mb-6 line-clamp-2 leading-relaxed max-sm:hidden">
          {slide.overview}
        </p>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setSelectedVideo({ tmdbId: slide.id, type: 'movie', title: slide.title })}
            className="touch-target btn-primary flex items-center gap-2 text-sm min-h-[44px] px-5"
          >
            <Play size={16} /> Play
          </button>
          <button
            onClick={() => toggleWatchlist({ id: slide.id, type: 'movie', title: slide.title, poster_path: slide.poster_path, addedAt: Date.now() })}
            className="touch-target flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e1e2d] border border-[rgba(139,92,246,0.2)] text-[#f1f1f4] text-sm font-semibold active:bg-[#2a2a3d] transition-colors min-h-[44px]"
          >
            {watchlisted ? <Check size={16} className="text-[#10b981]" /> : <Plus size={16} />}
            <span className="hidden sm:inline">{watchlisted ? 'In Watchlist' : 'Watchlist'}</span>
          </button>
          <button
            onClick={() => setSelectedDetail({ id: slide.id, type: 'movie' })}
            className="touch-target flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-[#9ca3af] text-sm font-semibold active:text-[#f1f1f4] transition-colors min-h-[44px]"
          >
            <Info size={16} /> <span className="hidden sm:inline">More Info</span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-3 sm:bottom-6 right-4 sm:right-10 flex items-center gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="touch-target h-2 rounded-full transition-all duration-300 p-2 -m-2"
            aria-label={`Go to slide ${i + 1}`}
          >
            <span
              className="block h-2 rounded-full transition-all duration-300"
              style={{
                background: i === current ? '#8b5cf6' : 'rgba(255,255,255,0.3)',
                width: i === current ? 20 : 8,
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
