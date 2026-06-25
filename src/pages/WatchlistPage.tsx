import { useApp } from '@/context/AppContext';
import PosterCard from '@/components/PosterCard';
import { Bookmark } from 'lucide-react';

export default function WatchlistPage() {
  const { watchlist } = useApp();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Bookmark size={24} className="text-[#8b5cf6]" />
        <h1 className="text-2xl font-extrabold text-[#f1f1f4]">My Watchlist</h1>
        <span className="text-sm text-[#6b7280]">{watchlist.length} items</span>
      </div>

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <img src="/empty-watchlist.jpg" alt="" className="w-40 h-40 rounded-2xl mb-6 object-cover opacity-60" />
          <h3 className="text-lg font-semibold text-[#9ca3af] mb-2">Your watchlist is empty</h3>
          <p className="text-sm text-[#6b7280]">Start adding movies and shows you want to watch later</p>
        </div>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {watchlist.map(item => (
            <PosterCard
              key={`${item.type}-${item.id}`}
              item={{ id: item.id, title: item.title, name: item.title, poster_path: item.poster_path, overview: '', backdrop_path: null, genre_ids: [], vote_average: 0, release_date: '', first_air_date: '' }}
              type={item.type}
            />
          ))}
        </div>
      )}
    </div>
  );
}
