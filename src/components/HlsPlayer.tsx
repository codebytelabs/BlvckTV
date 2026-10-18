import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';

type HlsPlayerProps = {
  src: string;
  title: string;
  onError?: () => void;
  onReady?: () => void;
  /** dlhd adds Referer/Origin headers; none for public IPTV m3u8 URLs */
  headerMode?: 'dlhd' | 'none';
};

type HlsInstance = {
  destroy: () => void;
  loadSource: (url: string) => void;
  attachMedia: (el: HTMLMediaElement) => void;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  startLoad: () => void;
  recoverMediaError: () => void;
};

declare global {
  interface Window {
    Hls?: {
      isSupported: () => boolean;
      Events: { MANIFEST_PARSED: string; ERROR: string };
      ErrorTypes: { NETWORK_ERROR: string; MEDIA_ERROR: string };
      new (config?: {
        enableWorker?: boolean;
        lowLatencyMode?: boolean;
        backBufferLength?: number;
        maxBufferLength?: number;
        maxMaxBufferLength?: number;
        xhrSetup?: (xhr: XMLHttpRequest, url: string) => void;
      }): HlsInstance;
    };
  }
}

let hlsScriptPromise: Promise<void> | null = null;

function loadHlsScript(): Promise<void> {
  if (window.Hls) return Promise.resolve();
  if (hlsScriptPromise) return hlsScriptPromise;

  hlsScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load hls.js'));
    document.head.appendChild(script);
  });

  return hlsScriptPromise;
}

export default function HlsPlayer({ src, title, onError, onReady, headerMode = 'dlhd' }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsInstance | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showUnmute, setShowUnmute] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const wakeControls = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  useEffect(() => {
    wakeControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [wakeControls]);

  const startPlayback = useCallback(async (video: HTMLVideoElement) => {
    try {
      video.muted = false;
      await video.play();
      setMuted(false);
      setShowUnmute(false);
      setPlaying(true);
      setLoading(false);
      onReady?.();
    } catch {
      try {
        video.muted = true;
        await video.play();
        setMuted(true);
        setShowUnmute(true);
        setPlaying(true);
        setLoading(false);
        onReady?.();
      } catch {
        setLoading(false);
      }
    }
  }, [onReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let cancelled = false;
    let networkRetries = 0;
    setLoading(true);
    setFailed(false);
    setPlaying(false);

    const setup = async () => {
      try {
        await loadHlsScript();
        if (cancelled || !videoRef.current) return;

        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        const Hls = window.Hls;
        if (Hls?.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 30,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            xhrSetup: (xhr) => {
              xhr.withCredentials = false;
            },
          });
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!cancelled) void startPlayback(video);
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (cancelled) return;
            const err = data as { fatal?: boolean; type?: string };
            if (!err.fatal) return;
            if (err.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 2) {
              networkRetries += 1;
              hls.startLoad();
              return;
            }
            if (err.type === Hls.ErrorTypes.MEDIA_ERROR && networkRetries < 2) {
              networkRetries += 1;
              hls.recoverMediaError();
              return;
            }
            setFailed(true);
            setLoading(false);
            onError?.();
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.addEventListener('loadedmetadata', () => {
            if (!cancelled) void startPlayback(video);
          }, { once: true });
        } else {
          setFailed(true);
          onError?.();
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
          onError?.();
        }
      }
    };

    void setup();

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {
          // ignore
        }
        hlsRef.current = null;
      }
      if (video) {
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch {
          // ignore
        }
      }
    };
  }, [src, onError, startPlayback, headerMode]);

  const togglePlay = () => {
    wakeControls();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const unmute = () => {
    wakeControls();
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    setShowUnmute(false);
    if (video.paused) void video.play();
    setPlaying(true);
  };

  const toggleMute = () => {
    wakeControls();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted) setShowUnmute(false);
  };

  const goFullscreen = () => {
    wakeControls();
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void video.requestFullscreen();
  };

  return (
    <div
      className="relative w-full h-full bg-black group select-none"
      onMouseMove={wakeControls}
      onTouchStart={wakeControls}
      onClick={wakeControls}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        title={title}
        onClick={togglePlay}
      />

      {loading && !failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 pointer-events-none">
          <Loader2 size={36} className="text-[#8b5cf6] animate-spin" />
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10 pointer-events-none">
          <p className="text-sm text-[#9ca3af]">Stream unavailable — trying fallback…</p>
        </div>
      )}

      {showUnmute && playing && !failed && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            unmute();
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-2 px-5 py-3 rounded-full bg-[rgba(139,92,246,0.92)] text-white text-sm font-bold shadow-lg hover:bg-[#7c3aed] transition-colors"
        >
          <Volume2 size={18} /> Tap to unmute
        </button>
      )}

      {/* Clean controls — visible on tap, mouse move, or D-Pad focus */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 px-4 py-3 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        <span className="flex-1 text-xs text-white/70 truncate">{title}</span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goFullscreen();
          }}
          className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25"
          aria-label="Fullscreen"
        >
          <Maximize size={16} />
        </button>
      </div>
    </div>
  );
}

