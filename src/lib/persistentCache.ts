/** localStorage cache with TTL — survives app restarts on native. */

export function readPersistentCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; expiresAt: number };
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function writePersistentCache<T>(key: string, data: T, ttlMs: number): void {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ data, expiresAt: Date.now() + ttlMs }),
    );
  } catch {
    // ignore quota errors
  }
}

export function removePersistentCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
