import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useChannels, useLiveCatalog } from '@/context/LiveCatalogContext';
import { resolveM3u8Url } from '@/lib/m3u8Resolver';
import {
  discoverPathsForChannel,
  markPathWorking,
  getPreferredPath,
} from '@/lib/dlhdStreamResolver';
import { resolveLiveChannel } from '@/lib/liveChannelResolver';
import { resolveLiveIframeSrc } from '@/lib/liveIframeSrc';
import { isNativeApp } from '@/lib/nativePlatform';
import {
  LIVE_CHANNEL_PATHS,
  LIVE_PATH_LABELS,
  DEFAULT_LIVE_PATH,
  sortLivePaths,
  type LiveChannelPath,
} from '@/lib/streamingSources';
import HlsPlayer from '@/components/HlsPlayer';
import StreamIframe from '@/components/StreamIframe';
import FavoriteChannelButton from '@/components/FavoriteChannelButton';
import LivePlayerSidebar from '@/components/LivePlayerSidebar';
import { useIsMobileLayout } from '@/hooks/useMediaQuery';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { X, Monitor, Maximize, Minimize2, RefreshCw, Radio, List, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Channel } from '@/types';
import type { SportsEvent } from '@/lib/sportsEvents';
import { isM3uChannelId } from '@/lib/m3uCatalogs';
import { wrapStreamPlaybackUrl } from '@/lib/m3uApi';
import { resolveSportsChannel } from '@/lib/sportsChannelResolver';

type PlaybackMode = 'hls' | 'iframe';
type LiveServer = 'hls' | string;

function serverLabel(server: LiveServer): string {
  if (server === 'hls') return 'Clean · HLS (no ads)';
  return LIVE_PATH_LABELS[server] ?? server;
}

export default function LiveTVPlayer() {
  const { selectedChannel, setSelectedChannel, isPlayerMinimized, setIsPlayerMinimized, setCurrentPage } = useApp();
  const { channels } = useChannels();
  const { activePlaylist } = useLiveCatalog();
  const isMobile = useIsMobileLayout();
  const [browseOpen, setBrowseOpen] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [m3u8Url, setM3u8Url] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<PlaybackMode>('iframe');
  const [currentServer, setCurrentServer] = useState<LiveServer>(DEFAULT_LIVE_PATH);
  const [availablePaths, setAvailablePaths] = useState<string[]>([...LIVE_CHANNEL_PATHS]);
  const [hlsFailed, setHlsFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadGen = useRef(0);
  const serverMenuRef = useRef<HTMLDivElement>(null);
  const autoFallbackRef = useRef(true);
  const tryNextServerRef = useRef<() => void>(() => {});
  const lastWorkingRef = useRef<{ server: LiveServer; src: string } | null>(null);

  const handleClose = useCallback(() => {
    setSelectedChannel(null);
    setIsPlayerMinimized(false);
  }, [setSelectedChannel, setIsPlayerMinimized]);

  const handleMinimize = useCallback(() => {
    setIsPlayerMinimized(true);
    setCurrentPage('livetv');
  }, [setIsPlayerMinimized, setCurrentPage]);

  const loadChannel = useCallback(async (channelId: string, server: LiveServer, streamUrl?: string, provider?: Channel['provider']) => {
    const gen = ++loadGen.current;
    const isM3u = provider === 'm3u' || isM3uChannelId(channelId);
    const effectiveServer: LiveServer = isM3u || isNativeApp() ? 'hls' : server;
    setLoading(true);
    setM3u8Url(null);
    setIframeUrl(null);
    setHlsFailed(false);

    if (isM3u) {
      setMode('hls');
      const directUrl = streamUrl ? wrapStreamPlaybackUrl(streamUrl) : undefined;
      if (gen !== loadGen.current) return;
      if (directUrl) {
        setM3u8Url(directUrl);
        setLoading(false);
        return;
      }
      setHlsFailed(true);
      setLoading(false);
      return;
    }

    if (effectiveServer === 'hls') {
      setMode('hls');
      const stream = await resolveM3u8Url(channelId);
      if (gen !== loadGen.current) return;

      if (stream) {
        setM3u8Url(stream);
        setLoading(false);
        return;
      }

      setHlsFailed(true);
      setLoading(false);
      return;
    }

    setMode('iframe');
    const src = await resolveLiveIframeSrc(channelId, server);
    if (gen !== loadGen.current) return;

    setIframeUrl(src);
    setLoading(false);
  }, []);

  const activeChannelMeta = useRef<Channel | undefined>(undefined);
  activeChannelMeta.current = selectedChannel
    ? channels.find(c => c.id === selectedChannel.id)
    : undefined;

  useEffect(() => {
    if (!selectedChannel) {
      setM3u8Url(null);
      setIframeUrl(null);
      setCurrentServer(DEFAULT_LIVE_PATH);
      setMode('iframe');
      setHlsFailed(false);
      setAvailablePaths([...LIVE_CHANNEL_PATHS]);
      document.body.removeAttribute('data-player-open');
      return;
    }

    if (!isPlayerMinimized) {
      document.body.setAttribute('data-player-open', 'true');
    } else {
      document.body.removeAttribute('data-player-open');
    }
    autoFallbackRef.current = true;

    const streamUrl = selectedChannel.streamUrl ?? activeChannelMeta.current?.streamUrl;
    const provider = selectedChannel.provider ?? activeChannelMeta.current?.provider;
    const isM3u = provider === 'm3u' || isM3uChannelId(selectedChannel.id);

    const startServer = isM3u || isNativeApp() ? 'hls' : getPreferredPath(selectedChannel.id);
    setCurrentServer(startServer);
    setMode(isM3u || isNativeApp() ? 'hls' : 'iframe');
    void loadChannel(selectedChannel.id, startServer, streamUrl, provider);

    if (!isM3u) {
      void discoverPathsForChannel(selectedChannel.id).then(paths => {
        setAvailablePaths(paths.length > 0 ? paths : [...LIVE_CHANNEL_PATHS]);
      });
    } else {
      setAvailablePaths([]);
    }

    return () => {
      document.body.removeAttribute('data-player-open');
    };
  }, [selectedChannel?.id, selectedChannel?.streamUrl, selectedChannel?.provider, loadChannel, isPlayerMinimized]);

  const switchChannel = useCallback((channel: Channel) => {
    setSelectedChannel(resolveLiveChannel(channel, channels));
  }, [setSelectedChannel, channels]);

  const stepChannel = useCallback((step: number) => {
    if (!selectedChannel || channels.length === 0) return;
    const idx = channels.findIndex(c => c.id === selectedChannel.id);
    const nextIdx = idx >= 0 ? (idx + step + channels.length) % channels.length : 0;
    const nextChannel = channels[nextIdx];
    if (nextChannel) switchChannel(nextChannel);
  }, [selectedChannel, channels, switchChannel]);

  const switchSport = useCallback((event: SportsEvent) => {
    const resolved = resolveSportsChannel(
      { channelId: event.channelId, channel: event.channel, channelName: event.channelName },
      channels,
    );
    if (!resolved) return;
    setSelectedChannel(resolved);
  }, [setSelectedChannel, channels]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isPlayerMinimized) {
          handleMinimize();
        } else {
          handleClose();
        }
      }
    };
    const handleChannelStep = (e: Event) => {
      const step = (e as CustomEvent<number>).detail ?? 1;
      stepChannel(step);
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('blvcktv:channel-step', handleChannelStep);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('blvcktv:channel-step', handleChannelStep);
    };
  }, [handleClose, handleMinimize, isPlayerMinimized, stepChannel]);

  useEffect(() => {
    if (!showServerMenu) return;
    const onPointerDown = (e: MouseEvent) => {
      if (serverMenuRef.current && !serverMenuRef.current.contains(e.target as Node)) {
        setShowServerMenu(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [showServerMenu]);

  const channelStreamUrl = selectedChannel?.streamUrl ?? activeChannelMeta.current?.streamUrl;
  const channelProvider = selectedChannel?.provider ?? activeChannelMeta.current?.provider;
  const isM3uPlayback = channelProvider === 'm3u' || (selectedChannel ? isM3uChannelId(selectedChannel.id) : false);

  const switchServer = useCallback((server: LiveServer) => {
    if (!selectedChannel) return;
    autoFallbackRef.current = false;
    setCurrentServer(server);
    setShowServerMenu(false);
    if (server !== 'hls') {
      markPathWorking(selectedChannel.id, server);
    }
    void loadChannel(selectedChannel.id, server, channelStreamUrl, channelProvider);
  }, [selectedChannel, loadChannel, channelStreamUrl, channelProvider]);

  const tryNextServer = useCallback(() => {
    if (!selectedChannel || isNativeApp()) return;

    const iframePaths = sortLivePaths(availablePaths);
    const pathKey =
      currentServer !== 'hls' && iframePaths.includes(currentServer as LiveChannelPath)
        ? (currentServer as LiveChannelPath)
        : null;
    const idx = pathKey ? iframePaths.indexOf(pathKey) : -1;
    const nextIframe = idx >= 0 ? iframePaths[idx + 1] : iframePaths[0];

    if (nextIframe && currentServer !== 'hls') {
      setCurrentServer(nextIframe);
      void loadChannel(selectedChannel.id, nextIframe, channelStreamUrl, channelProvider);
      return;
    }

    if (currentServer !== 'hls') {
      setCurrentServer('hls');
      void loadChannel(selectedChannel.id, 'hls', channelStreamUrl, channelProvider);
    }
  }, [selectedChannel, availablePaths, currentServer, channelStreamUrl, channelProvider, loadChannel]);

  useEffect(() => {
    tryNextServerRef.current = tryNextServer;
  }, [tryNextServer]);

  const handleIframeLoad = useCallback(() => {
    if (iframeUrl && currentServer !== 'hls') {
      lastWorkingRef.current = { server: currentServer, src: iframeUrl };
    }
  }, [iframeUrl, currentServer]);

  const handleIframeError = useCallback(() => {
    if (!selectedChannel) return;

    if (!autoFallbackRef.current) {
      const last = lastWorkingRef.current;
      if (last && last.server !== currentServer) {
        setCurrentServer(last.server);
        setIframeUrl(last.src);
        return;
      }
      setIframeUrl(null);
      return;
    }

    tryNextServer();
  }, [selectedChannel, currentServer, tryNextServer]);

  const retry = useCallback(() => {
    if (selectedChannel) {
      autoFallbackRef.current = true;
      void loadChannel(selectedChannel.id, currentServer, channelStreamUrl, channelProvider);
    }
  }, [selectedChannel, loadChannel, currentServer, channelStreamUrl, channelProvider]);

  const handleHlsError = useCallback(() => {
    if (!selectedChannel) return;
    if (isM3uPlayback) {
      if (autoFallbackRef.current && m3u8Url) {
        autoFallbackRef.current = false;
        const proxyPrefix = '/api/m3u-stream?url=';
        if (m3u8Url.includes('/api/m3u-stream?url=')) {
          const raw = decodeURIComponent(m3u8Url.split('/api/m3u-stream?url=')[1] ?? '');
          if (raw) {
            setM3u8Url(raw);
            return;
          }
        }
        if (m3u8Url.startsWith('http')) {
          setM3u8Url(`${proxyPrefix}${encodeURIComponent(m3u8Url)}`);
          return;
        }
      }
      setHlsFailed(true);
      setM3u8Url(null);
      setMode('hls');
      return;
    }
    if (!isNativeApp() && autoFallbackRef.current) {
      autoFallbackRef.current = false;
      const fallback = availablePaths[0] ?? DEFAULT_LIVE_PATH;
      setCurrentServer(fallback);
      void loadChannel(selectedChannel.id, fallback, channelStreamUrl, channelProvider);
      return;
    }
    setHlsFailed(true);
    setM3u8Url(null);
    setMode('hls');
  }, [selectedChannel, isM3uPlayback, m3u8Url, availablePaths, channelStreamUrl, channelProvider, loadChannel]);

  if (!selectedChannel) return null;

  const menuServers: LiveServer[] = isM3uPlayback
    ? ['hls']
    : isNativeApp()
      ? ['hls']
      : [...sortLivePaths(availablePaths), 'hls'];

  const favCategory = activeChannelMeta.current?.category ?? 'Live';
  const favCountry = activeChannelMeta.current?.country ?? '—';

  const renderVideo = (compact: boolean = false) => {
    if (loading) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <div className="w-8 h-8 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
        </div>
      );
    }
    if (mode === 'hls' && m3u8Url) {
      return (
        <HlsPlayer
          src={m3u8Url}
          title={selectedChannel.name}
          onError={handleHlsError}
          headerMode={isM3uPlayback ? 'none' : 'dlhd'}
          compact={compact}
        />
      );
    }
    if (mode === 'hls' && hlsFailed) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-black px-4 text-center">
          <p className="text-xs text-[#9ca3af]">Stream unavailable for this channel.</p>
          {!compact && (
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={retry}
                className="touch-target px-4 py-2 rounded-lg bg-[#8b5cf6] text-white text-xs font-bold"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => stepChannel(1)}
                className="touch-target px-4 py-2 rounded-lg bg-[#1e1e2d] border border-[rgba(139,92,246,0.3)] text-[#f1f1f4] text-xs font-bold"
              >
                Next Channel
              </button>
            </div>
          )}
        </div>
      );
    }
    if (iframeUrl) {
      return (
        <div className={`w-full h-full ${compact ? 'pointer-events-none' : ''}`}>
          <StreamIframe
            src={iframeUrl}
            title={selectedChannel.name}
            variant="live"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      );
    }
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-black px-4 text-center">
        <p className="text-xs text-[#9ca3af]">Could not load stream.</p>
        {!compact && (
          <button
            type="button"
            onClick={retry}
            className="touch-target px-4 py-2 rounded-lg bg-[#8b5cf6] text-white text-xs font-bold mt-1"
          >
            Retry
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={
        isPlayerMinimized
          ? isMobile
            ? "fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+8px)] left-2 right-2 z-[90] rounded-xl bg-[#14141f]/95 backdrop-blur-md border border-[rgba(139,92,246,0.35)] shadow-[0_8px_30px_rgba(0,0,0,0.85)] flex items-center h-[72px] p-1.5 gap-2.5 transition-all duration-200"
            : "fixed bottom-6 right-6 z-[90] w-96 rounded-2xl bg-[#14141f]/95 backdrop-blur-md border border-[rgba(139,92,246,0.35)] shadow-[0_12px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden transition-all duration-200"
          : "fixed inset-0 z-[100] flex flex-col lg:flex-row bg-black"
      }
      data-player-open={!isPlayerMinimized}
      data-player-minimized={isPlayerMinimized}
      tabIndex={-1}
    >
      {/* Full Player Header (when expanded) */}
      {!isPlayerMinimized && (
        <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-2 bg-[#0a0a0f] border-b border-[rgba(139,92,246,0.15)] shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))] lg:pt-2 z-30">
          {/* Browse / Minimize Button */}
          <button
            type="button"
            onClick={handleMinimize}
            autoFocus
            className="touch-target flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[rgba(139,92,246,0.2)] hover:bg-[rgba(139,92,246,0.35)] border border-[rgba(139,92,246,0.4)] text-[#c4b5fd] text-xs font-bold shrink-0"
            aria-label="Browse channels and sources while playing"
            title="Browse channels & sources while playing"
          >
            <ChevronDown size={16} />
            <span>Browse</span>
          </button>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#f1f1f4] truncate">{selectedChannel.name}</h3>
            <span className="flex items-center gap-1.5 text-[10px]">
              <span className="flex items-center gap-1 text-[#ef4444]">
                <span className="live-dot" /> LIVE
              </span>
              <span className="text-[#6b7280] truncate">
                {activePlaylist?.name ? `· ${activePlaylist.name} ` : ''}
                {isM3uPlayback
                  ? '· public IPTV'
                  : mode === 'hls'
                    ? '· direct stream'
                    : `· ${serverLabel(currentServer)}`}
              </span>
            </span>
          </div>

          {/* Quick Prev / Next Channel Switchers */}
          {channels.length > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => stepChannel(-1)}
                className="touch-target w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(139,92,246,0.2)] flex items-center justify-center text-[#f1f1f4]"
                aria-label="Previous channel"
                title="Previous channel"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => stepChannel(1)}
                className="touch-target w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(139,92,246,0.2)] flex items-center justify-center text-[#f1f1f4]"
                aria-label="Next channel"
                title="Next channel"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <div className="relative" ref={serverMenuRef}>
            {!isM3uPlayback && (
              <button
                type="button"
                onClick={() => setShowServerMenu(v => !v)}
                className="touch-target flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] text-xs font-bold max-w-[140px] sm:max-w-none"
                aria-expanded={showServerMenu}
              >
                <Monitor size={14} className="shrink-0" />
                <span className="truncate">{currentServer === 'hls' ? 'Clean' : (LIVE_PATH_LABELS[currentServer] ?? currentServer)}</span>
                <ChevronDown size={12} className="shrink-0" />
              </button>
            )}

            {showServerMenu && !isM3uPlayback && (
              <div className="absolute top-full right-0 mt-2 w-[min(16rem,calc(100vw-1.5rem))] rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.2)] overflow-hidden z-50 shadow-xl max-h-[50vh] overflow-y-auto">
                {menuServers.map(server => {
                  const active = currentServer === server;
                  return (
                    <button
                      key={server}
                      type="button"
                      onClick={() => switchServer(server)}
                      className={`flex flex-col w-full px-3 py-2.5 text-left text-xs transition-colors ${
                        active
                          ? 'bg-[rgba(139,92,246,0.2)] text-[#8b5cf6]'
                          : 'text-[#9ca3af] hover:bg-[#1e1e2d] active:bg-[#1e1e2d]'
                      }`}
                    >
                      <span className="font-semibold flex items-center gap-1.5">
                        {server === 'hls' && <Radio size={12} />}
                        {serverLabel(server)}
                        {(isNativeApp() ? server === 'hls' : server === DEFAULT_LIVE_PATH) && !active && (
                          <span className="text-[9px] text-[#10b981] font-bold">REC</span>
                        )}
                      </span>
                      {server === 'hls' && (
                        <span className="text-[10px] text-[#6b7280]">Direct m3u8 · no ads</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {isMobile && (
            <button
              type="button"
              onClick={() => setBrowseOpen(true)}
              className="touch-target flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[rgba(139,92,246,0.18)] border border-[rgba(139,92,246,0.3)] text-[#c4b5fd] text-xs font-bold shrink-0"
            >
              <List size={14} /> Channels
            </button>
          )}

          <FavoriteChannelButton
            channel={{
              id: selectedChannel.id,
              name: selectedChannel.name,
              logo: selectedChannel.logo,
              category: favCategory,
              country: favCountry,
              streamUrl: selectedChannel.streamUrl,
            }}
            showLabel
            className="hidden sm:inline-flex"
          />

          <button
            type="button"
            onClick={retry}
            className="touch-target w-9 h-9 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#f1f1f4] active:bg-[rgba(255,255,255,0.14)] shrink-0"
            aria-label="Retry"
            title="Retry stream"
          >
            <RefreshCw size={14} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) void document.documentElement.requestFullscreen();
              else void document.exitFullscreen();
            }}
            className="touch-target w-9 h-9 rounded-full bg-[rgba(255,255,255,0.08)] hidden sm:flex items-center justify-center text-[#f1f1f4] active:bg-[rgba(255,255,255,0.14)] shrink-0"
            aria-label="Fullscreen"
          >
            <Maximize size={14} />
          </button>

          <button
            type="button"
            onClick={handleMinimize}
            className="touch-target w-9 h-9 rounded-full bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(139,92,246,0.25)] flex items-center justify-center text-[#f1f1f4] shrink-0"
            aria-label="Minimize player"
            title="Minimize player to browse channels & sources"
          >
            <Minimize2 size={15} />
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="touch-target w-9 h-9 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#f1f1f4] active:bg-[rgba(239,68,68,0.25)] shrink-0"
            aria-label="Close"
            title="Stop playback"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Video Viewport (ALWAYS MOUNTED — stream continues uninterrupted) */}
      <div
        className={
          isPlayerMinimized
            ? isMobile
              ? "w-[105px] h-full rounded-lg overflow-hidden shrink-0 bg-black relative shadow-inner cursor-pointer"
              : "w-full aspect-video bg-black relative group cursor-pointer overflow-hidden"
            : "flex-1 min-h-0 relative bg-black flex flex-col justify-center"
        }
        onClick={isPlayerMinimized ? () => setIsPlayerMinimized(false) : undefined}
      >
        {renderVideo(isPlayerMinimized)}

        {isPlayerMinimized && !isMobile && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-bold border border-white/10">
              <Maximize size={14} /> Tap to expand
            </span>
          </div>
        )}
      </div>

      {/* Minimized Controls / Info (only when minimized) */}
      {isPlayerMinimized && (
        isMobile ? (
          <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5 pr-1">
            <div
              className="flex-1 min-w-0 cursor-pointer select-none py-1"
              onClick={() => setIsPlayerMinimized(false)}
            >
              <div className="flex items-center gap-1.5">
                <span className="live-dot shrink-0" />
                <h4 className="text-xs font-bold text-[#f1f1f4] truncate">
                  {selectedChannel.name}
                </h4>
              </div>
              <p className="text-[10px] text-[#9ca3af] truncate mt-0.5">
                {activePlaylist?.name ?? (isM3uPlayback ? 'Live TV' : serverLabel(currentServer))}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {channels.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); stepChannel(-1); }}
                    className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(139,92,246,0.2)] flex items-center justify-center text-[#f1f1f4]"
                    title="Previous channel"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); stepChannel(1); }}
                    className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(139,92,246,0.2)] flex items-center justify-center text-[#f1f1f4]"
                    title="Next channel"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsPlayerMinimized(false)}
                className="w-8 h-8 rounded-lg bg-[rgba(139,92,246,0.2)] hover:bg-[rgba(139,92,246,0.35)] flex items-center justify-center text-[#c4b5fd]"
                title="Expand full player"
              >
                <Maximize size={15} />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-lg bg-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.3)] flex items-center justify-center text-[#fca5a5]"
                title="Stop playback"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2.5 bg-[#0a0a0f] border-t border-[rgba(139,92,246,0.15)] gap-2">
            <div
              className="flex-1 min-w-0 cursor-pointer select-none"
              onClick={() => setIsPlayerMinimized(false)}
            >
              <div className="flex items-center gap-1.5">
                <span className="live-dot shrink-0" />
                <h4 className="text-xs font-bold text-[#f1f1f4] truncate">
                  {selectedChannel.name}
                </h4>
              </div>
              <p className="text-[10px] text-[#9ca3af] truncate mt-0.5">
                {activePlaylist?.name ?? (isM3uPlayback ? 'Live TV' : serverLabel(currentServer))}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {channels.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => stepChannel(-1)}
                    className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(139,92,246,0.2)] flex items-center justify-center text-[#f1f1f4]"
                    title="Previous channel"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepChannel(1)}
                    className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(139,92,246,0.2)] flex items-center justify-center text-[#f1f1f4]"
                    title="Next channel"
                  >
                    <ChevronRight size={14} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsPlayerMinimized(false)}
                className="w-7 h-7 rounded-lg bg-[rgba(139,92,246,0.2)] hover:bg-[rgba(139,92,246,0.35)] flex items-center justify-center text-[#c4b5fd]"
                title="Expand"
              >
                <Maximize size={13} />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 rounded-lg bg-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.3)] flex items-center justify-center text-[#fca5a5]"
                title="Stop playback"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )
      )}

      {/* Full Sidebar on Desktop (hidden when minimized) */}
      {!isPlayerMinimized && !isMobile && (
        <div className="hidden lg:flex">
          <LivePlayerSidebar
            channels={channels}
            selectedChannelId={selectedChannel.id}
            onSelectChannel={switchChannel}
            onSelectSport={switchSport}
          />
        </div>
      )}

      {/* Mobile Drawer (accessible in full mode) */}
      {!isPlayerMinimized && isMobile && browseOpen && (
        <Sheet open={browseOpen} onOpenChange={setBrowseOpen}>
          <SheetContent
            side="bottom"
            className="rounded-t-[20px] border-[rgba(139,92,246,0.15)] bg-[#0a0a0f] p-0 pb-[env(safe-area-inset-bottom)] h-[75vh] max-h-[75vh]"
          >
            <SheetHeader className="px-4 py-3 border-b border-[rgba(139,92,246,0.1)]">
              <SheetTitle className="text-[#f1f1f4] text-left text-sm font-extrabold">
                Channels & Sports
              </SheetTitle>
            </SheetHeader>
            <LivePlayerSidebar
              channels={channels}
              selectedChannelId={selectedChannel.id}
              onSelectChannel={switchChannel}
              onSelectSport={switchSport}
              className="h-full min-h-0 border-0"
              onNavigate={() => setBrowseOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
