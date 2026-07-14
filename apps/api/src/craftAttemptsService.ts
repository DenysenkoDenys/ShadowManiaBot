import { getPrisma } from './prismaClient.js';
import {
  type RarityKey,
  CRAFT_ATTEMPTS_DUPLICATES_REQUIRED,
  CRAFT_ATTEMPTS_REWARD_BY_RARITY,
  CRAFT_ATTEMPTS_SHARDS_REQUIRED,
  CRAFT_ATTEMPTS_SHARDS_REWARD
} from './gameRules.js';

const getDuplicatesByRarity = async (prisma: any, userId: string): Promise<Record<RarityKey, number>> => {
  const instances = await prisma.cardInstance.findMany({
    where: { ownerId: userId, copies: { gt: 1 } },
    include: { card: true }
  });

  const totals: Record<RarityKey, number> = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };

  for (const instance of instances) {
    const rarity = instance.card.rarity.toLowerCase() as RarityKey;
    totals[rarity] += instance.copies - 1;
  }

  return totals;
};

export type CraftAttemptsStatusView = {
  shards: number;
  duplicatesByRarity: Record<RarityKey, number>;
  duplicatesRequired: number;
  rewardByRarity: Record<RarityKey, number>;
  shardsRequired: number;
  shardsReward: number;
};

export const getCraftAttemptsStatus = async (telegramId: string): Promise<CraftAttemptsStatusView | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  const duplicatesByRarity = await getDuplicatesByRarity(prisma, user.id);

  return {
    shards: user.shards,
    duplicatesByRarity,
    duplicatesRequired: CRAFT_ATTEMPTS_DUPLICATES_REQUIRED,
    rewardByRarity: CRAFT_ATTEMPTS_REWARD_BY_RARITY,
    shardsRequired: CRAFT_ATTEMPTS_SHARDS_REQUIRED,
    shardsReward: CRAFT_ATTEMPTS_SHARDS_REWARD
  };
};

export type CraftAttemptsResult =
  | { status: 'not-enough'; have: number; required: number }
  | { status: 'locked' }
  | { status: 'ok'; attemptsGained: number; bonusClaims: number };

const spendDuplicates = async (prisma: any, userId: string, rarity: RarityKey, amount: number): Promise<boolean> => {
  const instances = await prisma.cardInstance.findMany({
    where: { ownerId: userId, copies: { gt: 1 }, card: { rarity: rarity.toUpperCase() } },
    orderBy: { copies: 'desc' }
  });

  let remaining = amount;
  const updates: { id: string; newCopies: number }[] = [];

  for (const instance of instances) {
    if (remaining <= 0) break;
    const available = instance.copies - 1;
    const take = Math.min(available, remaining);
    if (take > 0) {
      updates.push({ id: instance.id, newCopies: instance.copies - take });
      remaining -= take;
    }
  }

  if (remaining > 0) return false;

  await prisma.$transaction(
    updates.map((u) => prisma.cardInstance.update({ where: { id: u.id }, data: { copies: u.newCopies } }))
  );

  return true;
};

export const craftAttemptsFromDuplicates = async (telegramId: string, rarity: RarityKey): Promise<CraftAttemptsResult | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  if (user.craftLocked) {
    return { status: 'locked' } as any;
  }

  const duplicatesByRarity = await getDuplicatesByRarity(prisma, user.id);
  const have = duplicatesByRarity[rarity];

  if (have < CRAFT_ATTEMPTS_DUPLICATES_REQUIRED) {
    return { status: 'not-enough', have, required: CRAFT_ATTEMPTS_DUPLICATES_REQUIRED };
  }

  const spent = await spendDuplicates(prisma, user.id, rarity, CRAFT_ATTEMPTS_DUPLICATES_REQUIRED);
  if (!spent) {
    return { status: 'not-enough', have, required: CRAFT_ATTEMPTS_DUPLICATES_REQUIRED };
  }

  const attemptsGained = CRAFT_ATTEMPTS_REWARD_BY_RARITY[rarity];
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { bonusClaims: { increment: attemptsGained } }
  });

  return { status: 'ok', attemptsGained, bonusClaims: updatedUser.bonusClaims };
};

export const craftAttemptsFromShards = async (telegramId: string): Promise<CraftAttemptsResult | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  if (user.craftLocked) {
    return { status: 'locked' } as any;
  }

  if (user.shards < CRAFT_ATTEMPTS_SHARDS_REQUIRED) {
    return { status: 'not-enough', have: user.shards, required: CRAFT_ATTEMPTS_SHARDS_REQUIRED };
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      shards: { decrement: CRAFT_ATTEMPTS_SHARDS_REQUIRED },
      bonusClaims: { increment: CRAFT_ATTEMPTS_SHARDS_REWARD }
    }
  });

  return { status: 'ok', attemptsGained: CRAFT_ATTEMPTS_SHARDS_REWARD, bonusClaims: updatedUser.bonusClaims };
};

export type CraftAllResult = {
  totalAttemptsGained: number;
  bonusClaims: number;
  breakdown: Partial<Record<RarityKey | 'shards', number>>; // скільки наборів по 10 витрачено з кожного джерела
};

export const craftAllAttempts = async (telegramId: string): Promise<CraftAllResult | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  if (user.craftLocked) {
    return { status: 'locked' } as any;
  }

  const duplicatesByRarity = await getDuplicatesByRarity(prisma, user.id);
  let totalAttempts = 0;
  const breakdown: Partial<Record<RarityKey | 'shards', number>> = {};

  for (const rarity of Object.keys(duplicatesByRarity) as RarityKey[]) {
    const have = duplicatesByRarity[rarity];
    const sets = Math.floor(have / CRAFT_ATTEMPTS_DUPLICATES_REQUIRED);
    if (sets <= 0) continue;

    const spent = await spendDuplicates(prisma, user.id, rarity, sets * CRAFT_ATTEMPTS_DUPLICATES_REQUIRED);
    if (!spent) continue;

    const gained = sets * CRAFT_ATTEMPTS_REWARD_BY_RARITY[rarity];
    totalAttempts += gained;
    breakdown[rarity] = sets;
  }

  const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
  const shardSets = Math.floor((freshUser?.shards ?? 0) / CRAFT_ATTEMPTS_SHARDS_REQUIRED);

  if (shardSets > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { shards: { decrement: shardSets * CRAFT_ATTEMPTS_SHARDS_REQUIRED } }
    });
    const gained = shardSets * CRAFT_ATTEMPTS_SHARDS_REWARD;
    totalAttempts += gained;
    breakdown.shards = shardSets;
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { bonusClaims: { increment: totalAttempts } }
  });

  return { totalAttemptsGained: totalAttempts, bonusClaims: updatedUser.bonusClaims, breakdown };
};