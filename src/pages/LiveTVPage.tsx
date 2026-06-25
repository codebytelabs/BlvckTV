import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useChannels, type ChannelsSource } from '@/hooks/useChannels';
import { useIsMobileLayout } from '@/hooks/useMediaQuery';
import { filterChannelsByQuery } from '@/lib/searchUtils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import ChannelCard from '@/components/ChannelCard';
import { SlidersHorizontal, Radio, RefreshCw, AlertCircle } from 'lucide-react';

const SOURCE_LABELS: Record<ChannelsSource, { label: string; color: string; bg: string }> = {
  api: { label: 'API', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  html: { label: 'HTML', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  cache: { label: 'Cache', color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
  fallback: { label: 'Fallback', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
};

export default function LiveTVPage() {
  const { searchQuery } = useApp();
  const isMobile = useIsMobileLayout();
  const { channels, categories, countries, liveChannels, loading, error, source, refetch } = useChannels();
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [draftCategory, setDraftCategory] = useState('');
  const [draftCountry, setDraftCountry] = useState('');

  const activeFilterCount = (category ? 1 : 0) + (country ? 1 : 0);

  const openFilters = () => {
    setDraftCategory(category);
    setDraftCountry(country);
    setShowFilters(true);
  };

  const applyFilters = () => {
    setCategory(draftCategory);
    setCountry(draftCountry);
    setShowFilters(false);
  };

  const filtered = useMemo(() => {
    let result = searchQuery ? filterChannelsByQuery(channels, searchQuery) : [...channels];
    if (category) result = result.filter(c => c.category === category);
    if (country) result = result.filter(c => c.country === country);
    return result;
  }, [channels, searchQuery, category, country]);

  const sourceMeta = SOURCE_LABELS[source];

  return (
    <div className="space-y-6 pb-10 page-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Radio size={24} className="text-[#8b5cf6]" />
          <h1 className="text-2xl font-extrabold text-[#f1f1f4]">Live TV</h1>

          <span className="flex items-center gap-1.5 bg-[rgba(239,68,68,0.15)] rounded-full px-3 py-1">
            <div className="live-dot" />
            <span className="text-[10px] font-bold text-[#ef4444] uppercase">
              {loading ? '…' : liveChannels.length} Live
            </span>
          </span>

          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] text-[11px] font-bold tabular-nums">
            {loading ? '—' : filtered.length}
            {!loading && filtered.length !== channels.length && ` / ${channels.length}`}
            {' '}channels
          </span>

          {!loading && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide"
              style={{ color: sourceMeta.color, background: sourceMeta.bg }}
              title={`Channel data loaded via ${sourceMeta.label}`}
            >
              {sourceMeta.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-[#9ca3af] text-sm font-semibold hover:bg-[#2a2a3d] hover:text-[#f1f1f4] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,92,246,0.45)]"
            title="Refresh channels"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => isMobile ? openFilters() : setShowFilters(!showFilters)}
            className="touch-target flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-[#9ca3af] text-sm font-semibold active:bg-[#2a2a3d] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,92,246,0.45)] min-h-[44px]"
          >
            <SlidersHorizontal size={16} /> Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-[#8b5cf6] px-1.5 py-0.5 text-[10px] font-bold text-white">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[#ef4444] text-xs">
          <AlertCircle size={14} />
          <span>Using fallback channels — {error}</span>
        </div>
      )}

      {showFilters && !isMobile && (
        <div className="flex items-center gap-3 flex-wrap p-4 rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.15)]">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-[#f1f1f4] text-xs rounded-lg px-3 py-2 outline-none focus:border-[#8b5cf6] focus-visible:ring-2 focus-visible:ring-[rgba(139,92,246,0.45)]"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-[#f1f1f4] text-xs rounded-lg px-3 py-2 outline-none focus:border-[#8b5cf6] focus-visible:ring-2 focus-visible:ring-[rgba(139,92,246,0.45)]"
          >
            <option value="">All Countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="button" onClick={() => { setCategory(''); setCountry(''); }} className="text-xs text-[#8b5cf6] hover:text-[#06b6d4] font-semibold">Clear All</button>
        </div>
      )}

      {(category || country) && (
        <div className="flex items-center gap-2 flex-wrap">
          {category && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] text-xs font-semibold">
              {category}
              <button type="button" onClick={() => setCategory('')} className="hover:text-[#f1f1f4]">&times;</button>
            </span>
          )}
          {country && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] text-xs font-semibold">
              {country}
              <button type="button" onClick={() => setCountry('')} className="hover:text-[#f1f1f4]">&times;</button>
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-[10px] border border-[rgba(139,92,246,0.1)] overflow-hidden">
              <div className="skeleton h-[120px]" />
              <div className="p-3 space-y-2 bg-[#14141f]">
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-2 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Radio size={64} className="text-[#6b7280] mb-4" style={{ opacity: 0.3 }} />
          <p className="text-lg text-[#9ca3af]">No channels found</p>
          <p className="text-sm text-[#6b7280] mt-1">Try adjusting your filters or search</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:gap-4">
          {filtered.map(channel => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      )}

      <Sheet open={showFilters && isMobile} onOpenChange={setShowFilters}>
        <SheetContent side="bottom" className="rounded-t-[20px] bg-[#14141f] border-[rgba(139,92,246,0.15)] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle className="text-[#f1f1f4] text-left">Channel Filters</SheetTitle>
          </SheetHeader>
          <div className="px-4 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#9ca3af]">Category</span>
              <select
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
                className="w-full bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-[#f1f1f4] text-sm rounded-xl px-4 py-3 outline-none"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#9ca3af]">Country</span>
              <select
                value={draftCountry}
                onChange={(e) => setDraftCountry(e.target.value)}
                className="w-full bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-[#f1f1f4] text-sm rounded-xl px-4 py-3 outline-none"
              >
                <option value="">All Countries</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <SheetFooter className="flex-row gap-2 px-4">
            <button type="button" onClick={() => { setCategory(''); setCountry(''); setShowFilters(false); }} className="touch-target flex-1 min-h-[48px] rounded-xl border border-[rgba(139,92,246,0.2)] text-sm font-semibold text-[#9ca3af]">Reset</button>
            <button type="button" onClick={applyFilters} className="touch-target flex-1 min-h-[48px] rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-sm font-bold text-white">Apply</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
