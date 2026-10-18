import { isNativeApp } from '@/lib/nativePlatform';

/** Web (dev + Vercel) uses same-origin /api proxies. Native uses CapacitorHttp direct. */
export function useLiveApiProxy(): boolean {
  return !isNativeApp();
}
