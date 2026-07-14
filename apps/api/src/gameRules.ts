export const ARENA_COOLDOWN_MS = 30 * 60 * 1000;
export const ARENA_TEAM_SIZE = 5;
export const ARENA_RATING_K = 24;
export const ARENA_WIN_DUST = { min: 20, max: 50 };
export const ARENA_LOSS_DUST = { min: 5, max: 15 };
export const ARENA_WIN_POINTS = 100;
export const ARENA_LOSS_POINTS = 20;
export const ARENA_PVP_CHANCE = 0.5; 
export const rewardLadder = [100, 250, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000] as const;

export const CLAN_BASE_MAX_MEMBERS = 9;
export const CLAN_LEVEL_UP_BASE_COST = 36_000_000;

export const getClanMaxMembers = (level: number): number => CLAN_BASE_MAX_MEMBERS + level;
export const getClanLevelUpCost = (level: number): number => level * CLAN_LEVEL_UP_BASE_COST;

export const CLAN_CREATION_COST = 100_000;

export const CLAN_ROLE_LABELS: Record<string, string> = {
  LEADER: '👑 Глава',
  DEPUTY: '🎖 Заступник',
  COMMANDER: '⚔️ Полководець',
  SERGEANT: '🛡 Сержант',
  MEMBER: '👤 Учасник'
};

export const CLAN_ROLE_ORDER = ['LEADER', 'DEPUTY', 'COMMANDER', 'SERGEANT', 'MEMBER'];

export const SHOP_BONUS_CLAIM_COST = 150;

export const SHOP_CRAFT_COST: Record<RarityKey, number> = {
  common: 300,
  rare: 800,
  epic: 2500,
  legendary: 8000,
  mythic: 25000
};

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

export const CARD_CLAIM_COOLDOWN_MS = 2 * 60 * 60 * 1000;

export const rarityConfig = {
  common: { label: 'Звичайна', weight: 45, points: 100, dustMin: 20, dustMax: 40 },
  rare: { label: 'Рідкісна', weight: 30, points: 350, dustMin: 40, dustMax: 80 },
  epic: { label: 'Епічна', weight: 15, points: 1200, dustMin: 100, dustMax: 200 },
  legendary: { label: 'Легендарна', weight: 8, points: 4000, dustMin: 250, dustMax: 500 },
  mythic: { label: 'Міфічна', weight: 2, points: 12000, dustMin: 600, dustMax: 1200 }
} as const;

export type RarityKey = keyof typeof rarityConfig;

export const rarityOrder: RarityKey[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];

export const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}г. ${minutes}хв. ${seconds}с.`;
};


export type QuestType = 'claim_cards' | 'new_cards' | 'arena_battles' | 'arena_wins' | 'craft_cards';

export type QuestDefinition = {
  id: string;
  title: string;
  emoji: string;
  type: QuestType;
  target: number;
  rewardDust: number;
  rewardPoints: number;
  rewardBonusClaims?: number;
};

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  { id: 'claim_3_cards', title: 'Отримай 3 картки', emoji: '🎫', type: 'claim_cards', target: 3, rewardDust: 100, rewardPoints: 50 },
  { id: 'get_1_new_card', title: 'Здобудь нову унікальну картку', emoji: '✨', type: 'new_cards', target: 1, rewardDust: 150, rewardPoints: 100 },
  { id: 'fight_2_arena', title: 'Проведи 2 бої на арені', emoji: '⚔️', type: 'arena_battles', target: 2, rewardDust: 120, rewardPoints: 80 },
  { id: 'win_1_arena', title: 'Здобудь перемогу на арені', emoji: '🏆', type: 'arena_wins', target: 1, rewardDust: 200, rewardPoints: 0, rewardBonusClaims: 1 },
  { id: 'craft_1_card', title: 'Купити картку в магазині', emoji: '⚒', type: 'craft_cards', target: 1, rewardDust: 100, rewardPoints: 50 }
];

export const CRAFT_ATTEMPTS_DUPLICATES_REQUIRED = 10;

export const CRAFT_ATTEMPTS_REWARD_BY_RARITY: Record<RarityKey, number> = {
  common: 1,
  rare: 2,
  epic: 4,
  legendary: 8,
  mythic: 15
};

export const CRAFT_ATTEMPTS_SHARDS_REQUIRED = 10;
export const CRAFT_ATTEMPTS_SHARDS_REWARD = 1;

export const SHARD_REWARD_RANGE_BY_RARITY: Record<RarityKey, { min: number; max: number }> = {
  common: { min: 1, max: 1 },
  rare: { min: 2, max: 4 },
  epic: { min: 5, max: 9 },
  legendary: { min: 10, max: 15 },
  mythic: { min: 20, max: 45 }
};