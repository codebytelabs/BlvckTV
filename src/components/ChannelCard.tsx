import { useState } from 'react';
import { useWatchChannel } from '@/hooks/useWatchChannel';
import { useChannelLogo } from '@/hooks/useChannelLogo';
import { getCategoryGradient } from '@/lib/channelLogos';
import { Play, Tv } from 'lucide-react';
import type { Channel } from '@/types';

interface ChannelCardProps {
  channel: Channel;
  compact?: boolean;
}

function getChannelInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function ChannelCard({ channel, compact }: ChannelCardProps) {
  const watchChannel = useWatchChannel();
  const { logoUrl, loading } = useChannelLogo(channel.name, channel.logo);
  const [imgFailed, setImgFailed] = useState(false);

  const handleClick = () => {
    watchChannel({
      id: channel.id,
      name: channel.name,
      logo: logoUrl || channel.logo,
      streamUrl: channel.streamUrl,
    });
  };

  const showLogo = Boolean(logoUrl) && !imgFailed;
  const gradient = getCategoryGradient(channel.category);

  return (
    <div
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Watch ${channel.name}`}
      className="cursor-pointer group rounded-[10px] bg-[#14141f] border border-[rgba(139,92,246,0.15)] hover:border-[rgba(139,92,246,0.5)] transition-all duration-250 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,92,246,0.45)]"
      style={compact ? { width: 160 } : undefined}
    >
      <div
        className={`relative flex items-center justify-center rounded-t-[10px] overflow-hidden ${compact ? 'h-24' : 'h-[120px]'}`}
        style={{ background: showLogo ? '#0a0a0f' : gradient }}
      >
        {loading ? (
          <div className="skeleton w-16 h-16 rounded-lg opacity-40" />
        ) : showLogo ? (
          <img
            src={logoUrl}
            alt={channel.name}
            className="max-h-[65%] max-w-[75%] object-contain drop-shadow-md"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-xl bg-[rgba(139,92,246,0.25)] border border-[rgba(139,92,246,0.35)] flex items-center justify-center">
              <Tv size={22} className="text-[#c4b5fd]" />
            </div>
            <span className="text-[#e9d5ff] text-xs font-bold tracking-wider">
              {getChannelInitials(channel.name)}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-[rgba(10,10,15,0.55)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-t-[10px]">
          <div className="w-10 h-10 rounded-full bg-[rgba(139,92,246,0.85)] flex items-center justify-center shadow-lg">
            <Play size={18} className="text-white ml-0.5" />
          </div>
        </div>

        {channel.isLive && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[rgba(10,10,15,0.85)] rounded-md px-2 py-0.5 backdrop-blur-sm">
            <div className="live-dot" />
            <span className="text-[10px] font-bold text-[#ef4444] uppercase">Live</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-[13px] font-semibold text-[#f1f1f4] truncate">{channel.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] bg-[#1e1e2d] text-[#9ca3af] rounded px-1.5 py-0.5">{channel.category}</span>
          <span className="text-[10px] text-[#6b7280]">{channel.country}</span>
        </div>
      </div>
    </div>
  );
}
