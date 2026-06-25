import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useTMDB, getPoster, getBackdrop, getGenreName } from '@/hooks/useTMDB';
import { getMovieEmbedUrl, getTVEmbedUrl, SOURCES } from '@/lib/streamingSources';
import { X, Play, Plus, Check, Star, Monitor, ChevronDown } from 'lucide-react';
import type { StreamingSource, Movie, TVShow, TVEpisode } from '@/types';

export default function DetailModal() {
  const { selectedDetail, setSelectedDetail, setSelectedVideo, toggleWatchlist, isWatchlisted, settings } = useApp();
  const { fetchMovieDetails, fetchTVDetails, fetchTVSeason } = useTMDB();
  const [item, setItem] = useState<Movie | TVShow | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSource, setCurrentSource] = useState<StreamingSource>((settings.sourcePriority?.[0] || 'vidsrcme') as StreamingSource);
  const [, setShowSourceMenu] = useState(false);
  void setShowSourceMenu; // suppress unused warning, used in JSX
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<TVEpisode[]>([]);
  const [showAllOverview, setShowAllOverview] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedDetail) return;
    setLoading(true);
    const load = async () => {
      if (selectedDetail.type === 'movie') {
        const data = await fetchMovieDetails(selectedDetail.id);
        if (data) setItem(data);
      } else {
        const data = await fetchTVDetails(selectedDetail.id);
        if (data) {
          setItem(data);
          // Load first season episodes
          const season = await fetchTVSeason(selectedDetail.id, 1);
          if (season?.episodes) setEpisodes(season.episodes);
        }
      }
      setLoading(false);
    };
    load();
  }, [selectedDetail, fetchMovieDetails, fetchTVDetails, fetchTVSeason]);

  useEffect(() => {
    if (selectedDetail?.type === 'tv') {
      fetchTVSeason(selectedDetail.id, selectedSeason).then(s => {
        if (s?.episodes) setEpisodes(s.episodes);
      });
    }
  }, [selectedSeason, selectedDetail, fetchTVSeason]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDetail(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setSelectedDetail]);

  const handlePlay = (season?: number, episode?: number) => {
    if (!item) return;
    const title = 'title' in item ? item.title : item.name;
    setSelectedVideo({
      tmdbId: item.id,
      type: selectedDetail?.type || 'movie',
      title,
      season,
      episode,
      imdbId: item.imdb_id,
      poster_path: item.poster_path,
    });
    setSelectedDetail(null);
  };

  const handleQuickPlay = () => {
    if (!item) return;
    const sourceUrl = selectedDetail?.type === 'movie'
      ? getMovieEmbedUrl(currentSource, item.id, item.imdb_id)
      : getTVEmbedUrl(
          currentSource,
          item.id,
          episodes[0]?.season_number,
          episodes[0]?.episode_number,
          item.imdb_id,
        );
    window.open(sourceUrl, '_blank');
  };

  if (!selectedDetail) return null;

  if (loading || !item) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4"
        style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) setSelectedDetail(null); }}
      >
        <div className="glass-modal w-full sm:w-[400px] p-8 flex flex-col items-center gap-4 rounded-t-[20px] sm:rounded-[16px] pb-[max(2rem,env(safe-area-inset-bottom))]">
          <div className="w-10 h-10 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
          <p className="text-sm text-[#9ca3af]">Loading details…</p>
          {!loading && !item && (
            <button type="button" onClick={() => setSelectedDetail(null)} className="btn-primary text-sm">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  const isMovie = selectedDetail.type === 'movie';
  const title = isMovie ? (item as Movie).title : (item as TVShow).name;
  const year = isMovie
    ? (item as Movie).release_date?.substring(0, 4)
    : (item as TVShow).first_air_date?.substring(0, 4);
  const watchlisted = isWatchlisted(item.id, selectedDetail.type);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(8px)', animation: 'modalFadeIn 300ms forwards' }}
      onClick={(e) => { if (e.target === e.currentTarget) setSelectedDetail(null); }}
    >
      <div
        ref={modalRef}
        className="glass-modal w-full sm:w-[800px] max-h-[100dvh] sm:max-h-[85vh] overflow-y-auto rounded-t-[20px] sm:rounded-[16px] overscroll-contain"
        style={{ animation: 'modalSlideIn 300ms forwards' }}
      >
        <div className="relative h-[200px] sm:h-[300px] overflow-hidden rounded-t-[20px] sm:rounded-t-[16px]">
          <img src={getBackdrop(item.backdrop_path, 'w780')} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14141f] via-[rgba(20,20,31,0.5)] to-transparent" />
          <button
            onClick={() => setSelectedDetail(null)}
            className="touch-target absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 rounded-full bg-[rgba(0,0,0,0.5)] flex items-center justify-center text-[#f1f1f4] active:bg-[rgba(0,0,0,0.7)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 sm:px-6 pb-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] -mt-12 sm:-mt-16 relative z-10">
          <div className="flex gap-3 sm:gap-5">
            <img
              src={getPoster(item.poster_path)}
              alt={title}
              className="w-[100px] h-[150px] sm:w-[140px] sm:h-[210px] rounded-lg object-cover shadow-lg shrink-0"
              style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
            />
            <div className="flex-1 pt-10 sm:pt-16 min-w-0">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#f1f1f4] mb-2 leading-tight">{title}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                {year && <span className="text-xs text-[#6b7280]">{year}</span>}
                {item.vote_average > 0 && (
                  <span className="flex items-center gap-1 text-xs text-[#f59e0b]">
                    <Star size={12} fill="#f59e0b" /> {item.vote_average.toFixed(1)}
                  </span>
                )}
                {!isMovie && (item as TVShow).number_of_seasons && (
                  <span className="text-xs text-[#9ca3af]">{(item as TVShow).number_of_seasons} Seasons</span>
                )}
                {item.genre_ids?.map(gid => (
                  <span key={gid} className="text-[10px] bg-[#1e1e2d] text-[#9ca3af] rounded px-2 py-0.5">{getGenreName(gid)}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Overview */}
          <div className="mt-5">
            <p className={`text-sm text-[#9ca3af] leading-relaxed ${showAllOverview ? '' : 'line-clamp-3'}`}>
              {item.overview || 'No description available.'}
            </p>
            {item.overview && item.overview.length > 150 && (
              <button
                onClick={() => setShowAllOverview(!showAllOverview)}
                className="text-xs text-[#8b5cf6] hover:text-[#06b6d4] mt-1"
              >
                {showAllOverview ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          {/* Source selector */}
          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b7280] mb-2">Streaming Source</p>
            <div className="flex items-center gap-2 flex-wrap">
              {SOURCES.filter(s => settings.sourcePriority?.includes(s.id) ?? true).map(source => (
                <button
                  key={source.id}
                  onClick={() => setCurrentSource(source.id)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 ${
                    currentSource === source.id
                      ? 'bg-[#8b5cf6] text-white'
                      : 'bg-[#1e1e2d] text-[#9ca3af] hover:bg-[#2a2a3d]'
                  }`}
                >
                  {source.name}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-5">
            <button
              onClick={() => handlePlay()}
              className="touch-target btn-primary flex items-center justify-center gap-2 text-sm min-h-[48px]"
            >
              <Play size={16} /> Play
            </button>
            <button
              onClick={handleQuickPlay}
              className="touch-target flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-lg bg-[#1e1e2d] border border-[rgba(139,92,246,0.2)] text-[#f1f1f4] text-sm font-semibold active:bg-[#2a2a3d] transition-colors min-h-[48px]"
            >
              <Monitor size={16} /> Open in Tab
            </button>
            <button
              onClick={() => toggleWatchlist({ id: item.id, type: selectedDetail.type, title, poster_path: item.poster_path, addedAt: Date.now() })}
              className="touch-target flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-lg bg-[#1e1e2d] border border-[rgba(139,92,246,0.2)] text-[#f1f1f4] text-sm font-semibold active:bg-[#2a2a3d] transition-colors min-h-[48px]"
            >
              {watchlisted ? <Check size={16} className="text-[#10b981]" /> : <Plus size={16} />}
              {watchlisted ? 'Watchlisted' : 'Watchlist'}
            </button>
          </div>

          {/* Season selector for TV */}
          {!isMovie && (item as TVShow).number_of_seasons && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <p className="text-sm font-bold text-[#f1f1f4]">Episodes</p>
                <div className="relative">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="appearance-none bg-[#1e1e2d] border border-[rgba(139,92,246,0.2)] text-[#f1f1f4] text-xs font-semibold rounded-lg px-3 py-2 pr-8 outline-none focus:border-[#8b5cf6] cursor-pointer"
                  >
                    {Array.from({ length: (item as TVShow).number_of_seasons || 0 }, (_, i) => i + 1).map(s => (
                      <option key={s} value={s}>Season {s}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
                </div>
              </div>

              {/* Episode list */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {episodes.map(ep => (
                  <div
                    key={ep.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1e1e2d] transition-colors group cursor-pointer"
                    onClick={() => handlePlay(ep.season_number, ep.episode_number)}
                  >
                    <div className="relative w-[120px] h-[68px] rounded-lg overflow-hidden bg-[#0a0a0f] shrink-0">
                      {ep.still_path ? (
                        <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#1e1e2d]">
                          <Play size={20} className="text-[#6b7280]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-[rgba(0,0,0,0.3)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-[rgba(139,92,246,0.8)] flex items-center justify-center">
                          <Play size={14} className="text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-[rgba(139,92,246,0.2)] text-[#8b5cf6] rounded px-1.5 py-0.5 font-bold">E{ep.episode_number}</span>
                        <h4 className="text-sm font-semibold text-[#f1f1f4] truncate">{ep.name}</h4>
                      </div>
                      <p className="text-xs text-[#6b7280] mt-1 line-clamp-1">{ep.overview}</p>
                      {ep.runtime && <span className="text-[10px] text-[#6b7280]">{ep.runtime} min</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
