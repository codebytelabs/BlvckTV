import { useApp } from '@/context/AppContext';
import type { PageType } from '@/types';
import { Home, Film, Tv, Radio, Trophy, Bookmark, RotateCcw, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface NavGroup {
  label: string;
  items: { page: PageType; label: string; icon: React.ReactNode }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { page: 'home', label: 'Home', icon: <Home size={20} /> },
      { page: 'movies', label: 'Movies', icon: <Film size={20} /> },
      { page: 'tvshows', label: 'TV Shows', icon: <Tv size={20} /> },
      { page: 'livetv', label: 'Live TV', icon: <Radio size={20} /> },
      { page: 'sports', label: 'Sports', icon: <Trophy size={20} /> },
    ],
  },
  {
    label: 'Library',
    items: [
      { page: 'watchlist', label: 'Watchlist', icon: <Bookmark size={20} /> },
      { page: 'history', label: 'History', icon: <RotateCcw size={20} /> },
    ],
  },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarCollapsed, setSidebarCollapsed, watchlist } = useApp();

  const isActive = (page: PageType) => currentPage === page;

  return (
    <aside
      className="hidden lg:flex flex-col h-screen bg-[#14141f] border-r border-[rgba(139,92,246,0.15)] transition-all duration-300 z-40 shrink-0"
      style={{ width: sidebarCollapsed ? 60 : 200 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-[rgba(139,92,246,0.15)]">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-black border border-[rgba(255,255,255,0.12)] flex items-center justify-center">
          <span className="text-[11px] font-black tracking-tighter text-white leading-none">
            B<span className="text-[#8b5cf6]">TV</span>
          </span>
        </div>
        {!sidebarCollapsed && (
          <span className="text-lg font-extrabold tracking-tight text-[#f1f1f4] whitespace-nowrap">
            Blvck<span className="text-[#8b5cf6]">TV</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-6 overflow-y-auto">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!sidebarCollapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map(item => (
                <button
                  key={item.page}
                  onClick={() => setCurrentPage(item.page)}
                  className={`
                    flex items-center w-full gap-3 h-10 rounded-lg transition-all duration-150 relative
                    ${isActive(item.page)
                      ? 'bg-gradient-to-r from-[rgba(139,92,246,0.2)] to-transparent text-[#f1f1f4]'
                      : 'text-[#9ca3af] hover:bg-[#1e1e2d] hover:text-[#f1f1f4]'
                    }
                    ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
                  `}
                >
                  {isActive(item.page) && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-[#8b5cf6]" />
                  )}
                  <span className="shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <span className="text-[13px] font-semibold whitespace-nowrap">{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.page === 'watchlist' && watchlist.length > 0 && (
                    <span className="ml-auto text-[10px] bg-[#1e1e2d] text-[#9ca3af] rounded-full px-2 py-0.5">
                      {watchlist.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div className="px-2 pb-1">
        <button
          type="button"
          onClick={() => setCurrentPage('settings')}
          className={`
            flex items-center w-full gap-3 h-10 rounded-lg transition-all duration-150 relative
            ${isActive('settings')
              ? 'bg-gradient-to-r from-[rgba(139,92,246,0.2)] to-transparent text-[#f1f1f4]'
              : 'text-[#9ca3af] hover:bg-[#1e1e2d] hover:text-[#f1f1f4]'
            }
            ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
          `}
        >
          {isActive('settings') && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-[#8b5cf6]" />
          )}
          <span className="shrink-0"><Settings size={20} /></span>
          {!sidebarCollapsed && (
            <span className="text-[13px] font-semibold whitespace-nowrap">Settings</span>
          )}
        </button>
      </div>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-[rgba(139,92,246,0.15)]">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex items-center justify-center w-full h-10 rounded-lg text-[#6b7280] hover:bg-[#1e1e2d] hover:text-[#9ca3af] transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : (
            <div className="flex items-center gap-2">
              <ChevronLeft size={18} />
              <span className="text-xs font-medium">Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
