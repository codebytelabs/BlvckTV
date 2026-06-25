import { useApp } from '@/context/AppContext';
import type { PageType } from '@/types';
import { Home, Film, Tv, Radio, Menu } from 'lucide-react';
import { useState } from 'react';
import MobileMoreSheet from '@/components/MobileMoreSheet';

type NavItem = {
  page: PageType;
  label: string;
  icon: React.ReactNode;
};

const MAIN_TABS: NavItem[] = [
  { page: 'home', label: 'Home', icon: <Home size={22} strokeWidth={2} /> },
  { page: 'movies', label: 'Movies', icon: <Film size={22} strokeWidth={2} /> },
  { page: 'tvshows', label: 'TV', icon: <Tv size={22} strokeWidth={2} /> },
  { page: 'livetv', label: 'Live', icon: <Radio size={22} strokeWidth={2} /> },
];

export default function MobileBottomNav() {
  const { currentPage, setCurrentPage, selectedVideo, selectedChannel, watchlist } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreSection = ['sports', 'watchlist', 'history', 'settings'].includes(currentPage);
  const isPlayerOpen = Boolean(selectedVideo || selectedChannel);

  if (isPlayerOpen) return null;

  return (
    <>
      <nav
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 lg:hidden border-t border-[rgba(139,92,246,0.15)] bg-[rgba(10,10,15,0.92)] backdrop-blur-xl"
        aria-label="Main navigation"
      >
        <div className="flex items-stretch justify-around px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
          {MAIN_TABS.map(tab => {
            const active = currentPage === tab.page;
            return (
              <button
                key={tab.page}
                type="button"
                onClick={() => {
                  setCurrentPage(tab.page);
                  setMoreOpen(false);
                }}
                className={`touch-target flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[52px] rounded-xl transition-colors ${
                  active ? 'text-[#8b5cf6]' : 'text-[#6b7280] active:text-[#9ca3af]'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span className={active ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]' : ''}>
                  {tab.icon}
                </span>
                <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`touch-target flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[52px] rounded-xl transition-colors relative ${
              isMoreSection || moreOpen ? 'text-[#8b5cf6]' : 'text-[#6b7280] active:text-[#9ca3af]'
            }`}
            aria-expanded={moreOpen}
            aria-label="More options"
          >
            <Menu size={22} strokeWidth={2} />
            <span className="text-[10px] font-bold tracking-wide">More</span>
            {watchlist.length > 0 && !isMoreSection && (
              <span className="absolute top-1.5 right-[calc(50%-18px)] w-2 h-2 rounded-full bg-[#8b5cf6]" />
            )}
          </button>
        </div>
      </nav>

      <MobileMoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
