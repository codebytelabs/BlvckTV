import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useLiveCatalog } from '@/hooks/useLiveCatalog';
import { useIsMobileLayout } from '@/hooks/useMediaQuery';
import { filterChannelsByQuery } from '@/lib/searchUtils';
import { resolveFavoriteChannels } from '@/lib/storage';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import ChannelCard from '@/components/ChannelCard';
import AddStreamDialog from '@/components/AddStreamDialog';
import {
  Radio,
  Search,
  RefreshCw,
  AlertCircle,
  Star,
  Plus,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Play,
  Settings,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useWatchChannel } from '@/hooks/useWatchChannel';
import FavoriteChannelButton from '@/components/FavoriteChannelButton';

type ViewMode = 'grid' | 'list';
const PAGE_CHUNK_SIZE = 60;

export default function LiveTVPage() {
  const { searchQuery, setSearchQuery, favoriteChannels, setCurrentPage } = useApp();
  const isMobile = useIsMobileLayout();
  const watchChannel = useWatchChannel();

  const {
    catalogId,
    setCatalogId,
    playlists,
    activePlaylist,
    healthMap,
    channels,
    categories,
    countries,
    loading,
    error,
    source,
    refetch,
  } = useLiveCatalog();

  const activeHealth = healthMap[catalogId] ?? 'online';

  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [visibleCount, setVisibleCount] = useState(PAGE_CHUNK_SIZE);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Mobile filter drawer state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [draftCategory, setDraftCategory] = useState('');
  const [draftCountry, setDraftCountry] = useState('');

  // Reset pagination when filter or playlist changes
  useEffect(() => {
    setVisibleCount(PAGE_CHUNK_SIZE);
  }, [catalogId, selectedCategory, selectedCountry, searchQuery, favoritesOnly]);

  const activeFilterCount = (selectedCategory ? 1 : 0) + (selectedCountry ? 1 : 0);

  const favoriteList = useMemo(
    () => resolveFavoriteChannels(favoriteChannels, channels),
    [favoriteChannels, channels],
  );

  const filteredChannels = useMemo(() => {
    let result = favoritesOnly
      ? [...favoriteList]
      : searchQuery
        ? filterChannelsByQuery(channels, searchQuery)
        : [...channels];

    if (selectedCategory) {
      result = result.filter(c =>
        c.category === selectedCategory ||
        c.category.split(';').some(s => s.trim() === selectedCategory)
      );
    }
    if (selectedCountry) {
      result = result.filter(c => c.country === selectedCountry);
    }
    if (favoritesOnly && searchQuery) {
      result = filterChannelsByQuery(result, searchQuery);
    }
    return result;
  }, [channels, favoriteList, searchQuery, selectedCategory, selectedCountry, favoritesOnly]);

  const displayedChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  const hasMore = visibleCount < filteredChannels.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + PAGE_CHUNK_SIZE);
  };

  const handlePlaylistSelect = (id: string) => {
    setSelectedCategory('');
    setSelectedCountry('');
    setCatalogId(id);
  };

  const openMobileFilters = () => {
    setDraftCategory(selectedCategory);
    setDraftCountry(selectedCountry);
    setShowMobileFilters(true);
  };

  const applyMobileFilters = () => {
    setSelectedCategory(draftCategory);
    setSelectedCountry(draftCountry);
    setShowMobileFilters(false);
  };

  // Top category pills (most common categories)
  const topCategories = useMemo(() => {
    return categories.slice(0, 10);
  }, [categories]);

  return (
    <div className="space-y-5 pb-12 page-fade-in">
      {/* Top Header & Stream Selector Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          {/* Section Branding */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.18)] border border-[rgba(139,92,246,0.3)] flex items-center justify-center text-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <Radio size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#f1f1f4] tracking-tight">Live TV</h1>
                <span className="flex items-center gap-1.5 bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.25)] rounded-full px-2.5 py-0.5">
                  <div className="live-dot" />
                  <span className="text-[10px] font-extrabold text-[#ef4444] uppercase tracking-wide">
                    Live
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] text-[11px] font-bold tabular-nums">
                  {loading ? '…' : `${filteredChannels.length} ${filteredChannels.length === 1 ? 'channel' : 'channels'}`}
                </span>
              </div>
              <p className="text-xs text-[#6b7280] hidden sm:block">
                Stream M3U & Xtream playlists with low-latency playback
              </p>
            </div>
          </div>

          {/* Stream Selector Dropdown & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stream Health Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-colors shrink-0 ${
                activeHealth === 'online'
                  ? 'bg-[rgba(34,197,94,0.12)] border-[rgba(34,197,94,0.3)] text-[#22c55e]'
                  : activeHealth === 'checking'
                    ? 'bg-[rgba(234,179,8,0.12)] border-[rgba(234,179,8,0.3)] text-[#eab308]'
                    : 'bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.3)] text-[#ef4444]'
              }`}
              title={
                activeHealth === 'online'
                  ? 'Selected stream is online and available'
                  : 'Selected stream is offline or at max connection capacity'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeHealth === 'online'
                    ? 'bg-[#22c55e] shadow-[0_0_8px_#22c55e]'
                    : activeHealth === 'checking'
                      ? 'bg-[#eab308] animate-pulse'
                      : 'bg-[#ef4444] shadow-[0_0_8px_#ef4444]'
                }`}
              />
              <span className="uppercase tracking-wider">{activeHealth}</span>
            </div>

            {/* Stream Selector Dropdown */}
            <div className="relative flex items-center">
              <div className="absolute left-3 pointer-events-none text-[#8b5cf6]">
                <Layers size={15} />
              </div>
              <select
                value={catalogId}
                onChange={(e) => handlePlaylistSelect(e.target.value)}
                disabled={loading}
                aria-label="Select stream"
                className="bg-[#14141f] border border-[rgba(139,92,246,0.25)] hover:border-[#8b5cf6] text-[#f1f1f4] text-xs sm:text-sm font-semibold rounded-xl pl-9 pr-8 py-2.5 outline-none focus:ring-2 focus:ring-[rgba(139,92,246,0.4)] transition-all min-h-[42px] max-w-[260px] sm:max-w-[320px] truncate cursor-pointer appearance-none shadow-sm"
              >
                {playlists.map(p => {
                  const status = healthMap[p.id] ?? 'online';
                  const isOnline = status === 'online';
                  const dot = isOnline ? '🟢' : status === 'checking' ? '🟡' : '🔴';
                  const offlineTag = isOnline ? '' : status === 'checking' ? ' [Checking]' : ' [Offline]';

                  return (
                    <option
                      key={p.id}
                      value={p.id}
                      className={isOnline ? 'bg-[#14141f] text-[#f1f1f4] py-1' : 'bg-[#101018] text-[#6b7280] py-1'}
                      style={{
                        color: isOnline ? '#f1f1f4' : '#6b7280',
                        opacity: isOnline ? 1 : 0.6,
                      }}
                    >
                      {dot} {p.name}{offlineTag} [{p.type.toUpperCase()}]
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-2.5 pointer-events-none text-[#6b7280]">
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Add Stream Button */}
            <button
              type="button"
              onClick={() => setIsAddDialogOpen(true)}
              className="touch-target flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:opacity-90 active:scale-95 transition-all min-h-[42px]"
              title="Add new M3U or Xtream playlist"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Add Stream</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={loading}
              className="touch-target flex items-center justify-center w-10 h-10 rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.2)] text-[#9ca3af] hover:text-[#f1f1f4] hover:bg-[#1e1e2d] active:scale-95 transition-all disabled:opacity-50"
              title="Reload current stream playlist"
              aria-label="Refresh playlist"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-[#8b5cf6]' : ''} />
            </button>

            {/* Manage in Settings Button */}
            <button
              type="button"
              onClick={() => setCurrentPage('settings')}
              className="touch-target flex items-center justify-center w-10 h-10 rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.2)] text-[#9ca3af] hover:text-[#f1f1f4] hover:bg-[#1e1e2d] active:scale-95 transition-all"
              title="Manage streams in Settings"
              aria-label="Stream Settings"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* Active Stream Info Bar */}
        {activePlaylist && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.15)] text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider bg-[rgba(6,182,212,0.15)] text-[#06b6d4] border border-[rgba(6,182,212,0.25)] shrink-0">
                {activePlaylist.type}
              </span>
              <span className="font-bold text-[#f1f1f4] truncate">{activePlaylist.name}</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeHealth === 'online'
                    ? 'bg-[rgba(34,197,94,0.15)] text-[#22c55e]'
                    : 'bg-[rgba(239,68,68,0.15)] text-[#ef4444]'
                }`}
              >
                {activeHealth === 'online' ? '🟢 Online' : '🔴 Offline / Full'}
              </span>
              <span className="text-[#6b7280] hidden md:inline truncate max-w-sm">· {activePlaylist.url}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-[#9ca3af]">
                Source: <strong className="text-[#8b5cf6]">{source.toUpperCase()}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Search, Category Tabs & View Mode Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels by name, group, or country…"
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.18)] focus:border-[#8b5cf6] text-xs text-[#f1f1f4] placeholder-[#6b7280] outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6b7280] hover:text-[#f1f1f4] px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters, Favorites & View Toggle */}
          <div className="flex items-center gap-2">
            {/* Favorites Toggle */}
            <button
              type="button"
              onClick={() => setFavoritesOnly(v => !v)}
              className={`touch-target flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all min-h-[38px] ${
                favoritesOnly
                  ? 'bg-[rgba(245,158,11,0.2)] border-[rgba(245,158,11,0.4)] text-[#f59e0b]'
                  : 'bg-[#14141f] border-[rgba(139,92,246,0.18)] text-[#9ca3af] hover:text-[#f1f1f4]'
              }`}
            >
              <Star size={14} fill={favoritesOnly ? 'currentColor' : 'none'} />
              <span>Favorites</span>
              {favoriteChannels.length > 0 && (
                <span className="rounded-full bg-[rgba(245,158,11,0.25)] px-1.5 py-0.2 text-[10px] tabular-nums">
                  {favoriteChannels.length}
                </span>
              )}
            </button>

            {/* Mobile Filters Trigger */}
            {isMobile ? (
              <button
                type="button"
                onClick={openMobileFilters}
                className="touch-target flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.18)] text-[#9ca3af] text-xs font-semibold min-h-[38px]"
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-[#8b5cf6] px-1.5 py-0.2 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            ) : (
              /* Desktop Country Filter */
              countries.length > 1 && (
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-[#14141f] border border-[rgba(139,92,246,0.18)] text-[#f1f1f4] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#8b5cf6] min-h-[38px] cursor-pointer"
                >
                  <option value="">All Regions</option>
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )
            )}

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center p-0.5 bg-[#14141f] border border-[rgba(139,92,246,0.18)] rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[rgba(139,92,246,0.25)] text-[#8b5cf6]'
                    : 'text-[#6b7280] hover:text-[#f1f1f4]'
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[rgba(139,92,246,0.25)] text-[#8b5cf6]'
                    : 'text-[#6b7280] hover:text-[#f1f1f4]'
                }`}
                title="List view"
                aria-label="List view"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Bar (Fast horizontal scroll) */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                !selectedCategory
                  ? 'bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-white shadow-md'
                  : 'bg-[#14141f] border border-[rgba(139,92,246,0.15)] text-[#9ca3af] hover:text-[#f1f1f4] hover:bg-[#1e1e2d]'
              }`}
            >
              All Genres ({channels.length})
            </button>
            {topCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#8b5cf6] text-white shadow-md'
                    : 'bg-[#14141f] border border-[rgba(139,92,246,0.15)] text-[#9ca3af] hover:text-[#f1f1f4] hover:bg-[#1e1e2d]'
                }`}
              >
                {cat}
              </button>
            ))}
            {categories.length > 10 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#14141f] border border-[rgba(139,92,246,0.15)] text-[#9ca3af] hover:text-[#f1f1f4] text-xs font-bold rounded-full px-3 py-1.5 outline-none cursor-pointer shrink-0"
              >
                <option value="">More genres…</option>
                {categories.slice(10).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Error / Offline Alert */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)] text-[#f59e0b] text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-3 py-1 rounded-lg bg-[rgba(245,158,11,0.2)] hover:bg-[rgba(245,158,11,0.3)] font-bold transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Active Filter Badges */}
      {(selectedCategory || selectedCountry) && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[#6b7280] font-medium">Active filters:</span>
          {selectedCategory && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(139,92,246,0.2)] text-[#8b5cf6] font-semibold border border-[rgba(139,92,246,0.3)]">
              {selectedCategory}
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className="hover:text-white font-bold ml-0.5"
                aria-label="Remove category filter"
              >
                ×
              </button>
            </span>
          )}
          {selectedCountry && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(6,182,212,0.2)] text-[#06b6d4] font-semibold border border-[rgba(6,182,212,0.3)]">
              {selectedCountry}
              <button
                type="button"
                onClick={() => setSelectedCountry('')}
                className="hover:text-white font-bold ml-0.5"
                aria-label="Remove country filter"
              >
                ×
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => { setSelectedCategory(''); setSelectedCountry(''); }}
            className="text-[11px] text-[#8b5cf6] hover:underline font-semibold ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Channel Presentation */}
      {loading && channels.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-[12px] border border-[rgba(139,92,246,0.1)] overflow-hidden bg-[#14141f]">
              <div className="skeleton h-[120px]" />
              <div className="p-3 space-y-2">
                <div className="skeleton h-3.5 w-3/4 rounded" />
                <div className="skeleton h-2.5 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl bg-[#14141f]/50 border border-[rgba(139,92,246,0.1)]">
          <Star size={56} className="text-[#6b7280] mb-3 opacity-40" />
          <p className="text-base font-bold text-[#f1f1f4]">
            {favoritesOnly ? 'No favorite channels yet' : 'No channels found'}
          </p>
          <p className="text-xs text-[#6b7280] mt-1 max-w-sm">
            {favoritesOnly
              ? 'Star any channel while browsing to quickly find it in your favorites.'
              : 'Try selecting a different genre, clearing your search, or switching to another stream.'}
          </p>
          {!favoritesOnly && (
            <button
              type="button"
              onClick={() => { setSelectedCategory(''); setSelectedCountry(''); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#1e1e2d] hover:bg-[#2a2a3d] border border-[rgba(139,92,246,0.2)] text-xs font-semibold text-[#8b5cf6] transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Presentation */
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:gap-4">
            {displayedChannels.map(channel => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>

          {/* Load More Button for Smooth Batch Rendering */}
          {hasMore && (
            <div className="flex flex-col items-center justify-center pt-4 pb-2">
              <button
                type="button"
                onClick={handleLoadMore}
                className="px-6 py-3 rounded-xl bg-[#14141f] hover:bg-[#1e1e2d] border border-[rgba(139,92,246,0.25)] hover:border-[#8b5cf6] text-xs font-bold text-[#f1f1f4] shadow-lg transition-all"
              >
                Load More Channels ({displayedChannels.length} of {filteredChannels.length})
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Modern Cable / Dense List Presentation */
        <div className="space-y-6">
          <div className="rounded-xl border border-[rgba(139,92,246,0.15)] bg-[#14141f] divide-y divide-[rgba(139,92,246,0.08)] overflow-hidden">
            {displayedChannels.map(channel => (
              <div
                key={channel.id}
                onClick={() => watchChannel({
                  id: channel.id,
                  name: channel.name,
                  logo: channel.logo,
                  streamUrl: channel.streamUrl,
                  provider: channel.provider ?? 'm3u',
                })}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#1e1e2d] transition-colors cursor-pointer group"
              >
                {/* Logo / Thumbnail */}
                <div className="w-10 h-10 rounded-lg bg-[#0a0a0f] border border-[rgba(139,92,246,0.15)] flex items-center justify-center overflow-hidden shrink-0">
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt=""
                      className="max-h-[75%] max-w-[85%] object-contain"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-[11px] font-bold text-[#c4b5fd]">
                      {channel.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Channel Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#f1f1f4] truncate group-hover:text-[#a78bfa] transition-colors">
                      {channel.name}
                    </p>
                    {channel.isLive && (
                      <span className="flex items-center gap-1 text-[9px] font-extrabold text-[#ef4444] uppercase px-1.5 py-0.2 rounded bg-[rgba(239,68,68,0.12)] shrink-0">
                        <span className="live-dot scale-75" /> Live
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[#6b7280]">
                    <span className="text-[10px] bg-[#0a0a0f] text-[#9ca3af] px-1.5 py-0.2 rounded">
                      {channel.category}
                    </span>
                    <span>{channel.country}</span>
                  </div>
                </div>

                {/* Favorite & Quick Play */}
                <div className="flex items-center gap-2 shrink-0">
                  <FavoriteChannelButton channel={channel} size={14} />
                  <div className="w-8 h-8 rounded-full bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] flex items-center justify-center group-hover:bg-[#8b5cf6] group-hover:text-white transition-colors">
                    <Play size={14} className="ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button for List View */}
          {hasMore && (
            <div className="flex flex-col items-center justify-center pt-2 pb-2">
              <button
                type="button"
                onClick={handleLoadMore}
                className="px-6 py-3 rounded-xl bg-[#14141f] hover:bg-[#1e1e2d] border border-[rgba(139,92,246,0.25)] hover:border-[#8b5cf6] text-xs font-bold text-[#f1f1f4] shadow-lg transition-all"
              >
                Load More Channels ({displayedChannels.length} of {filteredChannels.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Stream In-Page Dialog Modal */}
      <AddStreamDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={(newId) => {
          setCatalogId(newId);
        }}
      />

      {/* Mobile Filter Sheet Drawer */}
      <Sheet open={showMobileFilters && isMobile} onOpenChange={setShowMobileFilters}>
        <SheetContent side="bottom" className="rounded-t-[20px] bg-[#14141f] border-[rgba(139,92,246,0.15)] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle className="text-[#f1f1f4] text-left">Filter Channels</SheetTitle>
          </SheetHeader>
          <div className="px-4 space-y-4 pt-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#9ca3af]">Genre / Category</span>
              <select
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
                className="w-full bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-[#f1f1f4] text-sm rounded-xl px-4 py-3 outline-none"
              >
                <option value="">All Genres</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#9ca3af]">Region / Country</span>
              <select
                value={draftCountry}
                onChange={(e) => setDraftCountry(e.target.value)}
                className="w-full bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-[#f1f1f4] text-sm rounded-xl px-4 py-3 outline-none"
              >
                <option value="">All Regions</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <SheetFooter className="flex-row gap-2 px-4 pt-3">
            <button
              type="button"
              onClick={() => { setDraftCategory(''); setDraftCountry(''); }}
              className="touch-target flex-1 min-h-[48px] rounded-xl border border-[rgba(139,92,246,0.2)] text-sm font-semibold text-[#9ca3af]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={applyMobileFilters}
              className="touch-target flex-1 min-h-[48px] rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] text-sm font-bold text-white"
            >
              Apply
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
