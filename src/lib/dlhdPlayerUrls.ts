export const DLHD_REFERER = 'https://dlhd.pk/';

/** Direct HLS player used inside dlhd.pk wrappers when the site is up. */
export const DLHD_DIRECT_PLAYER_BASE = 'https://hamis.romponalis.st/premiumtv/daddy3.php';

export function normalizeChannelId(channelId: string): string {
  return channelId.replace(/\D/g, '') || channelId;
}

export function getDirectPlayerUrl(channelId: string): string {
  return `${DLHD_DIRECT_PLAYER_BASE}?id=${normalizeChannelId(channelId)}`;
}

export function getDlhdWrapperUrl(path: string, channelId: string): string {
  const id = normalizeChannelId(channelId);
  return `https://dlhd.pk/${path}/stream-${id}.php`;
}

/** True when HTML is a wrapper iframe page or a self-contained Clappr player. */
export function isPlayableStreamHtml(html: string): boolean {
  if (html.length < 200) return false;
  if (
    /404 not found|page could not be found/i.test(html) &&
    !/<iframe/i.test(html) &&
    !/Clappr\.Player/i.test(html)
  ) {
    return false;
  }
  return (
    /<iframe[^>]+src=["']https?:\/\//i.test(html) ||
    /new Clappr\.Player/i.test(html) ||
    /window\.atob\([^)]+\)/i.test(html) ||
    /Hls\.isSupported/i.test(html)
  );
}
