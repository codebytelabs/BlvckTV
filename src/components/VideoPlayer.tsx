import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useTMDB } from '@/hooks/useTMDB';
import { getMovieEmbedUrl, getTVEmbedUrl, SOURCES } from '@/lib/streamingSources';
import StreamIframe from '@/components/StreamIframe';
import { X, Monitor, ChevronDown, Subtitles, Maximize } from 'lucide-react';
import type { StreamingSource, TVEpisode, ContinueWatchingItem } from '@/types';

const selectClass =
  'appearance-none bg-[rgba(255,255,255,0.08)] border border-[rgba(139,92,246,0.15)] text-[#f1f1f4] text-xs font-semibold rounded-lg pl-3 pr-8 py-2.5 sm:py-1.5 outline-none focus:border-[#8b5cf6] cursor-pointer min-h-[44px] sm:min-h-0 max-w-[9rem] truncate';

export default function VideoPlayer() {
  const { selectedVideo, setSelectedVideo, settings, updateContinue, addHistory, showToast } = useApp();
  const { fetchTVDetails, fetchTVSeason } = useTMDB();
  const [currentSource, setCurrentSource] = useState<StreamingSource>(
    (settings.sourcePriority?.[0] || 'vidsrcme') as StreamingSource,
  );
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSubtitleUpload, setShowSubtitleUpload] = useState(false);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const [seasonCount, setSeasonCount] = useState(1);
  const [episodes, setEpisodes] = useState<TVEpisode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef(0);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTV = selectedVideo?.type === 'tv';
  const currentSeason = selectedVideo?.season ?? 1;
  const currentEpisode = selectedVideo?.episode ?? 1;

  const seasons = useMemo(
    () => Array.from({ length: seasonCount }, (_, i) => i + 1),
    [seasonCount],
  );

  const sortedEpisodes = useMemo(
    () => [...episodes].sort((a, b) => a.episode_number - b.episode_number),
    [episodes],
  );

  const watchKey = selectedVideo
    ? `${selectedVideo.tmdbId}:${selectedVideo.type}:${selectedVideo.season ?? 0}:${selectedVideo.episode ?? 0}`
    : null;

  const persistWatchState = useCallback((progress: number) => {
    if (!selectedVideo) return;

    const entry: ContinueWatchingItem = {
      id: selectedVideo.tmdbId,
      type: selectedVideo.type,
      title: selectedVideo.title,
      poster_path: selectedVideo.poster_path ?? null,
      progress: Math.min(Math.max(progress, 5), 95),
      season: selectedVideo.season,
      episode: selectedVideo.episode,
      updatedAt: Date.now(),
    };

    updateContinue(entry);
    addHistory({
      id: selectedVideo.tmdbId,
      type: selectedVideo.type,
      title: selectedVideo.title,
      poster_path: selectedVideo.poster_path ?? null,
      watchedAt: Date.now(),
      season: selectedVideo.season,
      episode: selectedVideo.episode,
      progress: entry.progress,
    });
  }, [selectedVideo, updateContinue, addHistory]);

  const embedUrl = selectedVideo?.type === 'movie'
    ? getMovieEmbedUrl(currentSource, selectedVideo.tmdbId, selectedVideo.imdbId)
    : getTVEmbedUrl(
        currentSource,
        selectedVideo?.tmdbId || 0,
        selectedVideo?.season,
        selectedVideo?.episode,
        selectedVideo?.imdbId,
      );

  useEffect(() => {
    if (selectedVideo) {
      setCurrentSource((settings.sourcePriority?.[0] || 'vidsrcme') as StreamingSource);
    }
  }, [selectedVideo, settings.sourcePriority]);

  useEffect(() => {
    if (!selectedVideo || selectedVideo.type !== 'tv') return;
    if (selectedVideo.season != null && selectedVideo.episode != null) return;

    setSelectedVideo({
      ...selectedVideo,
      season: 1,
      episode: 1,
    });
  }, [selectedVideo, setSelectedVideo]);

  useEffect(() => {
    if (!selectedVideo || selectedVideo.type !== 'tv') {
      setSeasonCount(1);
      setEpisodes([]);
      return;
    }

    let cancelled = false;
    void fetchTVDetails(selectedVideo.tmdbId).then(data => {
      if (!cancelled && data?.number_of_seasons) {
        setSeasonCount(data.number_of_seasons);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedVideo?.tmdbId, selectedVideo?.type, fetchTVDetails]);

  useEffect(() => {
    if (!selectedVideo || selectedVideo.type !== 'tv') {
      setEpisodes([]);
      return;
    }

    let cancelled = false;
    setLoadingEpisodes(true);
    void fetchTVSeason(selectedVideo.tmdbId, currentSeason).then(season => {
      if (cancelled) return;
      const list = [...(season?.episodes ?? [])].sort((a, b) => a.episode_number - b.episode_number);
      setEpisodes(list);
      setLoadingEpisodes(false);

      if (list.length === 0) return;
      const hasCurrent = list.some(ep => ep.episode_number === currentEpisode);
      if (!hasCurrent) {
        setSelectedVideo({
          ...selectedVideo,
          season: currentSeason,
          episode: list[0].episode_number,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedVideo, currentSeason, currentEpisode, fetchTVSeason, setSelectedVideo]);

  const handleSeasonChange = useCallback((season: number) => {
    if (!selectedVideo || selectedVideo.type !== 'tv') return;
    setSelectedVideo({
      ...selectedVideo,
      season,
      episode: 1,
    });
  }, [selectedVideo, setSelectedVideo]);

  const handleEpisodeChange = useCallback((episode: number) => {
    if (!selectedVideo || selectedVideo.type !== 'tv') return;
    setSelectedVideo({
      ...selectedVideo,
      season: currentSeason,
      episode,
    });
  }, [selectedVideo, currentSeason, setSelectedVideo]);

  const activeEmbedUrl = subtitleUrl
    ? `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}sub_url=${encodeURIComponent(subtitleUrl)}`
    : embedUrl;

  useEffect(() => {
    if (!selectedVideo) {
      document.body.removeAttribute('data-player-open');
      return;
    }

    document.body.setAttribute('data-player-open', 'true');
    progressRef.current = 8;
    persistWatchState(progressRef.current);

    progressInterval.current = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + 3, 95);
      persistWatchState(progressRef.current);
    }, 60000);

    return () => {
      document.body.removeAttribute('data-player-open');
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [watchKey, persistWatchState, selectedVideo]);

  const handleClose = useCallback(() => {
    if (selectedVideo) {
      persistWatchState(progressRef.current);
    }
    setSelectedVideo(null);
    setSubtitleUrl(null);
  }, [selectedVideo, setSelectedVideo, persistWatchState]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  if (!selectedVideo) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: '#000' }}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setShowControls(true)}
      data-player-open="true"
    >
      <div className="flex-1 min-h-0 relative">
        <StreamIframe src={activeEmbedUrl} title={selectedVideo.title} />

        {subtitleUrl && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-20">
            <div className="bg-black/70 px-3 py-1 rounded text-white text-xs">Subtitles active</div>
          </div>
        )}
      </div>

      <div
        className="shrink-0 flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-0 sm:h-14 bg-[#0a0a0f] border-t border-[rgba(139,92,246,0.1)] transition-opacity duration-300 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-0"
        style={{ opacity: showControls ? 1 : 0.35 }}
      >
        <div className="flex-1 min-w-0 basis-full sm:basis-auto order-first sm:order-none">
          <h3 className="text-sm font-semibold text-[#f1f1f4] truncate">{selectedVideo.title}</h3>
        </div>

        {isTV && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <select
                value={currentSeason}
                onChange={(e) => handleSeasonChange(Number(e.target.value))}
                aria-label="Season"
                className={selectClass}
              >
                {seasons.map(season => (
                  <option key={season} value={season}>
                    Season {season}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={currentEpisode}
                onChange={(e) => handleEpisodeChange(Number(e.target.value))}
                disabled={loadingEpisodes || sortedEpisodes.length === 0}
                aria-label="Episode"
                className={`${selectClass} max-w-[11rem] sm:max-w-[14rem]`}
              >
                {loadingEpisodes ? (
                  <option value={currentEpisode}>Loading…</option>
                ) : sortedEpisodes.length === 0 ? (
                  <option value={currentEpisode}>No episodes</option>
                ) : (
                  sortedEpisodes.map(ep => (
                    <option key={ep.id} value={ep.episode_number}>
                      {`E${ep.episode_number} · ${ep.name}`}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
            </div>
          </div>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSourceMenu(!showSourceMenu)}
            className="touch-target flex items-center gap-2 px-3 py-2.5 sm:py-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] text-[#f1f1f4] text-xs font-semibold active:bg-[rgba(255,255,255,0.14)] transition-colors min-h-[44px] sm:min-h-0"
          >
            <Monitor size={14} />
            {SOURCES.find(s => s.id === currentSource)?.name}
            <ChevronDown size={12} />
          </button>
          {showSourceMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-[min(16rem,calc(100vw-1.5rem))] rounded-lg bg-[#14141f] border border-[rgba(139,92,246,0.2)] overflow-hidden z-50 shadow-xl max-h-[50vh] overflow-y-auto">
              {SOURCES.filter(s => settings.sourcePriority?.includes(s.id) ?? true).map(source => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => {
                    setCurrentSource(source.id);
                    setShowSourceMenu(false);
                    showToast(`Switched to ${source.name}`, 'info');
                  }}
                  className={`flex flex-col w-full px-3 py-2.5 text-left text-xs transition-colors ${
                    currentSource === source.id
                      ? 'bg-[rgba(139,92,246,0.2)] text-[#8b5cf6]'
                      : 'text-[#9ca3af] hover:bg-[#1e1e2d]'
                  }`}
                >
                  <span className="font-semibold">{source.name}</span>
                  <span className="text-[10px] text-[#6b7280]">{source.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowSubtitleUpload(!showSubtitleUpload)}
          className="touch-target flex items-center gap-1.5 px-3 py-2.5 sm:py-1.5 rounded-lg bg-[rgba(255,255,255,0.08)] text-[#f1f1f4] text-xs font-semibold active:bg-[rgba(255,255,255,0.14)] min-h-[44px] sm:min-h-0"
        >
          <Subtitles size={14} /> CC
        </button>

        <button
          type="button"
          onClick={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
          }}
          className="touch-target w-11 h-11 sm:w-8 sm:h-8 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#f1f1f4] active:bg-[rgba(255,255,255,0.14)]"
          aria-label="Fullscreen"
        >
          <Maximize size={14} />
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="touch-target w-11 h-11 sm:w-8 sm:h-8 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#f1f1f4] active:bg-[rgba(239,68,68,0.25)]"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {showSubtitleUpload && (
        <div className="absolute bottom-[calc(4.5rem+env(safe-area-inset-bottom))] sm:bottom-16 inset-x-3 sm:inset-x-auto sm:right-4 w-auto sm:w-80 rounded-lg glass-modal p-4 z-50 border border-[rgba(139,92,246,0.2)]">
          <h4 className="text-sm font-semibold text-[#f1f1f4] mb-2">Subtitles</h4>
          <p className="text-xs text-[#6b7280] mb-3">Paste a direct .vtt or .srt URL</p>
          <input
            type="text"
            placeholder="https://example.com/subtitle.vtt"
            onChange={(e) => {
              if (e.target.value) {
                setSubtitleUrl(e.target.value);
                showToast('Subtitle URL loaded', 'success');
              }
            }}
            className="w-full h-9 px-3 rounded-lg bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-xs text-[#f1f1f4] placeholder-[#6b7280] outline-none focus:border-[#8b5cf6]"
          />
          <button
            type="button"
            onClick={() => setShowSubtitleUpload(false)}
            className="mt-2 text-xs text-[#8b5cf6] hover:text-[#06b6d4]"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
