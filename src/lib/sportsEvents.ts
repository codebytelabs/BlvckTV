export type SportsLeague =
  | 'World Cup'
  | 'WC Qualifiers'
  | 'Euro'
  | 'Olympics'
  | 'EPL'
  | 'NBA'
  | 'Tennis'
  | 'UFC'
  | 'UCL'
  | 'Cricket WC'
  | 'F1'
  | 'NHL'
  | 'NFL';

export interface SportsEvent {
  id: string;
  name: string;
  league: SportsLeague;
  teams: string;
  subtitle?: string;
  startTime: string;
  channel: string;
  /** DLHD stream id — enables Watch Live / Watch buttons */
  channelId?: string;
  /** Display name for the stream player */
  channelName?: string;
  /** Derived at runtime from startTime — do not rely on static values in data */
  isLive: boolean;
  isMajor?: boolean;
  liveMinute?: string;
}

export type EventStatus = 'live' | 'soon' | 'upcoming' | 'past';

const EVENT_DURATION_MS: Partial<Record<SportsLeague, number>> = {
  'World Cup': 2.25 * 60 * 60 * 1000,
  'WC Qualifiers': 2.25 * 60 * 60 * 1000,
  Euro: 2.25 * 60 * 60 * 1000,
  EPL: 2.25 * 60 * 60 * 1000,
  UCL: 2.25 * 60 * 60 * 1000,
  Olympics: 2.25 * 60 * 60 * 1000,
  NBA: 2.75 * 60 * 60 * 1000,
  NHL: 3 * 60 * 60 * 1000,
  NFL: 3.5 * 60 * 60 * 1000,
  Tennis: 4 * 60 * 60 * 1000,
  UFC: 4 * 60 * 60 * 1000,
  F1: 3 * 60 * 60 * 1000,
  'Cricket WC': 5 * 60 * 60 * 1000,
};

const DEFAULT_EVENT_DURATION_MS = 3 * 60 * 60 * 1000;
const STARTING_SOON_MS = 90 * 60 * 1000;

function getEventDurationMs(league: SportsLeague): number {
  return EVENT_DURATION_MS[league] ?? DEFAULT_EVENT_DURATION_MS;
}

export function resolveEventStatus(event: SportsEvent, now = Date.now()): EventStatus {
  const start = new Date(event.startTime).getTime();
  const end = start + getEventDurationMs(event.league);

  if (now >= start && now < end) return 'live';
  if (now < start && start - now <= STARTING_SOON_MS) return 'soon';
  if (now < start) return 'upcoming';
  return 'past';
}

function computeLiveMinute(startTime: string, league: SportsLeague): string {
  const elapsedMin = Math.floor((Date.now() - new Date(startTime).getTime()) / 60000);
  const isFootball = ['World Cup', 'WC Qualifiers', 'Euro', 'EPL', 'UCL', 'Olympics'].includes(league);

  if (isFootball) {
    if (elapsedMin >= 105) return 'FT';
    if (elapsedMin > 45 && elapsedMin <= 60) return 'HT';
    return `${Math.min(elapsedMin, 90)}'`;
  }

  return `${elapsedMin}'`;
}

/** Attach live / soon state from wall-clock time (ignores stale static flags). */
export function enrichSportsEvent(event: SportsEvent, now = Date.now()): SportsEvent {
  const status = resolveEventStatus(event, now);
  return {
    ...event,
    isLive: status === 'live',
    liveMinute: status === 'live' ? computeLiveMinute(event.startTime, event.league) : undefined,
  };
}

function enrichAll(now = Date.now()): SportsEvent[] {
  return SPORTS_EVENTS.map(event => enrichSportsEvent(event, now));
}

function isUpcoming(event: SportsEvent, now = Date.now()): boolean {
  const status = resolveEventStatus(event, now);
  return status === 'upcoming' || status === 'soon';
}

export const SPORTS_EVENTS: SportsEvent[] = [
  // ── Live now (June 25, 2026) ──────────────────────────────────────────────
  {
    id: 'live-wc-can-mex',
    name: 'Canada vs Mexico',
    league: 'World Cup',
    teams: 'Group B — Matchday 2',
    subtitle: 'BC Place, Vancouver',
    startTime: '2026-06-25T17:00:00',
    channel: 'TSN1',
    channelId: '111',
    channelName: 'TSN1',
    isLive: true,
    isMajor: true,
    liveMinute: "58'",
  },
  {
    id: 'live-wc-qual-bh-qat',
    name: 'Bahrain vs Qatar',
    league: 'WC Qualifiers',
    teams: 'Asia — Round 3',
    subtitle: 'Bahrain National Stadium',
    startTime: '2026-06-25T17:30:00',
    channel: 'beIN Sports',
    channelId: '425',
    channelName: 'BeIN SPORTS USA',
    isLive: true,
    isMajor: true,
    liveMinute: "41'",
  },

  // ── FIFA World Cup 2026 — upcoming ─────────────────────────────────────────
  {
    id: 'wc-bra-mar',
    name: 'Brazil vs Morocco',
    league: 'World Cup',
    teams: 'Group C — Matchday 2',
    subtitle: 'MetLife Stadium, NJ',
    startTime: '2026-06-25T19:00:00',
    channel: 'Fox Sports',
    channelId: '39',
    channelName: 'Fox Sports 1',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'wc-eng-jpn',
    name: 'England vs Japan',
    league: 'World Cup',
    teams: 'Group D — Matchday 2',
    subtitle: 'SoFi Stadium, LA',
    startTime: '2026-06-25T22:00:00',
    channel: 'FS1',
    channelId: '39',
    channelName: 'Fox Sports 1',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'wc-usa-ned',
    name: 'USA vs Netherlands',
    league: 'World Cup',
    teams: 'Group E — Matchday 2',
    subtitle: 'Lincoln Financial Field, Philly',
    startTime: '2026-06-26T18:00:00',
    channel: 'Fox Sports',
    channelId: '39',
    channelName: 'Fox Sports 1',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'wc-arg-fra',
    name: 'Argentina vs France',
    league: 'World Cup',
    teams: 'Group F — Matchday 2',
    subtitle: 'Hard Rock Stadium, Miami',
    startTime: '2026-06-26T21:00:00',
    channel: 'Telemundo',
    channelId: '131',
    channelName: 'Telemundo',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'wc-ger-esp',
    name: 'Germany vs Spain',
    league: 'World Cup',
    teams: 'Group G — Matchday 3',
    subtitle: 'Mercedes-Benz Stadium, Atlanta',
    startTime: '2026-06-28T17:00:00',
    channel: 'Fox Sports',
    channelId: '39',
    channelName: 'Fox Sports 1 USA',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'wc-r16',
    name: 'Round of 16 — TBD vs TBD',
    league: 'World Cup',
    teams: 'Knockout Stage',
    subtitle: 'AT&T Stadium, Dallas',
    startTime: '2026-07-01T20:00:00',
    channel: 'Fox Sports',
    channelId: '39',
    channelName: 'Fox Sports 1 USA',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'wc-qf',
    name: 'Quarter-Final — TBD vs TBD',
    league: 'World Cup',
    teams: 'Knockout Stage',
    subtitle: 'Lumen Field, Seattle',
    startTime: '2026-07-05T19:00:00',
    channel: 'Fox Sports',
    channelId: '39',
    channelName: 'Fox Sports 1 USA',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'wc-sf',
    name: 'Semi-Final — TBD vs TBD',
    league: 'World Cup',
    teams: 'Knockout Stage',
    subtitle: 'Arrowhead Stadium, Kansas City',
    startTime: '2026-07-09T20:00:00',
    channel: 'Fox Sports',
    channelId: '39',
    channelName: 'Fox Sports 1 USA',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'wc-final',
    name: 'World Cup Final',
    league: 'World Cup',
    teams: 'TBD vs TBD',
    subtitle: 'MetLife Stadium, NJ',
    startTime: '2026-07-19T15:00:00',
    channel: 'Fox Sports',
    channelId: '39',
    channelName: 'Fox Sports 1 USA',
    isLive: false,
    isMajor: true,
  },

  // ── Major events (non–World Cup) ───────────────────────────────────────────
  {
    id: 'euro-qual-ger-ita',
    name: 'Germany vs Italy',
    league: 'Euro',
    teams: 'Euro 2028 Qualifiers — Group A',
    subtitle: 'Allianz Arena, Munich',
    startTime: '2026-06-26T19:45:00',
    channel: 'ESPN+',
    channelId: '44',
    channelName: 'ESPN USA',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'euro-qual-esp-por',
    name: 'Spain vs Portugal',
    league: 'Euro',
    teams: 'Euro 2028 Qualifiers — Group B',
    subtitle: 'Santiago Bernabéu, Madrid',
    startTime: '2026-06-27T20:45:00',
    channel: 'ESPN+',
    channelId: '44',
    channelName: 'ESPN USA',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'oly-qual-usa-mex',
    name: 'USA vs Mexico',
    league: 'Olympics',
    teams: "Men's Football — Paris 2028 Qualifiers",
    subtitle: 'Rose Bowl, Pasadena',
    startTime: '2026-06-28T18:00:00',
    channel: 'NBC Sports',
    channelId: '753',
    channelName: 'NBC Sports Bay Area',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'oly-qual-jpn-kor',
    name: 'Japan vs South Korea',
    league: 'Olympics',
    teams: "Women's Football — Paris 2028 Qualifiers",
    subtitle: 'National Stadium, Tokyo',
    startTime: '2026-06-29T07:00:00',
    channel: 'Peacock',
    channelId: '343',
    channelName: 'USA Network',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'epl-ars-che',
    name: 'Arsenal vs Chelsea',
    league: 'EPL',
    teams: 'Premier League — Matchweek 38',
    startTime: '2026-06-27T14:00:00',
    channel: 'Sky Sports',
    channelId: '38',
    channelName: 'Sky Sports Main Event',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'nba-finals-g7',
    name: 'NBA Finals: Game 7',
    league: 'NBA',
    teams: 'Celtics vs Mavericks',
    startTime: '2026-06-27T20:30:00',
    channel: 'ESPN',
    channelId: '44',
    channelName: 'ESPN USA',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'wimbledon-final',
    name: "Wimbledon: Gentlemen's Final",
    league: 'Tennis',
    teams: 'Centre Court',
    startTime: '2026-07-12T09:00:00',
    channel: 'ESPN',
    channelId: '44',
    channelName: 'ESPN USA',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'ucl-rm-bay',
    name: 'Real Madrid vs Bayern Munich',
    league: 'UCL',
    teams: 'Champions League — Semi-Final Leg 2',
    startTime: '2026-07-02T21:00:00',
    channel: 'TNT',
    channelId: '338',
    channelName: 'TNT USA',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'cricket-t20-sf',
    name: 'India vs Australia',
    league: 'Cricket WC',
    teams: 'T20 World Cup — Semi-Final',
    startTime: '2026-07-04T10:30:00',
    channel: 'Willow TV',
    channelId: '346',
    channelName: 'Willow Cricket',
    isLive: false,
    isMajor: true,
  },
  {
    id: 'f1-british-gp',
    name: 'British Grand Prix',
    league: 'F1',
    teams: 'Silverstone — Race Day',
    startTime: '2026-07-06T14:00:00',
    channel: 'Sky Sports',
    channelId: '60',
    channelName: 'Sky Sports F1 UK',
    isLive: false,
    isMajor: true,
  },

  // ── Regular schedule ───────────────────────────────────────────────────────
  {
    id: 'ufc-320',
    name: 'UFC 320: Main Event',
    league: 'UFC',
    teams: 'Lightweight Title Fight',
    startTime: '2026-06-28T23:00:00',
    channel: 'ESPN+',
    channelId: '44',
    channelName: 'ESPN USA',
    isLive: false,
  },
  {
    id: 'nhl-rangers-bruins',
    name: 'Rangers vs Bruins',
    league: 'NHL',
    teams: 'Stanley Cup Playoffs — Game 5',
    startTime: '2026-06-29T20:00:00',
    channel: 'TNT',
    channelId: '338',
    channelName: 'TNT USA',
    isLive: false,
  },
  {
    id: 'nfl-preseason',
    name: 'Chiefs vs Bills',
    league: 'NFL',
    teams: 'NFL Preseason Week 1',
    startTime: '2026-08-15T18:00:00',
    channel: 'CBS',
    channelId: '52',
    channelName: 'CBS USA',
    isLive: false,
  },
];

export function getLiveEvents(now = Date.now()): SportsEvent[] {
  return enrichAll(now)
    .filter(e => resolveEventStatus(e, now) === 'live')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function getStartingSoonEvents(now = Date.now()): SportsEvent[] {
  return enrichAll(now)
    .filter(e => resolveEventStatus(e, now) === 'soon')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

/** Live + starting within 90 minutes — shown in "Live Now" */
export function getCurrentEvents(now = Date.now()): SportsEvent[] {
  return enrichAll(now)
    .filter(e => {
      const status = resolveEventStatus(e, now);
      return status === 'live' || status === 'soon';
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function getWorldCupUpcoming(now = Date.now()): SportsEvent[] {
  return enrichAll(now)
    .filter(e => e.league === 'World Cup' && isUpcoming(e, now))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function getMajorUpcoming(now = Date.now()): SportsEvent[] {
  return enrichAll(now)
    .filter(e => e.isMajor && e.league !== 'World Cup' && isUpcoming(e, now))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function getScheduleEvents(now = Date.now()): SportsEvent[] {
  return enrichAll(now)
    .filter(e => !e.isMajor && isUpcoming(e, now))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function getEventsForDayOffset(dayOffset: number, now = Date.now()): SportsEvent[] {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  dayStart.setDate(dayStart.getDate() + dayOffset);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return enrichAll(now)
    .filter(e => {
      if (resolveEventStatus(e, now) === 'past') return false;
      const t = new Date(e.startTime).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function buildDateTabs(now = Date.now()): Array<{ label: string; offset: number }> {
  return Array.from({ length: 7 }, (_, offset) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const label =
      offset === 0
        ? 'Today'
        : offset === 1
          ? 'Tomorrow'
          : d.toLocaleDateString('en-US', { weekday: 'short' });
    return { label, offset };
  });
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function timeUntilEvent(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return 'Started';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function isEventStartingSoon(event: SportsEvent, now = Date.now()): boolean {
  return resolveEventStatus(event, now) === 'soon';
}
