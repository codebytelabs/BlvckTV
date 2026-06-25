import type { Channel } from '@/types';

export type ResolvedLiveChannel = {
  id: string;
  name: string;
  logo: string;
  streamUrl?: string;
};

/** Normalize DLHD channel id and merge metadata from the loaded catalog. */
export function resolveLiveChannel(
  input: {
    id: string;
    name?: string;
    logo?: string;
    streamUrl?: string;
  },
  channels: Channel[],
): ResolvedLiveChannel {
  const id = input.id.replace(/\D/g, '') || input.id;
  const matched = channels.find(c => c.id === id || c.id === input.id);

  return {
    id,
    name: input.name ?? matched?.name ?? 'Live Channel',
    logo: input.logo ?? matched?.logo ?? '',
    streamUrl: input.streamUrl ?? matched?.streamUrl,
  };
}
