#!/usr/bin/env node
/**
 * Refresh src/data/channels-bundled.json from dlhd.pk (run before android build).
 * Requires network access to dlhd.pk. Uses VITE_DLHD_API_KEY from .env when set.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outFile = path.join(root, 'src/data/channels-bundled.json');

const DLHD_BASE = 'https://dlhd.pk';
const HEADERS = {
  Accept: 'application/json, text/html, */*',
  Referer: `${DLHD_BASE}/`,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

function loadEnvKey() {
  try {
    const env = fs.readFileSync(path.join(root, '.env'), 'utf8');
    const line = env.split('\n').find(l => l.startsWith('VITE_DLHD_API_KEY='));
    return line?.slice('VITE_DLHD_API_KEY='.length).trim() ?? '';
  } catch {
    return '';
  }
}

function parseHtml(html) {
  const channels = [];
  const seen = new Set();
  const patterns = [
    /<a class="card"[\s\S]*?href="\/watch\.php\?id=(\d+)"[\s\S]*?data-title="([^"]*)"[\s\S]*?<div class="card__title">([^<]+)<\/div>/gi,
    /href="\/watch\.php\?id=(\d+)"[^>]*data-title="([^"]*)"/gi,
    /data-title="([^"]*)"[^>]*href="\/watch\.php\?id=(\d+)"/gi,
  ];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(html)) !== null) {
      const id = re === patterns[2] ? m[2] : m[1];
      const name = (re === patterns[2] ? m[1] : m[3] ?? m[2]).trim();
      if (!id || !name || seen.has(id)) continue;
      seen.add(id);
      channels.push({ channel_id: id, channel_name: name });
    }
  }
  return channels;
}

async function fetchChannels() {
  const key = loadEnvKey();
  if (key) {
    const url = `${DLHD_BASE}/daddyapi.php?endpoint=channels&key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) {
      const json = await res.json();
      const data = Array.isArray(json) ? json : json.data;
      if (Array.isArray(data) && data.length > 0) {
        return data.map(c => ({
          channel_id: String(c.channel_id),
          channel_name: c.channel_name,
          logo_url: c.logo_url,
        }));
      }
    }
  }

  const res = await fetch(`${DLHD_BASE}/24-7-channels.php`, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const parsed = parseHtml(html);
  if (parsed.length === 0) throw new Error('No channels parsed from HTML');
  return parsed;
}

try {
  const channels = await fetchChannels();
  const payload = {
    generatedAt: new Date().toISOString(),
    count: channels.length,
    channels,
  };
  fs.writeFileSync(outFile, JSON.stringify(payload));
  console.log(`Wrote ${channels.length} channels to ${path.relative(root, outFile)}`);
} catch (err) {
  console.error('fetch-channels failed:', err instanceof Error ? err.message : err);
  if (fs.existsSync(outFile)) {
    console.log('Keeping existing bundled catalog.');
    process.exit(0);
  }
  process.exit(1);
}
