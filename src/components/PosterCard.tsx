import { useApp } from '@/context/AppContext';
import { getPoster } from '@/hooks/useTMDB';
import { Play, Plus, Check, Star } from 'lucide-react';
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
  const title = type === 'movie' ? (item as Movie).title : (item as TVShow).name;
  const year = type === 'movie'
    ? (item as Movie).release_date?.substring(0, 4)
    : (item as TVShow).first_air_date?.substring(0, 4);
  const watchlisted = isWatchlisted(item.id, type);

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
      className="poster-card cursor-pointer group"
      style={{ width: compact ? 140 : 180 }}
      onClick={handleDetail}
    >
      <div className="relative overflow-hidden rounded-[10px]" style={{ aspectRatio: '2/3' }}>
        <img
          src={getPoster(item.poster_path)}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-400"
          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,15,0.9)] via-[rgba(10,10,15,0.3)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex flex-col items-center justify-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); handlePlay(); }}
            className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.15)] backdrop-blur-md flex items-center justify-center border border-[rgba(255,255,255,0.2)] hover:scale-110 transition-transform"
          >
            <Play size={20} className="text-white ml-0.5" />
          </button>
          <button
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
        </div>
      </div>
    </div>
  );
}
