export type M3uCatalogFormat = 'json' | 'm3u';

export type M3uCatalog = {
  id: string;
  label: string;
  country: string;
  description: string;
  format: M3uCatalogFormat;
  url: string;
  source: 'livetv-collector' | 'iptv-org';
};

const COLLECTOR_BASE =
  'https://raw.githubusercontent.com/bugsfreeweb/LiveTVCollector/main/LiveTV';

function collectorJson(countryFolder: string): string {
  return `${COLLECTOR_BASE}/${encodeURIComponent(countryFolder)}/LiveTV.json`;
}

/** Public IPTV catalogs — LiveTVCollector + iptv-org (Indian-IPTV-App style). */
export const M3U_CATALOGS: M3uCatalog[] = [
  {
    id: 'india',
    label: 'India IPTV',
    country: 'India',
    description: '765+ channels · LiveTVCollector',
    format: 'json',
    url: collectorJson('India'),
    source: 'livetv-collector',
  },
  {
    id: 'india-org',
    label: 'India · iptv-org',
    country: 'India',
    description: 'Community India playlist',
    format: 'm3u',
    url: 'https://iptv-org.github.io/iptv/countries/in.m3u',
    source: 'iptv-org',
  },
  {
    id: 'usa',
    label: 'USA IPTV',
    country: 'USA',
    description: 'US channels · LiveTVCollector',
    format: 'json',
    url: collectorJson('USA'),
    source: 'livetv-collector',
  },
  {
    id: 'uk',
    label: 'UK IPTV',
    country: 'UK',
    description: 'UK channels · LiveTVCollector',
    format: 'json',
    url: collectorJson('UK'),
    source: 'livetv-collector',
  },
  {
    id: 'worldwide',
    label: 'Worldwide',
    country: 'World',
    description: 'Global mix · LiveTVCollector',
    format: 'json',
    url: collectorJson('Worldwide'),
    source: 'livetv-collector',
  },
  {
    id: 'arabic',
    label: 'Arabic',
    country: 'Arab',
    description: 'Arabic channels · LiveTVCollector',
    format: 'json',
    url: collectorJson('Arabic'),
    source: 'livetv-collector',
  },
  {
    id: 'pakistan',
    label: 'Pakistan',
    country: 'Pakistan',
    description: 'Pakistan channels · LiveTVCollector',
    format: 'json',
    url: collectorJson('Pakistan'),
    source: 'livetv-collector',
  },
  {
    id: 'bangladesh',
    label: 'Bangladesh',
    country: 'Bangladesh',
    description: 'Bangladesh channels · LiveTVCollector',
    format: 'json',
    url: collectorJson('Bangladesh'),
    source: 'livetv-collector',
  },
];

export type LiveCatalogId = 'dlhd' | `m3u:${string}`;

export const DEFAULT_LIVE_CATALOG: LiveCatalogId = 'dlhd';

export const LIVE_CATALOG_OPTIONS: Array<{
  id: LiveCatalogId;
  label: string;
  description: string;
}> = [
  {
    id: 'dlhd',
    label: 'DLHD',
    description: '899 channels · Watch / Player / Clean HLS',
  },
  ...M3U_CATALOGS.map(catalog => ({
    id: `m3u:${catalog.id}` as LiveCatalogId,
    label: catalog.label,
    description: catalog.description,
  })),
];

export function getM3uCatalog(catalogId: string): M3uCatalog | undefined {
  return M3U_CATALOGS.find(c => c.id === catalogId);
}

export function parseLiveCatalogId(value: LiveCatalogId): { type: 'dlhd' } | { type: 'm3u'; catalogId: string } {
  if (value === 'dlhd') return { type: 'dlhd' };
  return { type: 'm3u', catalogId: value.replace(/^m3u:/, '') };
}

export function isM3uChannelId(id: string): boolean {
  return id.startsWith('m3u-');
}
