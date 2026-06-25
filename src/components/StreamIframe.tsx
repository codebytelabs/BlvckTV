import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

type StreamIframeProps = {
  src: string;
  title: string;
  variant?: 'live' | 'vod';
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
};

const EMBED_ALLOW =
  'autoplay *; fullscreen *; accelerometer *; clipboard-write *; encrypted-media *; gyroscope *; picture-in-picture *';

function withAutoplayParam(url: string): string {
  if (url.includes('autoplay')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}autoplay=1`;
}

export default function StreamIframe({
  src,
  title,
  className = 'w-full h-full border-0',
  onLoad,
  onError,
}: StreamIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const iframeSrc = withAutoplayParam(src);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
  }, [src]);

  return (
    <div className="relative w-full h-full bg-black">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <Loader2 size={32} className="text-[#8b5cf6] animate-spin" />
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-center px-6 z-10">
          <p className="text-sm text-[#9ca3af]">Stream failed to load.</p>
          <p className="text-xs text-[#6b7280] mt-1">Try another server from the menu above.</p>
        </div>
      )}

      <iframe
        ref={iframeRef}
        key={iframeSrc}
        src={iframeSrc}
        title={title}
        className={className}
        allow={EMBED_ALLOW}
        referrerPolicy="no-referrer"
        loading="eager"
        onLoad={() => {
          setLoading(false);
          onLoad?.();
        }}
        onError={() => {
          setLoading(false);
          setFailed(true);
          onError?.();
        }}
      />
    </div>
  );
}
