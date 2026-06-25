import { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useChannels } from '@/hooks/useChannels';
import { useTMDB } from '@/hooks/useTMDB';
import { filterChannelsByQuery } from '@/lib/searchUtils';
import SearchOverlay from '@/components/SearchOverlay';
import { ArrowLeft, Search, X } from 'lucide-react';
import type { PageType } from '@/types';

type MobileSearchScreenProps = {
  open: boolean;
  onClose: () => void;
};

export default function MobileSearchScreen({ open, onClose }: MobileSearchScreenProps) {
  const { searchQuery, setSearchQuery, setCurrentPage, setIsSearchOpen } = useApp();
  const { channels } = useChannels();
  const { searchMulti } = useTMDB();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    if (open) {
      setLocalQuery(searchQuery);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(localQuery), 250);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSearchEnter = useCallback(async () => {
    const q = localQuery.trim();
    if (q.length < 2) return;
    setSearchQuery(q);

    const channelMatches = filterChannelsByQuery(channels, q);
    if (channelMatches.length > 0) {
      setCurrentPage('livetv');
      onClose();
      return;
    }

    const results = await searchMulti(q);
    if (results) {
      const movieResults = results.filter(r => r.media_type === 'movie');
      const tvResults = results.filter(r => r.media_type === 'tv');
      let page: PageType = 'home';
      if (movieResults.length > 0) page = 'movies';
      else if (tvResults.length > 0) page = 'tvshows';
      setCurrentPage(page);
    }
    onClose();
  }, [localQuery, setSearchQuery, channels, searchMulti, setCurrentPage, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#0a0a0f] lg:hidden">
      <div className="flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-[rgba(139,92,246,0.12)]">
        <button
          type="button"
          onClick={onClose}
          className="touch-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#9ca3af] active:bg-[#1e1e2d]"
          aria-label="Close search"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7280] pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleSearchEnter();
              }
            }}
            placeholder="Movies, shows, channels…"
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-[15px] text-[#f1f1f4] placeholder-[#6b7280] outline-none focus:border-[#8b5cf6]"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => { setLocalQuery(''); setSearchQuery(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] p-1"
              aria-label="Clear"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        {localQuery.trim().length >= 2 ? (
          <div className="rounded-xl border border-[rgba(139,92,246,0.15)] bg-[#14141f] overflow-hidden">
            <SearchOverlay query={localQuery.trim()} />
          </div>
        ) : (
          <p className="text-center text-sm text-[#6b7280] pt-12 px-6">
            Search movies, TV shows, and live channels
          </p>
        )}
      </div>
    </div>
  );
}
