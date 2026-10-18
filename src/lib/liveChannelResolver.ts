import type { Channel, SelectedLiveChannel } from '@/types';

export type ResolvedLiveChannel = SelectedLiveChannel;

/** Normalize DLHD channel id and merge metadata from the loaded catalog. */
export function resolveLiveChannel(
  input: {
    id: string;
    name?: string;
    logo?: string;
    streamUrl?: string;
    provider?: SelectedLiveChannel['provider'];
  },
  channels: Channel[],
): ResolvedLiveChannel {
  if (input.id.startsWith('m3u-')) {
    const matched = channels.find(c => c.id === input.id);
    return {
      id: input.id,
      name: input.name ?? matched?.name ?? 'Live Channel',
      logo: input.logo ?? matched?.logo ?? '',
      streamUrl: input.streamUrl ?? matched?.streamUrl,
      provider: 'm3u',
    };
  }

  const id = input.id.replace(/\D/g, '') || input.id;
  const matched = channels.find(c => c.id === id || c.id === input.id);

  return {
    id,
    name: input.name ?? matched?.name ?? 'Live Channel',
    logo: input.logo ?? matched?.logo ?? '',
    streamUrl: input.streamUrl ?? matched?.streamUrl,
    provider: input.provider ?? matched?.provider ?? 'dlhd',
  };
}
