export type SeedSeason = {
  name: string;
  theme: string;
  status: 'planned' | 'active' | 'ended';
};

export type SeedCardSet = {
  name: string;
  emoji: string;
  theme: string;
  season: string;
  rewardText: string;
};

export type SeedCard = {
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  season: string;
  universe: string;
  attack: number;
  health: number;
  imageUrl?: string;
};

export type SeedClan = {
  name: string;
  tag: string;
  focus: string;
};

export type SeedPack = {
  name: string;
  description: string;
  rarityGuarantee: string;
};

export const seedSeasons: SeedSeason[] = [
  { name: 'Season 1', theme: 'Anime', status: 'active' },
  { name: 'Season 2', theme: 'Memes', status: 'planned' },
  { name: 'Season 3', theme: 'Games', status: 'planned' }
];


export const seedCardSets: SeedCardSet[] = [
  {
    name: 'Naruto',
    emoji: '🍥',
    theme: 'Naruto',
    season: 'Season 1',
    rewardText: 'Завершіть колекцію Naruto, щоб отримати ексклюзивну рамку карт'
  }
];

export const seedCards: SeedCard[] = [
  { name: 'Наруто Узумакі', rarity: 'legendary', season: 'Season 1', universe: 'Naruto', attack: 1800, health: 3000, imageUrl: '../photo/Naruto/Naruto.webp' },
  { name: 'Саске Учіха', rarity: 'epic', season: 'Season 1', universe: 'Naruto', attack: 1600, health: 2600, imageUrl: '../photo/Naruto/Sasuke.jpg' },
  { name: 'Сакура Харуно', rarity: 'rare', season: 'Season 1', universe: 'Naruto', attack: 1000, health: 1800, imageUrl: '../photo/Naruto/Sakura.webp' },
  { name: 'Какаші Хатаке', rarity: 'epic', season: 'Season 1', universe: 'Naruto', attack: 1500, health: 2400, imageUrl: '../photo/Naruto/Hatake.jpeg' },
  { name: 'Мадара Учіха', rarity: 'mythic', season: 'Season 1', universe: 'Naruto', attack: 2500, health: 4000, imageUrl: '../photo/Naruto/Madara.webp' },
  { name: 'Джирайя', rarity: 'rare', season: 'Season 1', universe: 'Naruto', attack: 1100, health: 1900, imageUrl: '../photo/Naruto/Jiraya.webp' },
  { name: 'Хіната Хьюга', rarity: 'common', season: 'Season 1', universe: 'Naruto', attack: 700, health: 1300, imageUrl: '../photo/Naruto/Hinata.webp' },
  { name: 'Шікамару Нара', rarity: 'common', season: 'Season 1', universe: 'Naruto', attack: 650, health: 1200, imageUrl: '../photo/Naruto/Shikamaru.webp' },
  { name: 'Гаара', rarity: 'epic', season: 'Season 1', universe: 'Naruto', attack: 1550, health: 2500, imageUrl: '../photo/Naruto/Gaara.webp' },
  { name: 'Ітачі Учіха', rarity: 'legendary', season: 'Season 1', universe: 'Naruto', attack: 1900, health: 3100, imageUrl: '../photo/Naruto/Itachi.webp' }
];

export const seedClans: SeedClan[] = [
  { name: 'Shadow Legion', tag: 'SLG', focus: 'Clan wars and boss farming' },
  { name: 'Dust Syndicate', tag: 'DST', focus: 'Economy and trading' },
  { name: 'Night Circuit', tag: 'NCT', focus: 'Season events and quest pushes' }
];

export const seedPacks: SeedPack[] = [
  { name: 'Starter Pack', description: 'Guaranteed 3 cards with a rare chance', rarityGuarantee: 'At least 1 rare' },
  { name: 'Epic Pack', description: 'A stronger pack for mid-game progression', rarityGuarantee: 'At least 1 epic' },
  { name: 'Legendary Pack', description: 'Premium pack with high-end guarantees', rarityGuarantee: 'At least 1 legendary' }
];

export const starterInventory = seedCards.slice(0, 3).map((card, index) => ({
  cardName: card.name,
  rarity: card.rarity,
  rank: index === 0 ? 'Normal' : index === 1 ? 'Shiny' : 'Golden'
}));
