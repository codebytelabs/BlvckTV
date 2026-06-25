import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useChannels } from '@/hooks/useChannels';
import { useTMDB } from '@/hooks/useTMDB';
import { filterChannelsByQuery } from '@/lib/searchUtils';
import SearchOverlay from '@/components/SearchOverlay';
import MobileSearchScreen from '@/components/MobileSearchScreen';
import { Search, X, User } from 'lucide-react';
import type { PageType } from '@/types';

const FILTER_PILLS: { label: string; page: PageType }[] = [
  { label: 'All', page: 'home' },
  { label: 'Movies', page: 'movies' },
  { label: 'TV Shows', page: 'tvshows' },
  { label: 'Live TV', page: 'livetv' },
  { label: 'Sports', page: 'sports' },
];

function BlvckTVWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 shrink-0 ${compact ? '' : 'hidden sm:flex'}`}>
      <div className="w-7 h-7 rounded-lg bg-black border border-[rgba(255,255,255,0.12)] flex items-center justify-center">
        <span className="text-[10px] font-black tracking-tighter text-white leading-none">
          B<span className="text-[#8b5cf6]">TV</span>
        </span>
      </div>
      <span className={`font-extrabold tracking-tight text-[#f1f1f4] whitespace-nowrap ${compact ? 'text-sm' : 'text-base'}`}>
        Blvck<span className="text-[#8b5cf6]">TV</span>
      </span>
    </div>
  );
}

export default function TopBar() {
  const { currentPage, setCurrentPage, searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen, sidebarCollapsed } = useApp();
  const { channels } = useChannels();
  const { searchMulti } = useTMDB();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen, setIsSearchOpen]);

  const handleSearchEnter = useCallback(async () => {
    const q = localQuery.trim();
    if (q.length < 2) return;

    setSearchQuery(q);

    const channelMatches = filterChannelsByQuery(channels, q);
    if (channelMatches.length > 0) {
      setCurrentPage('livetv');
      setIsSearchOpen(false);
      return;
    }

    const results = await searchMulti(q);
    if (results) {
      const movieResults = results.filter(r => r.media_type === 'movie');
      const tvResults = results.filter(r => r.media_type === 'tv');
      if (movieResults.length > 0) {
        setCurrentPage('movies');
      } else if (tvResults.length > 0) {
        setCurrentPage('tvshows');
      }
    }
    setIsSearchOpen(false);
  }, [localQuery, setSearchQuery, channels, searchMulti, setCurrentPage, setIsSearchOpen]);

  return (
    <>
      <header
        className="sticky top-0 z-50 h-14 flex items-center gap-2 sm:gap-4 px-3 sm:px-6 pt-[env(safe-area-inset-top)] lg:pt-0"
        style={{ background: 'linear-gradient(to bottom, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.7) 60%, transparent 100%)' }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden shrink-0">
          <BlvckTVWordmark compact />
        </div>

        {sidebarCollapsed && (
          <div className="hidden lg:block">
            <BlvckTVWordmark compact />
          </div>
        )}

        {/* Desktop search */}
        <div ref={searchContainerRef} className="relative hidden lg:block flex-none" style={{ maxWidth: 360, width: 360 }}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              if (!isSearchOpen && e.target.value) setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleSearchEnter();
              }
              if (e.key === 'Escape') {
                setIsSearchOpen(false);
                inputRef.current?.blur();
              }
            }}
            placeholder="Search movies, shows, channels..."
            className="w-full h-9 pl-9 pr-9 rounded-full bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-[13px] text-[#f1f1f4] placeholder-[#6b7280] outline-none transition-[border-color,box-shadow] focus:border-[#8b5cf6] focus-visible:ring-2 focus-visible:ring-[rgba(139,92,246,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
            aria-expanded={isSearchOpen && searchQuery.length >= 2}
            aria-autocomplete="list"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => { setLocalQuery(''); setSearchQuery(''); setIsSearchOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#f1f1f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,92,246,0.45)] rounded-full"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          {isSearchOpen && searchQuery.trim().length >= 2 && (
            <SearchOverlay query={searchQuery.trim()} variant="dropdown" />
          )}
        </div>

        {/* Mobile search trigger */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="touch-target lg:hidden flex flex-1 items-center gap-2 h-10 px-3.5 rounded-xl bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-[#6b7280] text-sm"
          aria-label="Open search"
        >
          <Search size={16} />
          <span className="truncate">Search…</span>
        </button>

        {/* Filter pills — desktop only */}
        <div className="hidden md:flex items-center gap-2 ml-1">
          {FILTER_PILLS.map(pill => (
            <button
              key={pill.page}
              type="button"
              onClick={() => setCurrentPage(pill.page)}
              className={`
                px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,92,246,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]
                ${currentPage === pill.page
                  ? 'text-white'
                  : 'bg-[#1e1e2d] text-[#9ca3af] border border-[rgba(139,92,246,0.15)] hover:text-[#f1f1f4]'
                }
              `}
              style={currentPage === pill.page ? {
                background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              } : {}}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="flex-1 hidden md:block" />

        <button
          type="button"
          onClick={() => setCurrentPage('settings')}
          className="touch-target hidden sm:flex w-10 h-10 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4] items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,92,246,0.45)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
          aria-label="Settings"
        >
          <User size={18} className="text-white" />
        </button>
      </header>

      <MobileSearchScreen
        open={mobileSearchOpen}
        onClose={() => {
          setMobileSearchOpen(false);
          setIsSearchOpen(false);
        }}
      />
    </>
  );
}
