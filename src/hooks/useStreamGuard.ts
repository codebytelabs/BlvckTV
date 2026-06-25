import { useEffect } from 'react';
import { installStreamGuard } from '@/lib/streamGuard';

export function useStreamGuard(): void {
  useEffect(() => installStreamGuard(), []);
}
