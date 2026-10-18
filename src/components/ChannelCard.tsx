import { useState } from 'react';
import { useWatchChannel } from '@/hooks/useWatchChannel';
import { useApp } from '@/context/AppContext';
import { getCategoryGradient } from '@/lib/channelLogos';
import FavoriteChannelButton from '@/components/FavoriteChannelButton';
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
  const { isFavoriteChannel } = useApp();
  const [imgFailed, setImgFailed] = useState(false);
  const favorited = isFavoriteChannel(channel.id);

  const rawLogo = channel.logo?.trim() ?? '';
  const showLogo = Boolean(rawLogo) && !imgFailed;
  const gradient = getCategoryGradient(channel.category);

  const handleClick = () => {
    watchChannel({
      id: channel.id,
      name: channel.name,
      logo: showLogo ? rawLogo : '',
      streamUrl: channel.streamUrl,
      provider: channel.provider ?? 'm3u',
    });
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Watch ${channel.name}`}
      className="cursor-pointer group rounded-[12px] bg-[#14141f] border border-[rgba(139,92,246,0.15)] hover:border-[rgba(139,92,246,0.5)] transition-all duration-200 hover:shadow-[0_0_20px_rgba(139,92,246,0.18)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,92,246,0.45)]"
      style={compact ? { width: 160 } : undefined}
    >
      <div
        className={`relative flex items-center justify-center rounded-t-[12px] overflow-hidden ${compact ? 'h-24' : 'h-[120px]'}`}
        style={{ background: showLogo ? '#0a0a0f' : gradient }}
      >
        {showLogo ? (
          <img
            src={rawLogo}
            alt=""
            className="max-h-[70%] max-w-[80%] object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 select-none">
            <div className="w-12 h-12 rounded-xl bg-[rgba(139,92,246,0.25)] border border-[rgba(139,92,246,0.35)] flex items-center justify-center">
              <Tv size={22} className="text-[#c4b5fd]" />
            </div>
            <span className="text-[#e9d5ff] text-xs font-bold tracking-wider">
              {getChannelInitials(channel.name)}
            </span>
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-[rgba(10,10,15,0.6)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play size={18} className="text-white ml-0.5" fill="white" />
          </div>
        </div>

        {channel.isLive && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[rgba(10,10,15,0.85)] rounded-md px-2 py-0.5 backdrop-blur-sm border border-white/5">
            <div className="live-dot" />
            <span className="text-[10px] font-bold text-[#ef4444] uppercase tracking-wide">Live</span>
          </div>
        )}

        <div className={`absolute top-2 right-2 z-10 ${favorited ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <FavoriteChannelButton channel={channel} size={14} />
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-[13px] font-semibold text-[#f1f1f4] truncate group-hover:text-[#a78bfa] transition-colors">
          {channel.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] font-medium bg-[#1e1e2d] text-[#9ca3af] rounded px-1.5 py-0.5 truncate max-w-[110px]">
            {channel.category}
          </span>
          <span className="text-[10px] text-[#6b7280] truncate">
            {channel.country}
          </span>
        </div>
      </div>
    </div>
  );
}
