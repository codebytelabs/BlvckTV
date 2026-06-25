import { pickBestPlayerIframe, isDlhdHost, isBlockedUrl } from './adBlock';
import { getDlhdWrapperUrl } from './dlhdPlayerUrls';

export { isDlhdHost };

const IFRAME_RE = /<iframe[^>]+src=["']([^"']+)["']/gi;

export function extractIframeSrcs(html: string): string[] {
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  IFRAME_RE.lastIndex = 0;
  while ((match = IFRAME_RE.exec(html)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

export function toAbsoluteUrl(candidate: string, base: string): string {
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate;
  if (candidate.startsWith('//')) return `https:${candidate}`;
  return new URL(candidate, base).href;
}

export function pickInnerEmbed(candidates: string[], pageUrl: string): string | null {
  const absolute = candidates
    .map(c => toAbsoluteUrl(c, pageUrl))
    .filter(u => u.startsWith('http') && !isDlhdHost(u) && !isBlockedUrl(u));

  if (absolute.length === 0) return null;
  return pickBestPlayerIframe(absolute) ?? absolute[0];
}

export type FetchHtmlFn = (url: string) => Promise<string | null>;

const MAX_DEPTH = 3;

/**
 * Scrape ONLY the given DLHD mirror path's wrapper page for an embeddable player URL.
 * Never returns dlhd.pk — never uses a shared fallback URL across paths.
 */
export async function crawlInnerEmbedForPath(
  channelId: string,
  path: string,
  fetchHtml: FetchHtmlFn,
): Promise<string | null> {
  const wrapperUrl = getDlhdWrapperUrl(path, channelId);
  const visited = new Set<string>();

  async function crawl(pageUrl: string, depth: number): Promise<string | null> {
    if (depth > MAX_DEPTH || visited.has(pageUrl)) return null;
    visited.add(pageUrl);

    const html = await fetchHtml(pageUrl);
    if (!html) return null;

    const iframes = extractIframeSrcs(html);
    const direct = pickInnerEmbed(iframes, pageUrl);
    if (direct) return direct;

    for (const raw of iframes) {
      const next = toAbsoluteUrl(raw, pageUrl);
      const nested = await crawl(next, depth + 1);
      if (nested) return nested;
    }

    return null;
  }

  return crawl(wrapperUrl, 0);
}

export function wrapperPageUrl(path: string, channelId: string): string {
  return getDlhdWrapperUrl(path, channelId);
}
