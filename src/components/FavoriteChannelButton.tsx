import { type MouseEvent } from 'react';
import { useApp } from '@/context/AppContext';
import { channelToFavorite } from '@/lib/storage';
import { Star } from 'lucide-react';
import type { Channel } from '@/types';

type FavoriteChannelButtonProps = {
  channel: Pick<Channel, 'id' | 'name' | 'logo' | 'category' | 'country' | 'streamUrl'>;
  size?: number;
  className?: string;
  showLabel?: boolean;
};

export default function FavoriteChannelButton({
  channel,
  size = 16,
  className = '',
  showLabel = false,
}: FavoriteChannelButtonProps) {
  const { isFavoriteChannel, toggleFavoriteChannel, showToast } = useApp();
  const favorited = isFavoriteChannel(channel.id);

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const added = toggleFavoriteChannel(channelToFavorite(channel));
    showToast(
      added ? `Added ${channel.name} to favorites` : `Removed ${channel.name} from favorites`,
      added ? 'success' : 'info',
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorited ? `Remove ${channel.name} from favorites` : `Add ${channel.name} to favorites`}
      aria-pressed={favorited}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      className={`inline-flex items-center justify-center gap-1 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,92,246,0.45)] ${
        favorited
          ? 'text-[#f59e0b] bg-[rgba(245,158,11,0.15)] hover:bg-[rgba(245,158,11,0.25)]'
          : 'text-[#9ca3af] bg-[rgba(10,10,15,0.65)] hover:text-[#f59e0b] hover:bg-[rgba(245,158,11,0.12)]'
      } ${showLabel ? 'px-2.5 py-1.5' : 'w-8 h-8'} ${className}`}
    >
      <Star size={size} fill={favorited ? 'currentColor' : 'none'} />
      {showLabel && (
        <span className="text-[10px] font-bold">{favorited ? 'Favorited' : 'Favorite'}</span>
      )}
    </button>
  );
}
