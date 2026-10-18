import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { getPoster, getGenreName } from '@/hooks/useTMDB';
import { Play, Plus, Check, Star, Film, Tv } from 'lucide-react';
import type { Movie, TVShow } from '@/types';

interface PosterCardProps {
  item: Movie | TVShow;
  type: 'movie' | 'tv';
  progress?: number;
  compact?: boolean;
  resumeSeason?: number;
  resumeEpisode?: number;
}

export default function PosterCard({ item, type, progress, compact, resumeSeason, resumeEpisode }: PosterCardProps) {
  const { isWatchlisted, toggleWatchlist, setSelectedDetail, setSelectedVideo, addHistory } = useApp();
  const [imgSize, setImgSize] = useState<'w342' | 'w500'>('w342');
  const [imgFailed, setImgFailed] = useState(false);

  const title = type === 'movie' ? (item as Movie).title : (item as TVShow).name;
  const year = type === 'movie'
    ? (item as Movie).release_date?.substring(0, 4)
    : (item as TVShow).first_air_date?.substring(0, 4);
  const primaryGenre = item.genre_ids?.[0] ? getGenreName(item.genre_ids[0]) : '';
  const watchlisted = isWatchlisted(item.id, type);
  const showFallback = !item.poster_path || imgFailed;

  const handlePlay = () => {
    setSelectedVideo({
      tmdbId: item.id,
      type,
      title,
      poster_path: item.poster_path,
      season: resumeSeason,
      episode: resumeEpisode,
    });
    addHistory({
      id: item.id,
      type,
      title,
      poster_path: item.poster_path,
      watchedAt: Date.now(),
      season: resumeSeason,
      episode: resumeEpisode,
    });
  };

  const handleDetail = () => {
    setSelectedDetail({ id: item.id, type });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={title}
      className="poster-card w-full cursor-pointer group rounded-[10px] outline-none"
      style={compact ? { width: 140 } : undefined}
      onClick={handleDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDetail();
        }
      }}
    >
      <div className="relative overflow-hidden rounded-[10px] bg-[#14141f] border border-[rgba(139,92,246,0.12)]" style={{ aspectRatio: '2/3' }}>
        {!showFallback ? (
          <img
            src={getPoster(item.poster_path, imgSize)}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-400"
            onError={() => {
              if (imgSize === 'w342') {
                setImgSize('w500');
              } else {
                setImgFailed(true);
              }
            }}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-between p-4 text-center select-none"
            style={{
              background: 'radial-gradient(circle at 50% 25%, rgba(139,92,246,0.28), rgba(15,15,24,0.98) 75%)',
            }}
          >
            <div className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">
              <span>{type === 'movie' ? 'Movie' : 'Series'}</span>
              {year && <span>{year}</span>}
            </div>
            <div className="flex flex-col items-center gap-2.5 my-auto px-1">
              <div className="w-12 h-12 rounded-2xl bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.3)] flex items-center justify-center text-[#a78bfa]">
                {type === 'movie' ? <Film size={22} /> : <Tv size={22} />}
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#f1f1f4] line-clamp-3 leading-snug">
                {title}
              </p>
            </div>
            <div className="w-full text-[10px] font-medium text-[#6b7280] truncate">
              {primaryGenre || 'BlvckTV'}
            </div>
          </div>
        )}

        {/* Hover / TV focus overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,15,0.9)] via-[rgba(10,10,15,0.3)] to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-focus-within:opacity-100 transition-opacity duration-250 flex flex-col items-center justify-center gap-3">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); handlePlay(); }}
            className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.15)] backdrop-blur-md flex items-center justify-center border border-[rgba(255,255,255,0.2)] hover:scale-110 transition-transform"
          >
            <Play size={20} className="text-white ml-0.5" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              toggleWatchlist({ id: item.id, type, title, poster_path: item.poster_path, addedAt: Date.now() });
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[rgba(10,10,15,0.7)] flex items-center justify-center hover:bg-[rgba(139,92,246,0.5)] transition-colors"
          >
            {watchlisted ? <Check size={14} className="text-[#10b981]" /> : <Plus size={14} className="text-[#f1f1f4]" />}
          </button>
        </div>

        {/* Progress bar */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[rgba(255,255,255,0.1)]">
            <div className="h-full rounded-r" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)' }} />
          </div>
        )}

        {/* Rating badge */}
        {item.vote_average > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-[rgba(10,10,15,0.8)] backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <Star size={10} className="text-[#f59e0b]" />
            <span className="text-[10px] font-bold text-[#f59e0b]">{item.vote_average.toFixed(1)}</span>
          </div>
        )}

        {/* Season count badge for TV */}
        {type === 'tv' && (item as TVShow).number_of_seasons && (
          <div className="absolute bottom-2 right-2 bg-[rgba(10,10,15,0.8)] backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <span className="text-[10px] font-semibold text-[#9ca3af]">{(item as TVShow).number_of_seasons}S</span>
          </div>
        )}
      </div>

      {/* Title and metadata */}
      <div className="mt-2 px-0.5">
        <h3 className="text-[13px] font-semibold text-[#f1f1f4] truncate">{title}</h3>
        <div className="flex items-center gap-2 mt-0.5">
          {year && <span className="text-[11px] text-[#6b7280]">{year}</span>}
          {primaryGenre && <span className="text-[11px] text-[#6b7280] truncate">• {primaryGenre}</span>}
        </div>
      </div>
    </div>
  );
}
