import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';

type HlsPlayerProps = {
  src: string;
  title: string;
  onError?: () => void;
  onReady?: () => void;
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
        xhrSetup?: (xhr: XMLHttpRequest) => void;
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

export default function HlsPlayer({ src, title, onError, onReady }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showUnmute, setShowUnmute] = useState(true);
  const [failed, setFailed] = useState(false);

  const startPlayback = useCallback(async (video: HTMLVideoElement) => {
    try {
      video.muted = true;
      await video.play();
      setPlaying(true);
      setLoading(false);
      onReady?.();
    } catch {
      setLoading(false);
    }
  }, [onReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let cancelled = false;
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
            lowLatencyMode: true,
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
            if (err.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
              return;
            }
            if (err.type === Hls.ErrorTypes.MEDIA_ERROR) {
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
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src, onError, startPlayback]);

  const togglePlay = () => {
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
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    setShowUnmute(false);
    if (video.paused) void video.play();
    setPlaying(true);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted) setShowUnmute(false);
  };

  const goFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else void video.requestFullscreen();
  };

  return (
    <div className="relative w-full h-full bg-black group">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        muted
        title={title}
      />

      {loading && !failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <Loader2 size={36} className="text-[#8b5cf6] animate-spin" />
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <p className="text-sm text-[#9ca3af]">Stream unavailable — trying fallback…</p>
        </div>
      )}

      {showUnmute && playing && !failed && (
        <button
          type="button"
          onClick={unmute}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-2 px-5 py-3 rounded-full bg-[rgba(139,92,246,0.92)] text-white text-sm font-bold shadow-lg hover:bg-[#7c3aed] transition-colors"
        >
          <Volume2 size={18} /> Tap to unmute
        </button>
      )}

      {/* Clean controls — no third-party overlays */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 px-4 py-3 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={toggleMute}
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        <span className="flex-1 text-xs text-white/70 truncate">{title}</span>

        <button
          type="button"
          onClick={goFullscreen}
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25"
          aria-label="Fullscreen"
        >
          <Maximize size={16} />
        </button>
      </div>
    </div>
  );
}
