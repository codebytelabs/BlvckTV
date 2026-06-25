import { useMemo, useState } from 'react';
import { useChannelLogo } from '@/hooks/useChannelLogo';
import {
  getLiveEvents,
  getMajorUpcoming,
  getWorldCupUpcoming,
  formatEventTime,
  timeUntilEvent,
  type SportsEvent,
} from '@/lib/sportsEvents';
import { filterChannelsByQuery } from '@/lib/searchUtils';
import { getCategoryGradient } from '@/lib/channelLogos';
import { Play, Radio, Search, Trophy, Tv } from 'lucide-react';
import type { Channel } from '@/types';

type SidebarTab = 'channels' | 'sports';

type LivePlayerSidebarProps = {
  channels: Channel[];
  selectedChannelId: string;
  onSelectChannel: (channel: Channel) => void;
  onSelectSport: (event: SportsEvent) => void;
  className?: string;
  onNavigate?: () => void;
};

function ChannelRow({
  channel,
  isActive,
  onSelect,
}: {
  channel: Channel;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { logoUrl, loading } = useChannelLogo(channel.name, channel.logo);
  const gradient = getCategoryGradient(channel.category);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left transition-colors ${
        isActive
          ? 'bg-[rgba(139,92,246,0.2)] border border-[rgba(139,92,246,0.35)]'
          : 'hover:bg-[#1e1e2d] border border-transparent'
      }`}
    >
      <div
        className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
        style={{ background: logoUrl ? '#0a0a0f' : gradient }}
      >
        {loading ? (
          <div className="w-4 h-4 rounded skeleton opacity-40" />
        ) : logoUrl ? (
          <img src={logoUrl} alt="" className="max-w-[80%] max-h-[70%] object-contain" />
        ) : (
          <Tv size={14} className="text-[#c4b5fd]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#f1f1f4] truncate">{channel.name}</p>
        <p className="text-[10px] text-[#6b7280] truncate">{channel.category} · {channel.country}</p>
      </div>
      {channel.isLive && <span className="live-dot shrink-0" />}
    </button>
  );
}

function SportRow({
  event,
  onSelect,
}: {
  event: SportsEvent;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!event.channelId}
      className="flex flex-col gap-1 w-full px-3 py-2.5 rounded-lg text-left hover:bg-[#1e1e2d] border border-transparent hover:border-[rgba(139,92,246,0.15)] transition-colors disabled:opacity-40"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#f1f1f4] truncate">{event.teams || event.name}</span>
        {event.isLive ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-[#ef4444] shrink-0">
            <span className="live-dot" /> LIVE
          </span>
        ) : (
          <span className="text-[10px] text-[#6b7280] shrink-0">{timeUntilEvent(event.startTime)}</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-[#8b5cf6]">{event.league}</span>
        <span className="text-[10px] text-[#6b7280]">{formatEventTime(event.startTime)}</span>
      </div>
      {event.channelId && (
        <span className="inline-flex items-center gap-1 text-[10px] text-[#9ca3af]">
          <Play size={10} /> {event.channelName ?? event.channel}
        </span>
      )}
    </button>
  );
}

export default function LivePlayerSidebar({
  channels,
  selectedChannelId,
  onSelectChannel,
  onSelectSport,
  className = '',
  onNavigate,
}: LivePlayerSidebarProps) {
  const [tab, setTab] = useState<SidebarTab>('channels');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [sort, setSort] = useState<'az' | 'category'>('category');

  const liveEvents = useMemo(() => getLiveEvents(), []);
  const upcomingMajor = useMemo(
    () => [...getWorldCupUpcoming(), ...getMajorUpcoming()].slice(0, 8),
    [],
  );

  const categories = useMemo(
    () => [...new Set(channels.map(c => c.category))].sort(),
    [channels],
  );
  const countries = useMemo(
    () => [...new Set(channels.map(c => c.country))].sort(),
    [channels],
  );

  const filteredChannels = useMemo(() => {
    let list = filterChannelsByQuery(channels, search);
    if (category) list = list.filter(c => c.category === category);
    if (country) list = list.filter(c => c.country === country);
    if (sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else list = [...list].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return list;
  }, [channels, search, category, country, sort]);

  return (
    <aside className={`w-full lg:w-[340px] shrink-0 flex flex-col bg-[#0a0a0f] lg:border-l border-[rgba(139,92,246,0.1)] ${className}`}>
      {/* Live now banner */}
      {liveEvents.length > 0 && (
        <div className="p-3 border-b border-[rgba(139,92,246,0.1)]">
          <div className="flex items-center gap-2 mb-2">
            <Radio size={14} className="text-[#ef4444]" />
            <span className="text-xs font-bold text-[#f1f1f4] uppercase tracking-wide">Live Now</span>
          </div>
          <div className="space-y-1">
            {liveEvents.map(event => (
              <SportRow key={event.id} event={event} onSelect={() => { onSelectSport(event); onNavigate?.(); }} />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[rgba(139,92,246,0.1)]">
        {(['channels', 'sports'] as SidebarTab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-bold capitalize transition-colors ${
              tab === t
                ? 'text-[#8b5cf6] border-b-2 border-[#8b5cf6]'
                : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'channels' ? (
        <>
          <div className="p-3 space-y-2 border-b border-[rgba(139,92,246,0.08)]">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search channels…"
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#14141f] border border-[rgba(139,92,246,0.12)] text-xs text-[#f1f1f4] placeholder-[#6b7280] outline-none focus:border-[#8b5cf6]"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="flex-1 min-w-[80px] bg-[#14141f] border border-[rgba(139,92,246,0.12)] text-[#f1f1f4] text-[10px] rounded-lg px-2 py-1.5 outline-none"
              >
                <option value="">All genres</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="flex-1 min-w-[70px] bg-[#14141f] border border-[rgba(139,92,246,0.12)] text-[#f1f1f4] text-[10px] rounded-lg px-2 py-1.5 outline-none"
              >
                <option value="">All regions</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as 'az' | 'category')}
                className="bg-[#14141f] border border-[rgba(139,92,246,0.12)] text-[#f1f1f4] text-[10px] rounded-lg px-2 py-1.5 outline-none"
              >
                <option value="category">By genre</option>
                <option value="az">A–Z</option>
              </select>
            </div>
            <p className="text-[10px] text-[#6b7280] tabular-nums">{filteredChannels.length} channels</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredChannels.map(channel => (
              <ChannelRow
                key={channel.id}
                channel={channel}
                isActive={channel.id === selectedChannelId}
                onSelect={() => {
                  onSelectChannel(channel);
                  onNavigate?.();
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={14} className="text-[#8b5cf6]" />
              <span className="text-xs font-bold text-[#f1f1f4]">Upcoming Events</span>
            </div>
            <div className="space-y-1">
              {upcomingMajor.map(event => (
                <SportRow key={event.id} event={event} onSelect={() => { onSelectSport(event); onNavigate?.(); }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
