import { getPrisma } from './prismaClient.js';
import { ensureSeedWorld } from './seedRuntime.js';
import { rarityConfig, type RarityKey, SHOP_BONUS_CLAIM_COST, SHOP_CRAFT_COST } from './gameRules.js';

export type ShopStatusView = {
  dustBalance: number;
  bonusClaims: number;
  bonusClaimCost: number;
  craftCosts: Record<RarityKey, number>;
};

export const getShopStatus = async (telegramId: string): Promise<ShopStatusView | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  return {
    dustBalance: user.dustBalance,
    bonusClaims: user.bonusClaims,
    bonusClaimCost: SHOP_BONUS_CLAIM_COST,
    craftCosts: SHOP_CRAFT_COST
  };
};

export type PurchaseResult =
  | { status: 'ok'; dustBalance: number; bonusClaims: number }
  | { status: 'not-enough-dust'; required: number; have: number };

export const buyBonusClaims = async (telegramId: string, quantity: number): Promise<PurchaseResult | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  const cost = SHOP_BONUS_CLAIM_COST * quantity;
  if (user.dustBalance < cost) {
    return { status: 'not-enough-dust', required: cost, have: user.dustBalance };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      dustBalance: { decrement: cost },
      bonusClaims: { increment: quantity }
    }
  });

  return { status: 'ok', dustBalance: updated.dustBalance, bonusClaims: updated.bonusClaims };
};

export type CraftResult =
  | { status: 'not-enough-dust'; required: number; have: number }
  | {
      status: 'crafted';
      isNew: boolean;
      card: {
        name: string;
        rarity: RarityKey;
        rarityLabel: string;
        attack: number;
        health: number;
        value: number;
        universe: string;
        imageUrl: string | null;
      };
      dustBalance: number;
      universePoints: number;
    };

export const craftCard = async (telegramId: string, rarity: RarityKey): Promise<CraftResult | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  await ensureSeedWorld(prisma);

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  const cost = SHOP_CRAFT_COST[rarity];
  if (user.dustBalance < cost) {
    return { status: 'not-enough-dust', required: cost, have: user.dustBalance };
  }

  const candidates = await prisma.card.findMany({
    where: { rarity: rarity.toUpperCase() as any },
    include: { cardSet: true, season: true }
  });

  if (candidates.length === 0) {
    return { status: 'not-enough-dust', required: cost, have: user.dustBalance };
  }

  const ownedInstances = await prisma.cardInstance.findMany({
    where: { ownerId: user.id, cardId: { in: candidates.map((c: any) => c.id) } }
  });
  const ownedCardIds = new Set(ownedInstances.map((i: any) => i.cardId));

  const notOwned = candidates.filter((c: any) => !ownedCardIds.has(c.id));
  const pool = notOwned.length > 0 ? notOwned : candidates;
  const isNew = notOwned.length > 0;
  const card = pool[Math.floor(Math.random() * pool.length)];

  const cfg = rarityConfig[rarity];

  await prisma.user.update({
    where: { id: user.id },
    data: { dustBalance: { decrement: cost } }
  });

  let updatedUser = user;

  if (isNew) {
    await prisma.cardInstance.create({ data: { ownerId: user.id, cardId: card.id, rank: 'NORMAL' } });
    updatedUser = await prisma.user.update({ where: { id: user.id }, data: {} });
  } else {
    const existingInstance = ownedInstances.find((i: any) => i.cardId === card.id);

    if (!existingInstance) {
      throw new Error(`Craft: expected existing CardInstance for card ${card.id}, but none found`);
    }

    const dustRefund = Math.floor(cost * 0.2);
    await prisma.cardInstance.update({
      where: { id: existingInstance.id },
      data: { copies: { increment: 1 } }
    });
    updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        dustBalance: { increment: dustRefund },
        universePoints: { increment: cfg.points }
      }
    });
  }

  return {
    status: 'crafted',
    isNew,
    card: {
      name: card.name,
      rarity,
      rarityLabel: cfg.label,
      attack: card.basePower,
      health: card.health,
      value: cfg.points,
      universe: card.cardSet?.name ?? card.season.theme,
      imageUrl: card.imageUrl ?? null
    },
    dustBalance: updatedUser.dustBalance,
    universePoints: updatedUser.universePoints
  };
};