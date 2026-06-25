import { useEffect, useMemo, useState } from 'react';
import {
  buildDateTabs,
  getCurrentEvents,
  getEventsForDayOffset,
  getLiveEvents,
  getMajorUpcoming,
  getScheduleEvents,
  getWorldCupUpcoming,
} from '@/lib/sportsEvents';

const REFRESH_MS = 30_000;

/** Time-aware sports schedule — refreshes every 30s so live / soon / past stay accurate. */
export function useSportsEvents() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(
    () => ({
      now,
      liveEvents: getLiveEvents(now),
      currentEvents: getCurrentEvents(now),
      worldCupUpcoming: getWorldCupUpcoming(now),
      majorEvents: getMajorUpcoming(now),
      scheduleEvents: getScheduleEvents(now),
      dateTabs: buildDateTabs(now),
      eventsForDay: (offset: number) => getEventsForDayOffset(offset, now),
    }),
    [now],
  );
}
