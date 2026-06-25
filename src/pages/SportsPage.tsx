import { useMemo, useState, useCallback, type KeyboardEvent } from 'react';
import ChannelCard from '@/components/ChannelCard';
import { useApp } from '@/context/AppContext';
import { useChannels } from '@/hooks/useChannels';
import {
  getLiveEvents,
  getMajorUpcoming,
  getScheduleEvents,
  getWorldCupUpcoming,
  formatEventDate,
  formatEventTime,
  timeUntilEvent,
  type SportsEvent,
} from '@/lib/sportsEvents';
import { resolveSportsChannel } from '@/lib/sportsChannelResolver';
import { Bell, Calendar, Clock, Globe, Play, Radio, Trophy } from 'lucide-react';

const DATE_TABS = ['Today', 'Tomorrow', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];

function useWatchEvent() {
  const { setSelectedChannel, showToast } = useApp();
  const { channels } = useChannels();

  return useCallback(
    (event: SportsEvent) => {
      const resolved = resolveSportsChannel(
        { channelId: event.channelId, channel: event.channel, channelName: event.channelName },
        channels,
      );
      if (!resolved) {
        showToast(`No stream found for ${event.channel}`, 'error');
        return;
      }
      setSelectedChannel(resolved);
    },
    [setSelectedChannel, channels, showToast],
  );
}

function useCanWatchEvent(event: SportsEvent, channels: ReturnType<typeof useChannels>['channels']): boolean {
  return Boolean(
    resolveSportsChannel(
      { channelId: event.channelId, channel: event.channel, channelName: event.channelName },
      channels,
    ),
  );
}

function WatchButton({
  event,
  label = 'Watch',
  variant = 'default',
}: {
  event: SportsEvent;
  label?: string;
  variant?: 'default' | 'live';
}) {
  const watchEvent = useWatchEvent();
  const { channels } = useChannels();
  const canWatch = useCanWatchEvent(event, channels);
  if (!canWatch) return null;

  const isLive = variant === 'live';

  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        watchEvent(event);
      }}
      className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-lg px-3 py-1.5 transition-colors shrink-0 ${
        isLive
          ? 'text-white bg-[#ef4444] hover:bg-[#dc2626]'
          : 'text-[#8b5cf6] bg-[rgba(139,92,246,0.15)] hover:bg-[rgba(139,92,246,0.25)]'
      }`}
    >
      <Play size={12} fill="currentColor" />
      {label}
    </button>
  );
}

function LiveBadge({ minute }: { minute?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#ef4444]">
      <span className="live-dot" />
      Live{minute ? ` · ${minute}` : ''}
    </span>
  );
}

function LeagueBadge({ league }: { league: SportsEvent['league'] }) {
  const isWorldCup = league === 'World Cup';
  return (
    <span
      className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${
        isWorldCup
          ? 'text-[#f59e0b] bg-[rgba(245,158,11,0.15)]'
          : 'text-[#8b5cf6] bg-[rgba(139,92,246,0.15)]'
      }`}
    >
      {league}
    </span>
  );
}

function LiveMatchCard({ event }: { event: SportsEvent }) {
  const watchEvent = useWatchEvent();
  const { channels } = useChannels();
  const canWatch = useCanWatchEvent(event, channels);

  const handleClick = () => {
    if (canWatch) watchEvent(event);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (canWatch && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      watchEvent(event);
    }
  };

  return (
    <div
      role={canWatch ? 'button' : undefined}
      tabIndex={canWatch ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative p-5 rounded-2xl overflow-hidden border-2 border-[rgba(239,68,68,0.45)] transition-colors hover:border-[rgba(239,68,68,0.65)] ${
        canWatch ? 'cursor-pointer' : ''
      }`}
      style={{
        background:
          'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(20,20,31,0.95) 45%, rgba(30,30,45,0.9) 100%)',
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(239,68,68,0.06)] rounded-full -translate-y-10 translate-x-10" />
      <div className="flex items-center justify-between gap-2 mb-3">
        <LeagueBadge league={event.league} />
        <LiveBadge minute={event.liveMinute} />
      </div>
      <h3 className="text-lg font-extrabold text-[#f1f1f4]">{event.name}</h3>
      <p className="text-xs text-[#9ca3af] mt-1">{event.teams}</p>
      {event.subtitle && (
        <p className="text-[11px] text-[#6b7280] mt-0.5">{event.subtitle}</p>
      )}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(239,68,68,0.15)]">
        <span className="text-xs font-semibold text-[#8b5cf6]">
          {event.channelName ?? event.channel}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#6b7280]">Started {formatEventTime(event.startTime)}</span>
          {canWatch && <WatchButton event={event} label="Watch Live" variant="live" />}
        </div>
      </div>
    </div>
  );
}

function UpcomingEventRow({ event }: { event: SportsEvent }) {
  const { channels } = useChannels();
  const canWatch = useCanWatchEvent(event, channels);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#14141f] border border-[rgba(139,92,246,0.1)] hover:border-[rgba(139,92,246,0.3)] transition-colors">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
          event.league === 'World Cup' ? 'bg-[rgba(245,158,11,0.12)]' : 'bg-[#1e1e2d]'
        }`}
      >
        {event.league === 'World Cup' ? (
          <Globe size={20} className="text-[#f59e0b]" />
        ) : (
          <Trophy size={20} className="text-[#f59e0b]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <LeagueBadge league={event.league} />
        </div>
        <h3 className="text-sm font-semibold text-[#f1f1f4] mt-1 truncate">{event.name}</h3>
        <p className="text-xs text-[#6b7280]">{event.teams}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-[#f1f1f4]">{formatEventTime(event.startTime)}</p>
        <p className="text-[10px] text-[#06b6d4]">{timeUntilEvent(event.startTime)}</p>
        <span className="text-[10px] text-[#6b7280] mt-1 block">{event.channelName ?? event.channel}</span>
      </div>
      {canWatch ? (
        <WatchButton event={event} label="Watch" />
      ) : (
        <button
          type="button"
          className="w-8 h-8 rounded-full bg-[#1e1e2d] flex items-center justify-center text-[#6b7280] hover:text-[#f59e0b] transition-colors shrink-0"
          title="Set reminder"
        >
          <Bell size={14} />
        </button>
      )}
    </div>
  );
}

function MajorEventCard({ event }: { event: SportsEvent }) {
  const accent =
    event.league === 'Euro' || event.league === 'Olympics'
      ? 'border-[rgba(6,182,212,0.25)]'
      : 'border-[rgba(139,92,246,0.15)]';

  return (
    <div
      className={`relative p-5 rounded-xl overflow-hidden bg-gradient-to-br from-[#14141f] to-[#1e1e2d] border ${accent}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-[rgba(139,92,246,0.05)] rounded-full -translate-y-8 translate-x-8" />
      <span className="text-[10px] font-bold text-[#f59e0b] bg-[rgba(245,158,11,0.15)] rounded px-2 py-0.5">
        {event.league}
      </span>
      <h3 className="text-base font-bold text-[#f1f1f4] mt-2">{event.name}</h3>
      <p className="text-xs text-[#9ca3af] mt-1">{event.teams}</p>
      {event.subtitle && (
        <p className="text-[11px] text-[#6b7280] mt-0.5">{event.subtitle}</p>
      )}
      <div className="flex items-center gap-4 mt-3 text-xs text-[#6b7280]">
        <span className="flex items-center gap-1">
          <Calendar size={12} /> {formatEventDate(event.startTime)}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} /> {formatEventTime(event.startTime)}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-[#8b5cf6]">{event.channelName ?? event.channel}</p>
        <WatchButton event={event} label="Watch" />
      </div>
    </div>
  );
}

export default function SportsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const { sportsChannels } = useChannels();

  const liveEvents = useMemo(() => getLiveEvents(), []);
  const worldCupUpcoming = useMemo(() => getWorldCupUpcoming(), []);
  const scheduleEvents = useMemo(() => getScheduleEvents(), []);
  const majorEvents = useMemo(() => getMajorUpcoming(), []);

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy size={24} className="text-[#f59e0b]" />
        <h1 className="text-2xl font-extrabold text-[#f1f1f4]">Sports</h1>
      </div>

      {/* Live Now — only actually-live matches */}
      <section id="live-now">
        <div className="flex items-center gap-2 mb-4">
          <Radio size={18} className="text-[#ef4444]" />
          <h2 className="text-lg font-bold text-[#f1f1f4]">Live Now</h2>
          <span className="live-dot" />
          <span className="text-xs font-semibold text-[#9ca3af]">
            {liveEvents.length} {liveEvents.length === 1 ? 'match' : 'matches'}
          </span>
        </div>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
        >
          {liveEvents.map(event => (
            <LiveMatchCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* World Cup 2026 — banner + upcoming only (no live mixed in) */}
      <section>
        <div
          className="relative p-6 rounded-2xl overflow-hidden border border-[rgba(245,158,11,0.25)]"
          style={{
            background:
              'linear-gradient(135deg, rgba(20,20,31,0.95) 0%, rgba(30,30,45,0.9) 100%)',
          }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-[rgba(245,158,11,0.06)] rounded-full -translate-y-12 translate-x-12" />

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-1">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-[#f59e0b]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b]">
                FIFA World Cup 2026
              </span>
            </div>
            {liveEvents.length > 0 && (
              <a
                href="#live-now"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#ef4444] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] rounded-full px-2.5 py-1 hover:bg-[rgba(239,68,68,0.18)] transition-colors"
              >
                <span className="live-dot" />
                {liveEvents.length} live — jump to matches
              </a>
            )}
          </div>

          <h2 className="text-xl font-extrabold text-[#f1f1f4] mb-1">USA · Canada · Mexico</h2>
          <p className="text-xs text-[#6b7280] mb-5">Upcoming group stage &amp; knockout fixtures</p>

          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
          >
            {worldCupUpcoming.slice(0, 4).map(event => (
              <div
                key={event.id}
                className="p-4 rounded-xl bg-[rgba(0,0,0,0.35)] border border-[rgba(245,158,11,0.15)] hover:border-[rgba(245,158,11,0.35)] transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <LeagueBadge league={event.league} />
                  <span className="text-[10px] font-medium text-[#6b7280]">
                    {formatEventDate(event.startTime)}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#f1f1f4]">{event.name}</h3>
                <p className="text-xs text-[#9ca3af] mt-0.5">{event.teams}</p>
                {event.subtitle && (
                  <p className="text-[10px] text-[#6b7280] mt-0.5">{event.subtitle}</p>
                )}
                <div className="flex items-center justify-between mt-2 text-xs text-[#6b7280]">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {formatEventTime(event.startTime)}
                  </span>
                  <span className="text-[#8b5cf6]">{event.channelName ?? event.channel}</span>
                </div>
                <div className="mt-2 flex justify-end">
                  <WatchButton event={event} label="Watch" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule — regular upcoming (excludes live, WC spotlight, major cards) */}
      <section>
        <h2 className="text-sm font-bold text-[#f1f1f4] mb-3 uppercase tracking-wider">Schedule</h2>
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {DATE_TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0 ${
                activeTab === i
                  ? 'text-white'
                  : 'bg-[#1e1e2d] text-[#9ca3af] border border-[rgba(139,92,246,0.15)] hover:text-[#f1f1f4]'
              }`}
              style={activeTab === i ? { background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' } : {}}
            >
              {tab}
            </button>
          ))}
        </div>
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
        >
          {scheduleEvents.map(event => (
            <UpcomingEventRow key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* Sports channels */}
      <section>
        <h2 className="text-lg font-bold text-[#f1f1f4] mb-4">Sports Channels</h2>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
        >
          {sportsChannels.map(channel => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      </section>

      {/* Major events — Euro, Olympics, knockouts, etc. (no WC duplicates) */}
      <section>
        <h2 className="text-lg font-bold text-[#f1f1f4] mb-1">Major Events Coming Up</h2>
        <p className="text-xs text-[#6b7280] mb-4">
          Euro &amp; Olympics qualifiers, finals, and headline fixtures
        </p>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
        >
          {majorEvents.map(event => (
            <MajorEventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
}
