import { useApp } from '@/context/AppContext';
import type { PageType } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Trophy, Bookmark, RotateCcw, Settings, ChevronRight } from 'lucide-react';

type MoreItem = {
  page: PageType;
  label: string;
  description: string;
  icon: React.ReactNode;
  badge?: number;
};

const MORE_ITEMS: MoreItem[] = [
  { page: 'sports', label: 'Sports', description: 'Live & upcoming events', icon: <Trophy size={20} /> },
  { page: 'watchlist', label: 'Watchlist', description: 'Saved titles', icon: <Bookmark size={20} /> },
  { page: 'history', label: 'History', description: 'Recently watched', icon: <RotateCcw size={20} /> },
  { page: 'settings', label: 'Settings', description: 'Sources & preferences', icon: <Settings size={20} /> },
];

type MobileMoreSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function MobileMoreSheet({ open, onOpenChange }: MobileMoreSheetProps) {
  const { currentPage, setCurrentPage, watchlist } = useApp();

  const navigate = (page: PageType) => {
    setCurrentPage(page);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] border-[rgba(139,92,246,0.15)] bg-[#14141f] px-0 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[70vh]"
      >
        <SheetHeader className="px-5 pb-2 border-b border-[rgba(139,92,246,0.1)]">
          <SheetTitle className="text-[#f1f1f4] text-left text-base font-extrabold">
            Browse
          </SheetTitle>
        </SheetHeader>

        <ul className="px-3 py-2 space-y-1">
          {MORE_ITEMS.map(item => {
            const active = currentPage === item.page;
            const badge = item.page === 'watchlist' ? watchlist.length : undefined;

            return (
              <li key={item.page}>
                <button
                  type="button"
                  onClick={() => navigate(item.page)}
                  className={`touch-target flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-colors ${
                    active
                      ? 'bg-[rgba(139,92,246,0.18)] border border-[rgba(139,92,246,0.35)]'
                      : 'hover:bg-[#1e1e2d] border border-transparent active:bg-[#1e1e2d]'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    active ? 'bg-[rgba(139,92,246,0.25)] text-[#8b5cf6]' : 'bg-[#1e1e2d] text-[#9ca3af]'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-[#f1f1f4]">{item.label}</span>
                    <span className="block text-xs text-[#6b7280]">{item.description}</span>
                  </span>
                  {badge !== undefined && badge > 0 && (
                    <span className="shrink-0 rounded-full bg-[#8b5cf6] px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
                      {badge}
                    </span>
                  )}
                  <ChevronRight size={16} className="shrink-0 text-[#6b7280]" />
                </button>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
