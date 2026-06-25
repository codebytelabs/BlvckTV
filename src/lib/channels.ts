import type { Channel } from '@/types';

export type { Channel };

/** Hardcoded fallback channels with real DLHD stream IDs */
export const FALLBACK_CHANNELS: Channel[] = [
  { id: '51', name: 'ABC', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ABC-2021-LOGO.svg/1200px-ABC-2021-LOGO.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '52', name: 'CBS', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/CBS_logo.svg/1200px-CBS_logo.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '53', name: 'NBC', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/NBC_logo.svg/1200px-NBC_logo.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '54', name: 'FOX', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Fox_Networks_Group_USA_logo.svg/1200px-Fox_Networks_Group_USA_logo.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '300', name: 'CW', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/The_CW_logo_2024.svg/1200px-The_CW_logo_2024.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '44', name: 'ESPN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_logo.svg/1200px-ESPN_logo.svg.png', category: 'Sports', country: 'US', isLive: true },
  { id: '45', name: 'ESPN 2', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_logo.svg/1200px-ESPN_logo.svg.png', category: 'Sports', country: 'US', isLive: true },
  { id: '39', name: 'Fox Sports 1', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Fox_Networks_Group_USA_logo.svg/1200px-Fox_Networks_Group_USA_logo.svg.png', category: 'Sports', country: 'US', isLive: true },
  { id: '405', name: 'NFL Network', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/NFL_Network_logo.svg/1200px-NFL_Network_logo.svg.png', category: 'Sports', country: 'US', isLive: true },
  { id: '404', name: 'NBA TV', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/NBA_TV_logo.svg/1200px-NBA_TV_logo.svg.png', category: 'Sports', country: 'US', isLive: true },
  { id: '345', name: 'CNN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/CNN.svg/1200px-CNN.svg.png', category: 'News', country: 'US', isLive: true },
  { id: '349', name: 'BBC News', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/BBC_News_2022_%28Alt%29.svg/1200px-BBC_News_2022_%28Alt%29.svg.png', category: 'News', country: 'UK', isLive: true },
  { id: '347', name: 'Fox News', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fox_News_Channel_logo.svg/1200px-Fox_News_Channel_logo.svg.png', category: 'News', country: 'US', isLive: true },
  { id: '327', name: 'MSNBC', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/MSNBC_2015_logo.svg/1200px-MSNBC_2015_logo.svg.png', category: 'News', country: 'US', isLive: true },
  { id: '339', name: 'Cartoon Network', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Cartoon_Network_logo_2004.svg/1200px-Cartoon_Network_logo_2004.svg.png', category: 'Kids', country: 'US', isLive: true },
  { id: '312', name: 'Disney Channel', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/2019_Disney_Channel_logo.svg/1200px-2019_Disney_Channel_logo.svg.png', category: 'Kids', country: 'US', isLive: true },
  { id: '329', name: 'Nickelodeon', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Nickelodeon_2023_logo.svg/1200px-Nickelodeon_2023_logo.svg.png', category: 'Kids', country: 'US', isLive: true },
  { id: '321', name: 'HBO', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/1200px-HBO_logo.svg.png', category: 'Movies', country: 'US', isLive: true },
  { id: '374', name: 'Cinemax', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Cinemax_2016.svg/1200px-Cinemax_2016.svg.png', category: 'Movies', country: 'US', isLive: true },
  { id: '333', name: 'Showtime', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Showtime_2024.svg/1200px-Showtime_2024.svg.png', category: 'Movies', country: 'US', isLive: true },
  { id: '367', name: 'MTV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/MTV_Logo_2010.svg/1200px-MTV_Logo_2010.svg.png', category: 'Music', country: 'US', isLive: true },
  { id: '344', name: 'VH1', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/VH1_logo.svg/1200px-VH1_logo.svg.png', category: 'Music', country: 'US', isLive: true },
  { id: '311', name: 'Discovery', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Discovery_Channel_logo.svg/1200px-Discovery_Channel_logo.svg.png', category: 'Documentary', country: 'US', isLive: true },
  { id: '328', name: 'National Geographic', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Natgeologo.svg/1200px-Natgeologo.svg.png', category: 'Documentary', country: 'US', isLive: true },
  { id: '322', name: 'History Channel', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/History_Logo.svg/1200px-History_Logo.svg.png', category: 'Documentary', country: 'US', isLive: true },
  { id: '338', name: 'TNT', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/TNT_2016_logo.svg/1200px-TNT_2016_logo.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '343', name: 'USA Network', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/USA_Network_logo_2015.svg/1200px-USA_Network_logo_2015.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '303', name: 'AMC', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/AMC_logo_2019.svg/1200px-AMC_logo_2019.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '336', name: 'TBS', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/TBS_logo_2015.svg/1200px-TBS_logo_2015.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '373', name: 'Syfy', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Syfy_logo.svg/1200px-Syfy_logo.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '310', name: 'Comedy Central', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Comedy_Central_2018.svg/1200px-Comedy_Central_2018.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '317', name: 'FX', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/FX_International_logo.svg/1200px-FX_International_logo.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '307', name: 'Bravo', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Bravo_TV.svg/1200px-Bravo_TV.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '382', name: 'HGTV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/HGTV_logo.svg/1200px-HGTV_logo.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '384', name: 'Food Network', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Food_Network_logo.svg/1200px-Food_Network_logo.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '340', name: 'Travel Channel', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Travel_Channel_logo.svg/1200px-Travel_Channel_logo.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '337', name: 'TLC', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/TLC_Logo.svg/1200px-TLC_Logo.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '304', name: 'Animal Planet', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Animal_Planet_logo.svg/1200px-Animal_Planet_logo.svg.png', category: 'Documentary', country: 'US', isLive: true },
  { id: '294', name: 'Science Channel', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Science_Channel_logo.svg/1200px-Science_Channel_logo.svg.png', category: 'Documentary', country: 'US', isLive: true },
  { id: '399', name: 'MLB Network', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4f/MLB_Network_logo.svg/1200px-MLB_Network_logo.svg.png', category: 'Sports', country: 'US', isLive: true },
  { id: '663', name: 'NHL Network', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4f/NHL_Network_logo.svg/1200px-NHL_Network_logo.svg.png', category: 'Sports', country: 'US', isLive: true },
  { id: '318', name: 'Golf Channel', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Golf_Channel_logo.svg/1200px-Golf_Channel_logo.svg.png', category: 'Sports', country: 'US', isLive: true },
  { id: '40', name: 'Tennis Channel', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Tennis_Channel_logo.svg/1200px-Tennis_Channel_logo.svg.png', category: 'Sports', country: 'US', isLive: true },
  { id: '425', name: 'BeIN Sports', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/BeIN_Sports_logo.svg/1200px-BeIN_Sports_logo.svg.png', category: 'Sports', country: 'US', isLive: true },
  { id: '38', name: 'Sky Sports', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Sky_Sports_logo.svg/1200px-Sky_Sports_logo.svg.png', category: 'Sports', country: 'UK', isLive: true },
  { id: '230', name: 'DAZN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/DAZN_logo.svg/1200px-DAZN_logo.svg.png', category: 'Sports', country: 'UK', isLive: true },
  { id: '41', name: 'Eurosport', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Eurosport_logo.svg/1200px-Eurosport_logo.svg.png', category: 'Sports', country: 'EU', isLive: true },
  { id: '334', name: 'Paramount Network', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Paramount_Network_logo.svg/1200px-Paramount_Network_logo.svg.png', category: 'Entertainment', country: 'US', isLive: true },
  { id: '315', name: 'E!', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/E%21_logo.svg/1200px-E%21_logo.svg.png', category: 'Entertainment', country: 'US', isLive: true },
];

/** @deprecated Use useChannels() — kept for backwards compatibility */
export const CHANNELS = FALLBACK_CHANNELS;

export function getCategoriesFrom(channels: Channel[]): string[] {
  return [...new Set(channels.map(c => c.category))].sort();
}

export function getCountriesFrom(channels: Channel[]): string[] {
  return [...new Set(channels.map(c => c.country))].sort();
}

export function getSportsChannelsFrom(channels: Channel[]): Channel[] {
  return channels.filter(c => c.category === 'Sports');
}

export const CATEGORIES = getCategoriesFrom(FALLBACK_CHANNELS);
export const COUNTRIES = getCountriesFrom(FALLBACK_CHANNELS);
export const SPORTS_CHANNELS = getSportsChannelsFrom(FALLBACK_CHANNELS);
