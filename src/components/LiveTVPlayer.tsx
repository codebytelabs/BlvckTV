import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useChannels } from '@/hooks/useChannels';
import { resolveM3u8Url } from '@/lib/m3u8Resolver';
import {
  buildLivePlayerUrl,
  discoverPathsForChannel,
  getPreferredPath,
  markPathWorking,
} from '@/lib/dlhdStreamResolver';
import { LIVE_CHANNEL_PATHS, LIVE_PATH_LABELS } from '@/lib/streamingSources';
import HlsPlayer from '@/components/HlsPlayer';
import StreamIframe from '@/components/StreamIframe';
import LivePlayerSidebar from '@/components/LivePlayerSidebar';
import { useIsMobileLayout } from '@/hooks/useMediaQuery';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { X, Monitor, Maximize, RefreshCw, Radio, List, ChevronDown } from 'lucide-react';
import type { Channel } from '@/types';
import type { SportsEvent } from '@/lib/sportsEvents';
import { resolveSportsChannel } from '@/lib/sportsChannelResolver';

type PlaybackMode = 'hls' | 'iframe';
type LiveServer = 'hls' | string;

function serverLabel(server: LiveServer): string {
  if (server === 'hls') return 'Clean · HLS (no ads)';
  return LIVE_PATH_LABELS[server] ?? server;
}

export default function LiveTVPlayer() {
  const { selectedChannel, setSelectedChannel } = useApp();
  const { channels } = useChannels();
  const isMobile = useIsMobileLayout();
  const [browseOpen, setBrowseOpen] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [m3u8Url, setM3u8Url] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<PlaybackMode>('hls');
  const [currentServer, setCurrentServer] = useState<LiveServer>('hls');
  const [availablePaths, setAvailablePaths] = useState<string[]>([...LIVE_CHANNEL_PATHS]);
  const [loading, setLoading] = useState(true);
  const loadGen = useRef(0);
  const serverMenuRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setSelectedChannel(null);
  }, [setSelectedChannel]);

  const loadChannel = useCallback(async (channelId: string, server: LiveServer, streamUrl?: string) => {
    const gen = ++loadGen.current;
    setLoading(true);
    setM3u8Url(null);
    setIframeUrl(null);

    if (server === 'hls') {
      setMode('hls');
      const stream = await resolveM3u8Url(channelId);
      if (gen !== loadGen.current) return;

      if (stream) {
        setM3u8Url(stream);
        setLoading(false);
        return;
      }

      const fallback = getPreferredPath(channelId);
      setCurrentServer(fallback);
      setIframeUrl(buildLivePlayerUrl(channelId, fallback, streamUrl));
      setMode('iframe');
      setLoading(false);
      return;
    }

    setMode('iframe');
    setIframeUrl(buildLivePlayerUrl(channelId, server, streamUrl));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedChannel) return;
    void discoverPathsForChannel(selectedChannel.id).then(paths => {
      setAvailablePaths(paths.length > 0 ? paths : [...LIVE_CHANNEL_PATHS]);
    });
  }, [selectedChannel?.id]);

  useEffect(() => {
    if (!selectedChannel) {
      setM3u8Url(null);
      setIframeUrl(null);
      setCurrentServer('hls');
      document.body.removeAttribute('data-player-open');
      return;
    }

    document.body.setAttribute('data-player-open', 'true');
    setCurrentServer('hls');
    const streamUrl = selectedChannel.streamUrl ?? channels.find(c => c.id === selectedChannel.id)?.streamUrl;
    void loadChannel(selectedChannel.id, 'hls', streamUrl);

    return () => {
      document.body.removeAttribute('data-player-open');
    };
  }, [selectedChannel?.id, selectedChannel?.streamUrl, channels, loadChannel]);

  const switchChannel = useCallback((channel: Channel) => {
    setSelectedChannel({
      id: channel.id,
      name: channel.name,
      logo: channel.logo,
      streamUrl: channel.streamUrl,
    });
  }, [setSelectedChannel]);

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
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClose]);

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

  const channelStreamUrl = selectedChannel?.streamUrl
    ?? (selectedChannel ? channels.find(c => c.id === selectedChannel.id)?.streamUrl : undefined);

  const switchServer = useCallback((server: LiveServer) => {
    if (!selectedChannel) return;
    setCurrentServer(server);
    setShowServerMenu(false);
    if (server !== 'hls') {
      markPathWorking(selectedChannel.id, server);
    }
    void loadChannel(selectedChannel.id, server, channelStreamUrl);
  }, [selectedChannel, loadChannel, channelStreamUrl]);

  const retry = useCallback(() => {
    if (selectedChannel) void loadChannel(selectedChannel.id, currentServer, channelStreamUrl);
  }, [selectedChannel, loadChannel, currentServer, channelStreamUrl]);

  const handleHlsError = useCallback(() => {
    if (!selectedChannel) return;
    const fallback = getPreferredPath(selectedChannel.id);
    setCurrentServer(fallback);
    setIframeUrl(buildLivePlayerUrl(selectedChannel.id, fallback, channelStreamUrl));
    setMode('iframe');
    setM3u8Url(null);
  }, [selectedChannel, channelStreamUrl]);

  if (!selectedChannel) return null;

  const menuServers: LiveServer[] = [
    'hls',
    ...LIVE_CHANNEL_PATHS.filter(p => availablePaths.includes(p)),
    ...LIVE_CHANNEL_PATHS.filter(p => !availablePaths.includes(p)),
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:flex-row" style={{ background: '#000' }} data-player-open="true">
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-[#0a0a0f] border-b border-[rgba(139,92,246,0.1)] shrink-0 pt-[env(safe-area-inset-top)] lg:pt-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#f1f1f4] truncate">{selectedChannel.name}</h3>
            <span className="flex items-center gap-1.5 text-[10px]">
              <span className="flex items-center gap-1 text-[#ef4444]">
                <span className="live-dot" /> LIVE
              </span>
              <span className="text-[#6b7280] truncate">
                {mode === 'hls' ? '· direct stream' : `· ${serverLabel(currentServer)}`}
              </span>
            </span>
          </div>

          <div className="relative" ref={serverMenuRef}>
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

            {showServerMenu && (
              <div className="absolute top-full right-0 mt-2 w-[min(16rem,calc(100vw-1.5rem))] rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.2)] overflow-hidden z-50 shadow-xl max-h-[50vh] overflow-y-auto">
                {menuServers.map(server => {
                  const active = currentServer === server;
                  const isRecommended = server === 'hls' || availablePaths[0] === server;
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
                        {isRecommended && !active && (
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
              className="touch-target flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[rgba(255,255,255,0.08)] text-[#f1f1f4] text-xs font-bold"
            >
              <List size={14} /> Browse
            </button>
          )}

          <button
            type="button"
            onClick={retry}
            className="touch-target w-10 h-10 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#f1f1f4] active:bg-[rgba(255,255,255,0.14)]"
            aria-label="Retry"
            title="Retry stream"
          >
            <RefreshCw size={14} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) document.documentElement.requestFullscreen();
              else document.exitFullscreen();
            }}
            className="touch-target w-10 h-10 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#f1f1f4] active:bg-[rgba(255,255,255,0.14)]"
            aria-label="Fullscreen"
          >
            <Maximize size={14} />
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="touch-target w-10 h-10 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#f1f1f4] active:bg-[rgba(239,68,68,0.25)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <div className="w-8 h-8 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
            </div>
          ) : mode === 'hls' && m3u8Url ? (
            <HlsPlayer
              src={m3u8Url}
              title={selectedChannel.name}
              onError={handleHlsError}
            />
          ) : iframeUrl ? (
            <StreamIframe src={iframeUrl} title={selectedChannel.name} variant="live" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-black px-6 text-center">
              <p className="text-sm text-[#9ca3af]">Could not load stream.</p>
              <p className="text-xs text-[#6b7280]">Try another server from the menu above.</p>
              <button
                type="button"
                onClick={retry}
                className="touch-target px-4 py-2.5 rounded-lg bg-[#8b5cf6] text-white text-xs font-bold"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:flex">
        <LivePlayerSidebar
          channels={channels}
          selectedChannelId={selectedChannel.id}
          onSelectChannel={switchChannel}
          onSelectSport={switchSport}
        />
      </div>

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
    </div>
  );
}
