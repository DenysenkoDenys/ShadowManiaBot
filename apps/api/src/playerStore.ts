import { starterInventory } from './seedData.js';
import { ensureSeedWorld, seedStarterInventoryForUser } from './seedRuntime.js';
import { getPrisma } from './prismaClient.js';

type PlayerProfile = {
  telegramId: string;
  username: string | null;
  displayName: string;
  dustBalance: number;
  universePoints: number;
  bonusClaims: number;
  streakCount: number;
  lastLoginAt: string | null;
  lastCardClaimAt: string | null;
  inventory: Array<{ cardName: string; rarity: string; rank: string }>;
  clanName: string | null;
};

type PlayerRecord = {
  telegramId: string;
  username: string | null;
  displayName: string;
  dustBalance: number;
  universePoints: number;
  bonusClaims: number;
  streakCount: number;
  lastLoginAt: Date | null;
  lastCardClaimAt: Date | null;
  inventory: Array<{ cardName: string; rarity: string; rank: string }>;
  clanName: string | null;
};

const inMemoryPlayers = new Map<string, PlayerRecord>();

const toProfile = (record: PlayerRecord): PlayerProfile => ({
  telegramId: record.telegramId,
  username: record.username,
  displayName: record.displayName,
  dustBalance: record.dustBalance,
  universePoints: record.universePoints,
  bonusClaims: record.bonusClaims,
  streakCount: record.streakCount,
  lastLoginAt: record.lastLoginAt?.toISOString() ?? null,
  lastCardClaimAt: record.lastCardClaimAt?.toISOString() ?? null,
  inventory: record.inventory,
  clanName: record.clanName
});

const createFallbackPlayer = (telegramId: string, username: string | null, displayName: string) => {
  const record: PlayerRecord = {
    telegramId,
    username,
    displayName,
    dustBalance: 0,
    universePoints: 0,
    bonusClaims: 0,
    streakCount: 0,
    lastLoginAt: null,
    lastCardClaimAt: null,
    inventory: [...starterInventory],
    clanName: 'Shadow Legion'
  };

  inMemoryPlayers.set(telegramId, record);
  return record;
};

const updateFallbackPlayer = (telegramId: string, updater: (record: PlayerRecord) => PlayerRecord) => {
  const current = inMemoryPlayers.get(telegramId) ?? createFallbackPlayer(telegramId, null, `Player ${telegramId}`);
  const next = updater(current);
  inMemoryPlayers.set(telegramId, next);
  return next;
};

export const getPlayerProfile = async (telegramId: string) => {
  const prisma = getPrisma();

  if (prisma) {
    await ensureSeedWorld(prisma);
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        inventory: {
          include: { card: true }
        },
        clanMemberships: {
          include: { clan: true },
          take: 1
        }
      }
    });

    if (user) {
      return {
        telegramId: user.telegramId,
        username: user.username,
        displayName: user.displayName,
        dustBalance: user.dustBalance,
        universePoints: user.universePoints,
        bonusClaims: user.bonusClaims,
        streakCount: user.streakCount,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        lastCardClaimAt: user.lastCardClaimAt?.toISOString() ?? null,
        inventory: user.inventory.map((item: { card: { name: string; rarity: { toLowerCase(): string } }; rank: { toLowerCase(): string } }) => ({
          cardName: item.card.name,
          rarity: item.card.rarity.toLowerCase(),
          rank: item.rank.toLowerCase()
        })),
        clanName: user.clanMemberships[0]?.clan.name ?? null
      } satisfies PlayerProfile;
    }
  }

  const record = inMemoryPlayers.get(telegramId) ?? createFallbackPlayer(telegramId, null, `Player ${telegramId}`);
  return toProfile(record);
};

export const upsertPlayerProfile = async (input: {
  telegramId: string;
  username: string | null;
  displayName: string;
}) => {
  const prisma = getPrisma();

  if (prisma) {
    await ensureSeedWorld(prisma);
    const existingUser = await prisma.user.findUnique({ where: { telegramId: input.telegramId } });

    const user = await prisma.user.upsert({
      where: { telegramId: input.telegramId },
      update: {
        username: input.username,
        ...(existingUser?.hasCustomNickname ? {} : { displayName: input.displayName }),
        lastLoginAt: new Date()
      },
      create: {
        telegramId: input.telegramId,
        username: input.username,
        displayName: input.displayName,
        lastLoginAt: new Date()
      }
    });
    await seedStarterInventoryForUser(prisma, user.id);

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        inventory: {
          include: { card: true }
        },
        clanMemberships: {
          include: { clan: true },
          take: 1
        }
      }
    });

    if (refreshedUser) {
      return {
        telegramId: refreshedUser.telegramId,
        username: refreshedUser.username,
        displayName: refreshedUser.displayName,
        dustBalance: refreshedUser.dustBalance,
        universePoints: refreshedUser.universePoints,
        bonusClaims: refreshedUser.bonusClaims,
        streakCount: refreshedUser.streakCount,
        lastLoginAt: refreshedUser.lastLoginAt?.toISOString() ?? null,
        lastCardClaimAt: refreshedUser.lastCardClaimAt?.toISOString() ?? null,
        inventory: refreshedUser.inventory.map((item: { card: { name: string; rarity: { toLowerCase(): string } }; rank: { toLowerCase(): string } }) => ({
          cardName: item.card.name,
          rarity: item.card.rarity.toLowerCase(),
          rank: item.rank.toLowerCase()
        })),
        clanName: refreshedUser.clanMemberships[0]?.clan.name ?? null
      } satisfies PlayerProfile;
    }

    return {
      telegramId: user.telegramId,
      username: user.username,
      displayName: user.displayName,
      dustBalance: user.dustBalance,
      universePoints: user.universePoints,
      bonusClaims: user.bonusClaims,
      streakCount: user.streakCount,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      lastCardClaimAt: user.lastCardClaimAt?.toISOString() ?? null,
      inventory: [...starterInventory],
      clanName: 'Shadow Legion'
    } satisfies PlayerProfile;
  }

  const existing = inMemoryPlayers.get(input.telegramId);
  const record: PlayerRecord = {
    telegramId: input.telegramId,
    username: input.username,
    displayName: input.displayName,
    dustBalance: existing?.dustBalance ?? 0,
    universePoints: existing?.universePoints ?? 0,
    bonusClaims: existing?.bonusClaims ?? 0,
    streakCount: existing?.streakCount ?? 0,
    lastLoginAt: new Date(),
    lastCardClaimAt: existing?.lastCardClaimAt ?? null,
    inventory: existing?.inventory ?? [...starterInventory],
    clanName: existing?.clanName ?? 'Shadow Legion'
  };

  inMemoryPlayers.set(input.telegramId, record);
  return toProfile(record);
};

export const claimDailyReward = async (telegramId: string) => {
  const profile = await getPlayerProfile(telegramId);
  const nextStreak = profile.streakCount + 1;
  const dustReward = Math.min(500, nextStreak * 10);

  const prisma = getPrisma();

  if (prisma) {
    await ensureSeedWorld(prisma);
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        username: profile.username,
        displayName: profile.displayName,
        streakCount: nextStreak,
        dustBalance: profile.dustBalance + dustReward,
        lastLoginAt: new Date()
      },
      create: {
        telegramId,
        username: profile.username,
        displayName: profile.displayName,
        streakCount: nextStreak,
        dustBalance: dustReward,
        lastLoginAt: new Date()
      }
    });

    await prisma.dailyRewardClaim.upsert({
      where: {
        userId_day: {
          userId: user.id,
          day: nextStreak
        }
      },
      update: {
        claimedAt: new Date()
      },
      create: {
        userId: user.id,
        day: nextStreak,
        claimedAt: new Date()
      }
    });

    return {
      profile: {
        telegramId: user.telegramId,
        username: user.username,
        displayName: user.displayName,
        dustBalance: user.dustBalance,
        universePoints: user.universePoints,
        bonusClaims: user.bonusClaims,
        streakCount: user.streakCount,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        lastCardClaimAt: user.lastCardClaimAt?.toISOString() ?? null,
        inventory: [...starterInventory],
        clanName: 'Shadow Legion'
      },
      reward: {
        streakCount: user.streakCount,
        dustReward
      }
    };
  }

  const updated = await upsertPlayerProfile({
    telegramId,
    username: profile.username,
    displayName: profile.displayName
  });

  const nextBalance = updated.dustBalance + dustReward;
  const inMemoryPlayer = updateFallbackPlayer(telegramId, (record) => ({
    ...record,
    username: profile.username,
    displayName: profile.displayName,
    streakCount: nextStreak,
    dustBalance: nextBalance,
    lastLoginAt: new Date(),
    inventory: record.inventory.length > 0 ? record.inventory : [...starterInventory],
    clanName: record.clanName ?? 'Shadow Legion'
  }));

  return {
    profile: inMemoryPlayer,
    reward: {
      streakCount: nextStreak,
      dustReward
    }
  };
};