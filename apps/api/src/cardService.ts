import { ensureSeedWorld } from './seedRuntime.js';
import { seedCards } from './seedData.js';
import { CARD_CLAIM_COOLDOWN_MS, rarityConfig, type RarityKey } from './gameRules.js';
import type { CardInstance } from '@prisma/client';
import { getPrisma } from './prismaClient.js';
import { incrementQuestProgress } from './questService.js';
import { SHARD_REWARD_RANGE_BY_RARITY } from './gameRules.js';

export type ClaimedCardView = {
  name: string;
  rarity: RarityKey;
  rarityLabel: string;
  attack: number;
  health: number;
  value: number;
  universe: string;
  imageUrl: string | null;
};

export type ClaimResult =
  | { status: 'cooldown'; remainingMs: number; bonusClaims: number }
  | {
    status: 'new';
    card: ClaimedCardView;
    pointsGained: number;
    dustGained: number;
    universePoints: number;
    dustBalance: number;
  }
  | {
    status: 'duplicate';
    card: ClaimedCardView;
    pointsGained: number;
    dustGained: number;
    shardsGained: number;
    shards: number;
    universePoints: number;
    dustBalance: number;
  };

const rarityWeightTable = (Object.keys(rarityConfig) as RarityKey[]).map((rarity) => ({
  rarity,
  weight: rarityConfig[rarity].weight
}));

const pickRandomRarity = (): RarityKey => {
  const totalWeight = rarityWeightTable.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of rarityWeightTable) {
    if (roll < entry.weight) {
      return entry.rarity;
    }
    roll -= entry.weight;
  }

  return rarityWeightTable[0].rarity;
};

const randomDust = (rarity: RarityKey): number => {
  const cfg = rarityConfig[rarity];
  return Math.floor(Math.random() * (cfg.dustMax - cfg.dustMin + 1)) + cfg.dustMin;
};

type MemoryUser = {
  lastCardClaimAt: number | null;
  universePoints: number;
  dustBalance: number;
  bonusClaims: number;
  totalCardClaims: number;
  owned: Set<string>;
};

const memoryUsers = new Map<string, MemoryUser>();

const getMemoryUser = (telegramId: string): MemoryUser => {
  if (!memoryUsers.has(telegramId)) {
    memoryUsers.set(telegramId, {
      lastCardClaimAt: null,
      universePoints: 0,
      dustBalance: 0,
      bonusClaims: 0,
      totalCardClaims: 0,
      owned: new Set()
    });
  }
  return memoryUsers.get(telegramId) as MemoryUser;
};

export const claimCard = async (telegramId: string): Promise<ClaimResult> => {
  const prisma = getPrisma();
  const now = Date.now();

  if (prisma) {
    await ensureSeedWorld(prisma);

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId, displayName: `Player ${telegramId}` }
    });

    const lastCardClaimAt = user.lastCardClaimAt;
    const onCooldown = lastCardClaimAt !== null && now - lastCardClaimAt.getTime() < CARD_CLAIM_COOLDOWN_MS;

    if (onCooldown && user.bonusClaims <= 0) {
      const elapsed = now - lastCardClaimAt.getTime();
      return { status: 'cooldown', remainingMs: CARD_CLAIM_COOLDOWN_MS - elapsed, bonusClaims: user.bonusClaims };
    }

    const usingBonusClaim = onCooldown && user.bonusClaims > 0;
    const rarity = pickRandomRarity();
    const cfg = rarityConfig[rarity];

    const candidates = await prisma.card.findMany({
      where: { rarity: rarity.toUpperCase() as any },
      include: { cardSet: true, season: true }
    });
    const pool = candidates.length > 0 ? candidates : await prisma.card.findMany({ include: { cardSet: true, season: true } });
    const card = pool[Math.floor(Math.random() * pool.length)];

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastCardClaimAt: usingBonusClaim ? undefined : new Date(now),
        bonusClaims: usingBonusClaim ? { decrement: 1 } : undefined,
        totalCardClaims: { increment: 1 },
        cardTimerNotified: usingBonusClaim ? undefined : false
      }
    });

    const existingInstance = await prisma.cardInstance.findUnique({
      where: { ownerId_cardId: { ownerId: user.id, cardId: card.id } }
    });

    const dustGained = randomDust(rarity);
    const shardsRange = SHARD_REWARD_RANGE_BY_RARITY[rarity];
    const shardsGained = existingInstance
      ? Math.floor(Math.random() * (shardsRange.max - shardsRange.min + 1)) + shardsRange.min
      : 0;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        dustBalance: { increment: dustGained },
        universePoints: { increment: cfg.points },
        shards: shardsGained ? { increment: shardsGained } : undefined
      }
    });

    if (existingInstance) {
      await prisma.cardInstance.update({
        where: { id: existingInstance.id },
        data: { copies: { increment: 1 } }
      });
    } else {
      await prisma.cardInstance.create({
        data: { ownerId: user.id, cardId: card.id, rank: 'NORMAL' }
      });
    }

    await incrementQuestProgress(telegramId, 'claim_cards', 1);
    if (!existingInstance) {
      await incrementQuestProgress(telegramId, 'new_cards', 1);
    }

    const cardView: ClaimedCardView = {
      name: card.name,
      rarity,
      rarityLabel: cfg.label,
      attack: card.basePower,
      health: card.health,
      value: cfg.points,
      universe: card.cardSet?.name ?? card.season.theme,
      imageUrl: card.imageUrl ?? null
    };

    return {
      status: existingInstance ? 'duplicate' : 'new',
      card: cardView,
      pointsGained: cfg.points,
      dustGained,
      shardsGained,
      shards: updatedUser.shards,
      universePoints: updatedUser.universePoints,
      dustBalance: updatedUser.dustBalance
    };
  }

  // Fallback: in-memory mode
  const memUser = getMemoryUser(telegramId);
  const onCooldown = memUser.lastCardClaimAt !== null && now - memUser.lastCardClaimAt < CARD_CLAIM_COOLDOWN_MS;

  if (onCooldown && memUser.bonusClaims <= 0) {
    const elapsed = now - (memUser.lastCardClaimAt as number);
    return { status: 'cooldown', remainingMs: CARD_CLAIM_COOLDOWN_MS - elapsed, bonusClaims: memUser.bonusClaims };
  }

  if (onCooldown) memUser.bonusClaims -= 1;

  const rarity = pickRandomRarity();
  const pool = seedCards.filter((seedCard) => seedCard.rarity === rarity);
  const finalPool = pool.length > 0 ? pool : seedCards;
  const card = finalPool[Math.floor(Math.random() * finalPool.length)];

  memUser.lastCardClaimAt = now;
  memUser.totalCardClaims += 1;

  const cfg = rarityConfig[rarity];
  const dust = randomDust(rarity);
  const isDuplicate = memUser.owned.has(card.name);
  const shardsRange = SHARD_REWARD_RANGE_BY_RARITY[rarity];
  const shardsGained = isDuplicate
    ? Math.floor(Math.random() * (shardsRange.max - shardsRange.min + 1)) + shardsRange.min
    : 0;

  memUser.dustBalance += dust;
  memUser.universePoints += cfg.points;
  memUser.owned.add(card.name);

  return {
    status: isDuplicate ? 'duplicate' : 'new',
    card: {
      name: card.name,
      rarity,
      rarityLabel: cfg.label,
      attack: card.attack,
      health: card.health,
      value: cfg.points,
      universe: card.universe,
      imageUrl: card.imageUrl ?? null
    },
    pointsGained: cfg.points,
    dustGained: dust,
    shardsGained,
    shards: 0,
    universePoints: memUser.universePoints,
    dustBalance: memUser.dustBalance
  };
};

export const getClaimCooldown = async (telegramId: string): Promise<{ remainingMs: number; bonusClaims: number }> => {
  const prisma = getPrisma();
  const now = Date.now();

  if (prisma) {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    const lastCardClaimAt = user?.lastCardClaimAt;
    if (!lastCardClaimAt) {
      return { remainingMs: 0, bonusClaims: user?.bonusClaims ?? 0 };
    }
    const elapsed = now - lastCardClaimAt.getTime();
    return { remainingMs: Math.max(0, CARD_CLAIM_COOLDOWN_MS - elapsed), bonusClaims: user.bonusClaims };
  }

  const memUser = memoryUsers.get(telegramId);
  if (!memUser?.lastCardClaimAt) {
    return { remainingMs: 0, bonusClaims: memUser?.bonusClaims ?? 0 };
  }
  const elapsed = now - memUser.lastCardClaimAt;
  return { remainingMs: Math.max(0, CARD_CLAIM_COOLDOWN_MS - elapsed), bonusClaims: memUser.bonusClaims };
};

export type CollectionCardView = {
  name: string;
  rarity: RarityKey;
  rarityLabel: string;
  owned: boolean;
  copies: number;
  rank: string | null;
  attack: number;
  health: number;
  value: number;
  imageUrl: string | null;
  universe: string;
};

export type CollectionUniverseView = {
  name: string;
  emoji: string;
  owned: number;
  total: number;
  cards: CollectionCardView[];
};

export type PlayerCollection = {
  totalOwned: number;
  totalCards: number;
  universes: CollectionUniverseView[];
};

export type ChroniclesUniverseSummary = {
  name: string;
  emoji: string;
  owned: number;
  total: number;
};

export type PlayerChronicles = {
  totalCardClaims: number;
  totalOwned: number;
  totalCards: number;
  progressPercent: number;
  universes: ChroniclesUniverseSummary[];
};

export const getPlayerChronicles = async (telegramId: string): Promise<PlayerChronicles> => {
  const prisma = getPrisma();
  const collection = await getPlayerCollection(telegramId);

  const universes: ChroniclesUniverseSummary[] = collection.universes.map((u) => ({
    name: u.name,
    emoji: u.emoji,
    owned: u.owned,
    total: u.total
  }));

  let totalCardClaims = 0;

  if (prisma) {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    totalCardClaims = user?.totalCardClaims ?? 0;
  } else {
    const memUser = memoryUsers.get(telegramId);
    totalCardClaims = memUser?.totalCardClaims ?? 0;
  }

  const progressPercent = collection.totalCards > 0
    ? Math.round((collection.totalOwned / collection.totalCards) * 1000) / 10
    : 0;

  return {
    totalCardClaims,
    totalOwned: collection.totalOwned,
    totalCards: collection.totalCards,
    progressPercent,
    universes
  };
};

export const getPlayerCollection = async (telegramId: string): Promise<PlayerCollection> => {
  const prisma = getPrisma();

  if (prisma) {
    await ensureSeedWorld(prisma);

    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { inventory: true }
    });

    const allCards = await prisma.card.findMany({ include: { cardSet: true, season: true } });
    const ownedMap = new Map<string, CardInstance>(
      (user?.inventory ?? []).map((instance: any) => [instance.cardId, instance])
    );

    const universeMap = new Map<string, CollectionUniverseView>();

    for (const card of allCards) {
      const universeName = card.cardSet?.name ?? card.season.theme;
      const emoji = card.cardSet?.emoji ?? '🎴';

      if (!universeMap.has(universeName)) {
        universeMap.set(universeName, { name: universeName, emoji, owned: 0, total: 0, cards: [] });
      }

      const bucket = universeMap.get(universeName) as CollectionUniverseView;
      const instance = ownedMap.get(card.id);
      const rarity = card.rarity.toLowerCase() as RarityKey;
      const cfg = rarityConfig[rarity];

      bucket.total += 1;
      if (instance) {
        bucket.owned += 1;
      }

      bucket.cards.push({
        name: card.name,
        rarity,
        rarityLabel: cfg.label,
        owned: Boolean(instance),
        copies: instance?.copies ?? 0,
        rank: instance ? instance.rank.toLowerCase() : null,
        attack: card.basePower,
        health: card.health,
        value: cfg.points,
        imageUrl: card.imageUrl ?? null,
        universe: universeName
      });
    }

    const universes = Array.from(universeMap.values());
    return {
      totalOwned: universes.reduce((sum, u) => sum + u.owned, 0),
      totalCards: universes.reduce((sum, u) => sum + u.total, 0),
      universes
    };
  }

  // Fallback: in-memory mode (без Postgres) — будуємо з seed-каталогу
  const memUser = memoryUsers.get(telegramId);
  const universeMap = new Map<string, CollectionUniverseView>();

  for (const card of seedCards) {
    if (!universeMap.has(card.universe)) {
      universeMap.set(card.universe, { name: card.universe, emoji: '🎴', owned: 0, total: 0, cards: [] });
    }
    const bucket = universeMap.get(card.universe) as CollectionUniverseView;
    const owned = memUser?.owned.has(card.name) ?? false;
    const cfg = rarityConfig[card.rarity];

    bucket.total += 1;
    if (owned) bucket.owned += 1;

    bucket.cards.push({
      name: card.name,
      rarity: card.rarity,
      rarityLabel: cfg.label,
      owned,
      copies: owned ? 1 : 0,
      rank: owned ? 'normal' : null,
      attack: card.attack,
      health: card.health,
      value: cfg.points,
      imageUrl: card.imageUrl ?? null,
      universe: card.universe
    });
  }


  const universes = Array.from(universeMap.values());
  return {
    totalOwned: universes.reduce((sum, u) => sum + u.owned, 0),
    totalCards: universes.reduce((sum, u) => sum + u.total, 0),
    universes
  };

};