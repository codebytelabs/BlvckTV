const IPTV_CHANNELS_URL = 'https://iptv-org.github.io/api/channels.json';
const IPTV_LOGOS_URL = 'https://iptv-org.github.io/api/logos.json';
const CACHE_KEY = 'blvcktv-iptv-logos-v1';

type IptvChannel = {
  id: string;
  name: string;
  alt_names?: string[];
  country?: string;
};

type IptvLogo = {
  channel: string;
  url: string;
  format?: string | null;
};

type LogoIndex = Map<string, string>;

let logoIndexPromise: Promise<LogoIndex> | null = null;

function normalizeChannelName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(usa|u\.s\.a|uk|u\.k|hd|fhd|4k|sd|plus|premium|channel|tv)\b/gi, ' ')
    .replace(/\b\d{1,2}\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readCachedIndex(): LogoIndex | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { entries: [string, string][]; expiresAt: number };
    if (Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return new Map(parsed.entries);
  } catch {
    return null;
  }
}

function writeCachedIndex(index: LogoIndex): void {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        entries: [...index.entries()],
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      }),
    );
  } catch {
    // ignore quota errors
  }
}

async function buildLogoIndex(): Promise<LogoIndex> {
  const cached = readCachedIndex();
  if (cached) return cached;

  const [channelsRes, logosRes] = await Promise.all([
    fetch(IPTV_CHANNELS_URL),
    fetch(IPTV_LOGOS_URL),
  ]);

  if (!channelsRes.ok || !logosRes.ok) {
    throw new Error('Failed to load iptv-org logo data');
  }

  const channels = (await channelsRes.json()) as IptvChannel[];
  const logos = (await logosRes.json()) as IptvLogo[];

  const channelIdToLogo = new Map<string, string>();
  for (const logo of logos) {
    if (!logo.url || channelIdToLogo.has(logo.channel)) continue;
    channelIdToLogo.set(logo.channel, logo.url);
  }

  const index: LogoIndex = new Map();

  for (const channel of channels) {
    const logoUrl = channelIdToLogo.get(channel.id);
    if (!logoUrl) continue;

    const keys = [channel.name, ...(channel.alt_names ?? [])];
    for (const key of keys) {
      const normalized = normalizeChannelName(key);
      if (normalized && !index.has(normalized)) {
        index.set(normalized, logoUrl);
      }
    }
  }

  writeCachedIndex(index);
  return index;
}

function loadLogoIndex(): Promise<LogoIndex> {
  if (!logoIndexPromise) {
    logoIndexPromise = buildLogoIndex().catch(() => new Map());
  }
  return logoIndexPromise;
}

export function resolveChannelLogoUrl(
  channelName: string,
  existingLogo?: string,
): Promise<string> {
  if (existingLogo?.startsWith('http')) {
    return Promise.resolve(existingLogo);
  }

  return loadLogoIndex().then(index => {
    const normalized = normalizeChannelName(channelName);
    if (!normalized) return '';

    if (index.has(normalized)) {
      return index.get(normalized) ?? '';
    }

    const words = normalized.split(' ').filter(Boolean);
    let bestUrl = '';
    let bestScore = 0;
    for (const [key, url] of index) {
      const keyWords = key.split(' ').filter(w => w.length > 2);
      if (keyWords.length === 0) continue;
      const overlap = keyWords.filter(w => words.includes(w)).length;
      const score = overlap / keyWords.length;
      if (score >= 0.75 && score > bestScore) {
        bestScore = score;
        bestUrl = url;
      }
    }

    return bestUrl;
  });
}

export function getCategoryGradient(category: string): string {
  const gradients: Record<string, string> = {
    Sports: 'linear-gradient(135deg, #1a3a2a 0%, #0d2818 100%)',
    News: 'linear-gradient(135deg, #1a2a3a 0%, #0d1828 100%)',
    Kids: 'linear-gradient(135deg, #3a2a1a 0%, #281808 100%)',
    Movies: 'linear-gradient(135deg, #2a1a3a 0%, #180828 100%)',
    Music: 'linear-gradient(135deg, #3a1a2a 0%, #280818 100%)',
    Documentary: 'linear-gradient(135deg, #1a3a3a 0%, #0d2828 100%)',
    Entertainment: 'linear-gradient(135deg, #2a1a3a 0%, #1a0d28 100%)',
  };
  return gradients[category] ?? gradients.Entertainment;
}
