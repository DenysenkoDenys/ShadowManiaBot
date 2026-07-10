export const rewardLadder = [100, 250, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000] as const;

export const pityRules = [
  {
    rarity: 'epic',
    maxMisses: 30,
    label: 'Guaranteed epic after 30 packs without an epic'
  },
  {
    rarity: 'legendary',
    maxMisses: 100,
    label: 'Guaranteed legendary after 100 packs without a legendary'
  }
] as const;

export const dailyLoginRewards = [
  { day: 1, reward: 'Common pack' },
  { day: 3, reward: 'Rare pack' },
  { day: 7, reward: 'Rare pack' },
  { day: 14, reward: 'Epic pack' },
  { day: 30, reward: 'Legendary pack' }
] as const;

export const clanRewardTiers = [
  { place: '1', diamonds: 5000, bonus: 'Exclusive season card' },
  { place: '2-10', diamonds: 2500, bonus: 'Competitive prestige reward' },
  { place: '11-50', diamonds: 1000, bonus: 'Clan progression reward' }
] as const;

export const seasonThemes = [
  'Anime',
  'Memes',
  'Games',
  'Movies'
] as const;

export const cardRarities = [
  'common',
  'rare',
  'epic',
  'legendary',
  'mythic'
] as const;

export const cardRanks = [
  'Normal',
  'Shiny',
  'Golden',
  'Animated',
  'Mythic'
] as const;

export const collectionSets = [
  {
    name: 'Cyberpunk Set',
    reward: '+5000 coins',
    cards: ['V', 'Johnny', 'Panam', 'Adam Smasher']
  },
  {
    name: 'Hero Set',
    reward: 'Season badge + dust',
    cards: ['Naruto', 'Sasuke', 'Sakura', 'Kakashi']
  }
] as const;

export const evolutionPreview = [
  'Naruto ★',
  'Naruto ★★',
  'Naruto ★★★'
] as const;

export const achievementPreview = [
  'Collected 100 cards',
  'Opened 500 packs',
  'Won 100 battles',
  'Earned 50 legendary cards'
] as const;

export const coreSystems = [
  'Collection',
  'Clans',
  'Economy',
  'Seasons and events'
] as const;

export const designPillars = [
  {
    name: 'Collection',
    focus: ['Card packs', 'Evolutions', 'Rarities', 'Set completion']
  },
  {
    name: 'Clans',
    focus: ['Bosses', 'Wars', 'Quests', 'Weekly ratings']
  },
  {
    name: 'Economy',
    focus: ['Reward ladder', 'Dust', 'Pity timers', 'Trade systems']
  },
  {
    name: 'Seasons',
    focus: ['Rotating themes', 'Exclusive cards', 'Events', 'Content drops']
  }
] as const;

// --- Card claim system ---

export const CARD_CLAIM_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 години

export const rarityConfig = {
  common: { label: 'Звичайна', weight: 45, points: 50, dustMin: 5, dustMax: 15 },
  rare: { label: 'Рідкісна', weight: 30, points: 150, dustMin: 15, dustMax: 30 },
  epic: { label: 'Епічна', weight: 15, points: 500, dustMin: 30, dustMax: 60 },
  legendary: { label: 'Легендарна', weight: 8, points: 1500, dustMin: 60, dustMax: 120 },
  mythic: { label: 'Міфічна', weight: 2, points: 5000, dustMin: 150, dustMax: 300 }
} as const;

export type RarityKey = keyof typeof rarityConfig;

export const rarityOrder: RarityKey[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];

/** Formats milliseconds as "0г. 5хв. 11с." to match the in-bot cooldown message. */
export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}г. ${minutes}хв. ${seconds}с.`;
};
