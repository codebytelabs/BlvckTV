import { useApp } from '@/context/AppContext';
import { getPoster } from '@/hooks/useTMDB';
import { clearHistory } from '@/lib/storage';
import { RotateCcw, Trash2, Film, Tv, Radio } from 'lucide-react';
import type { HistoryItem } from '@/types';

export default function HistoryPage() {
  const { history, refreshHistory, setSelectedVideo, setSelectedChannel } = useApp();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'movie': return <Film size={14} className="text-[#8b5cf6]" />;
      case 'tv': return <Tv size={14} className="text-[#06b6d4]" />;
      case 'live': return <Radio size={14} className="text-[#ef4444]" />;
      default: return null;
    }
  };

  const handleClick = (item: HistoryItem) => {
    if (item.type === 'live') {
      setSelectedChannel({ id: String(item.id), name: item.title, logo: item.poster_path || '' });
    } else {
      setSelectedVideo({ tmdbId: item.id, type: item.type, title: item.title, season: item.season, episode: item.episode });
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RotateCcw size={24} className="text-[#8b5cf6]" />
          <h1 className="text-2xl font-extrabold text-[#f1f1f4]">Watch History</h1>
          <span className="text-sm text-[#6b7280]">{history.length} items</span>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => { clearHistory(); refreshHistory(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e1e2d] border border-[rgba(239,68,68,0.2)] text-[#ef4444] text-sm font-semibold hover:bg-[rgba(239,68,68,0.1)] transition-colors"
          >
            <Trash2 size={14} /> Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <img src="/empty-history.jpg" alt="" className="w-40 h-40 rounded-2xl mb-6 object-cover opacity-60" />
          <h3 className="text-lg font-semibold text-[#9ca3af] mb-2">No watch history</h3>
          <p className="text-sm text-[#6b7280]">Start watching to build your history</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item, i) => (
            <button
              key={`${item.type}-${item.id}-${i}`}
              onClick={() => handleClick(item)}
              className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-[#14141f] transition-colors text-left"
            >
              <div className="w-16 h-10 rounded-lg bg-[#1e1e2d] overflow-hidden shrink-0">
                {item.poster_path ? (
                  <img src={getPoster(item.poster_path, 'w92')} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1e1e2d]">
                    {getTypeIcon(item.type)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getTypeIcon(item.type)}
                  <h4 className="text-sm font-semibold text-[#f1f1f4] truncate">{item.title}</h4>
                </div>
                <p className="text-[11px] text-[#6b7280] mt-0.5">
                  {new Date(item.watchedAt).toLocaleDateString()} {new Date(item.watchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {item.season && ` • S${item.season}E${item.episode}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
