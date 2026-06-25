import { useState } from 'react';
import type { FilterState, MovieCatalogMode, TVCatalogMode } from '@/types';
import { GENRES, MOVIE_GENRE_IDS, TV_GENRE_IDS } from '@/hooks/useTMDB';
import { useIsMobileLayout } from '@/hooks/useMediaQuery';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { SlidersHorizontal } from 'lucide-react';

type CatalogFilterBarProps = {
  type: 'movie' | 'tv';
  filter: FilterState;
  onChange: (filter: FilterState) => void;
  totalResults?: number;
};

const MOVIE_MODES: { id: MovieCatalogMode; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'trending', label: 'Trending' },
  { id: 'top_rated', label: 'Top Rated' },
  { id: 'now_playing', label: 'Now Playing' },
  { id: 'upcoming', label: 'Upcoming' },
];

const TV_MODES: { id: TVCatalogMode; label: string }[] = [
  { id: 'popular', label: 'Popular' },
  { id: 'trending', label: 'Trending' },
  { id: 'top_rated', label: 'Top Rated' },
  { id: 'on_air', label: 'On The Air' },
  { id: 'airing_today', label: 'Airing Today' },
];

const COUNTRY_OPTIONS = [
  { code: '', label: 'All Countries' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'IN', label: 'India' },
  { code: 'KR', label: 'South Korea' },
  { code: 'JP', label: 'Japan' },
  { code: 'FR', label: 'France' },
  { code: 'DE', label: 'Germany' },
  { code: 'ES', label: 'Spain' },
  { code: 'IT', label: 'Italy' },
  { code: 'AU', label: 'Australia' },
];

const SORT_OPTIONS: { value: FilterState['sortBy']; label: string }[] = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Rating' },
  { value: 'az', label: 'A–Z' },
];

function countActiveFilters(filter: FilterState): number {
  let n = 0;
  if (filter.genre) n++;
  if (filter.yearFrom) n++;
  if (filter.yearTo) n++;
  if (filter.ratingMin > 0) n++;
  if (filter.country) n++;
  return n;
}

function FilterFields({
  type,
  filter,
  onChange,
  stacked = false,
}: {
  type: 'movie' | 'tv';
  filter: FilterState;
  onChange: (filter: FilterState) => void;
  stacked?: boolean;
}) {
  const genreIds = type === 'movie' ? MOVIE_GENRE_IDS : TV_GENRE_IDS;
  const fieldClass = stacked
    ? 'w-full bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-[#f1f1f4] text-sm rounded-xl px-4 py-3 outline-none focus:border-[#8b5cf6]'
    : 'bg-[#1e1e2d] border border-[rgba(139,92,246,0.15)] text-[#f1f1f4] text-xs rounded-lg px-3 py-2 outline-none focus:border-[#8b5cf6] min-w-[120px]';

  return (
    <>
      <label className={stacked ? 'block space-y-1.5' : undefined}>
        {stacked && <span className="text-xs font-semibold text-[#9ca3af]">Genre</span>}
        <select
          value={filter.genre}
          onChange={(e) => onChange({ ...filter, genre: e.target.value })}
          className={fieldClass}
        >
          <option value="">All Genres</option>
          {GENRES.filter(g => genreIds.includes(g.id)).map(g => (
            <option key={g.id} value={g.name}>{g.name}</option>
          ))}
        </select>
      </label>

      <div className={stacked ? 'grid grid-cols-2 gap-3' : 'contents'}>
        <label className={stacked ? 'block space-y-1.5' : undefined}>
          {stacked && <span className="text-xs font-semibold text-[#9ca3af]">Year from</span>}
          <input
            type="number"
            placeholder="From"
            inputMode="numeric"
            value={filter.yearFrom}
            onChange={(e) => onChange({ ...filter, yearFrom: e.target.value })}
            min="1900"
            max="2030"
            className={stacked ? fieldClass : `${fieldClass} w-20`}
          />
        </label>
        <label className={stacked ? 'block space-y-1.5' : undefined}>
          {stacked && <span className="text-xs font-semibold text-[#9ca3af]">Year to</span>}
          <input
            type="number"
            placeholder="To"
            inputMode="numeric"
            value={filter.yearTo}
            onChange={(e) => onChange({ ...filter, yearTo: e.target.value })}
            min="1900"
            max="2030"
            className={stacked ? fieldClass : `${fieldClass} w-20`}
          />
        </label>
      </div>

      <label className={stacked ? 'block space-y-2' : 'flex items-center gap-2'}>
        {stacked ? (
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9ca3af]">Minimum rating</span>
            <span className="text-sm font-bold text-[#f1f1f4] tabular-nums">{filter.ratingMin || '0'}</span>
          </div>
        ) : (
          <>
            <span className="text-xs text-[#6b7280] hidden sm:inline">Rating</span>
            <span className="text-xs text-[#f1f1f4] w-6 tabular-nums">{filter.ratingMin || '0'}</span>
          </>
        )}
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={filter.ratingMin}
          onChange={(e) => onChange({ ...filter, ratingMin: Number(e.target.value) })}
          className={stacked ? 'w-full accent-[#8b5cf6] h-2' : 'w-20 sm:w-24 accent-[#8b5cf6]'}
        />
      </label>

      <label className={stacked ? 'block space-y-1.5' : undefined}>
        {stacked && <span className="text-xs font-semibold text-[#9ca3af]">Country</span>}
        <select
          value={filter.country}
          onChange={(e) => onChange({ ...filter, country: e.target.value })}
          className={fieldClass}
        >
          {COUNTRY_OPTIONS.map(c => (
            <option key={c.code || 'all'} value={c.code}>{c.label}</option>
          ))}
        </select>
      </label>

      <label className={stacked ? 'block space-y-1.5' : undefined}>
        {stacked && <span className="text-xs font-semibold text-[#9ca3af]">Sort by</span>}
        <select
          value={filter.sortBy}
          onChange={(e) => onChange({ ...filter, sortBy: e.target.value as FilterState['sortBy'] })}
          className={fieldClass}
        >
          {SORT_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>
    </>
  );
}

export default function CatalogFilterBar({ type, filter, onChange, totalResults }: CatalogFilterBarProps) {
  const isMobile = useIsMobileLayout();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(filter);

  const modes = type === 'movie' ? MOVIE_MODES : TV_MODES;
  const activeCount = countActiveFilters(filter);
  const hasActiveFilters = activeCount > 0;

  const clearFilters = () => {
    const cleared: FilterState = {
      ...filter,
      genre: '',
      yearFrom: '',
      yearTo: '',
      ratingMin: 0,
      country: '',
      sortBy: 'popularity',
    };
    onChange(cleared);
    setDraft(cleared);
  };

  const openSheet = () => {
    setDraft(filter);
    setSheetOpen(true);
  };

  const applyDraft = () => {
    onChange(draft);
    setSheetOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Quick mode tabs — horizontal scroll on all sizes */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1 snap-x snap-mandatory">
        {modes.map(mode => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange({ ...filter, mode: mode.id })}
            className={`touch-target shrink-0 snap-start px-4 py-2.5 rounded-full text-xs font-bold transition-colors min-h-[40px] ${
              filter.mode === mode.id
                ? 'bg-[#8b5cf6] text-white shadow-[0_0_12px_rgba(139,92,246,0.35)]'
                : 'bg-[#1e1e2d] text-[#9ca3af] active:bg-[#2a2a3d] active:text-[#f1f1f4]'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {isMobile ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openSheet}
            className="touch-target flex flex-1 items-center justify-center gap-2 min-h-[44px] rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.2)] text-sm font-semibold text-[#f1f1f4]"
          >
            <SlidersHorizontal size={16} className="text-[#8b5cf6]" />
            Filters & Sort
            {activeCount > 0 && (
              <span className="rounded-full bg-[#8b5cf6] px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
                {activeCount}
              </span>
            )}
          </button>

          {totalResults !== undefined && (
            <span className="shrink-0 text-xs text-[#6b7280] tabular-nums px-1">
              {totalResults.toLocaleString()}
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.15)]">
          <FilterFields type={type} filter={filter} onChange={onChange} />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-[#8b5cf6] hover:text-[#06b6d4] font-semibold ml-auto"
            >
              Clear filters
            </button>
          )}

          {totalResults !== undefined && (
            <span className="text-xs text-[#6b7280] ml-auto tabular-nums">
              {totalResults.toLocaleString()} titles
            </span>
          )}
        </div>
      )}

      {/* Active chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {filter.genre && (
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] text-xs font-semibold">
              {filter.genre}
              <button type="button" onClick={() => onChange({ ...filter, genre: '' })} className="touch-target min-w-[28px] min-h-[28px] flex items-center justify-center hover:text-[#f1f1f4]">&times;</button>
            </span>
          )}
          {filter.yearFrom && (
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] text-xs font-semibold">
              From {filter.yearFrom}
              <button type="button" onClick={() => onChange({ ...filter, yearFrom: '' })} className="touch-target min-w-[28px] min-h-[28px] flex items-center justify-center hover:text-[#f1f1f4]">&times;</button>
            </span>
          )}
          {filter.yearTo && (
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] text-xs font-semibold">
              To {filter.yearTo}
              <button type="button" onClick={() => onChange({ ...filter, yearTo: '' })} className="touch-target min-w-[28px] min-h-[28px] flex items-center justify-center hover:text-[#f1f1f4]">&times;</button>
            </span>
          )}
          {filter.ratingMin > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] text-xs font-semibold">
              ★ {filter.ratingMin}+
              <button type="button" onClick={() => onChange({ ...filter, ratingMin: 0 })} className="touch-target min-w-[28px] min-h-[28px] flex items-center justify-center hover:text-[#f1f1f4]">&times;</button>
            </span>
          )}
          {filter.country && (
            <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[rgba(139,92,246,0.15)] text-[#8b5cf6] text-xs font-semibold">
              {filter.country}
              <button type="button" onClick={() => onChange({ ...filter, country: '' })} className="touch-target min-w-[28px] min-h-[28px] flex items-center justify-center hover:text-[#f1f1f4]">&times;</button>
            </span>
          )}
          {isMobile && (
            <button type="button" onClick={clearFilters} className="text-xs text-[#8b5cf6] font-semibold px-2 py-1">
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Mobile filter sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[20px] border-[rgba(139,92,246,0.15)] bg-[#14141f] px-0 pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto"
        >
          <SheetHeader className="px-5 pb-3 border-b border-[rgba(139,92,246,0.1)]">
            <SheetTitle className="text-[#f1f1f4] text-left text-base font-extrabold">
              Filters & Sort
            </SheetTitle>
          </SheetHeader>

          <div className="px-5 py-4 space-y-4">
            <FilterFields type={type} filter={draft} onChange={setDraft} stacked />
          </div>

          <SheetFooter className="px-5 flex-row gap-2 border-t border-[rgba(139,92,246,0.1)] pt-4">
            <button
              type="button"
              onClick={() => { clearFilters(); setSheetOpen(false); }}
              className="touch-target flex-1 min-h-[48px] rounded-xl border border-[rgba(139,92,246,0.2)] text-sm font-semibold text-[#9ca3af]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={applyDraft}
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
