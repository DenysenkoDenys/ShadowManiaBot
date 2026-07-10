import { getPrisma } from './prismaClient.js';

export type PlayerSettingsView = {
  telegramId: string;
  displayName: string;
  createdAt: string;
  universePoints: number;
  bonusClaims: number;
  premiumUntil: string | null;
  notifyArenaTimer: boolean;
  notifyCardTimer: boolean;
};

const memorySettings = new Map<string, { notifyArenaTimer: boolean; notifyCardTimer: boolean }>();

const getMemorySettings = (telegramId: string) => {
  if (!memorySettings.has(telegramId)) {
    memorySettings.set(telegramId, { notifyArenaTimer: true, notifyCardTimer: true });
  }
  return memorySettings.get(telegramId)!;
};

export const getPlayerSettings = async (telegramId: string): Promise<PlayerSettingsView | null> => {
  const prisma = getPrisma();

  if (prisma) {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return null;

    return {
      telegramId: user.telegramId,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
      universePoints: user.universePoints,
      bonusClaims: user.bonusClaims,
      premiumUntil: user.premiumUntil?.toISOString() ?? null,
      notifyArenaTimer: user.notifyArenaTimer,
      notifyCardTimer: user.notifyCardTimer
    };
  }

  const settings = getMemorySettings(telegramId);
  return {
    telegramId,
    displayName: `Player ${telegramId}`,
    createdAt: new Date().toISOString(),
    universePoints: 0,
    bonusClaims: 0,
    premiumUntil: null,
    notifyArenaTimer: settings.notifyArenaTimer,
    notifyCardTimer: settings.notifyCardTimer
  };
};

export const toggleNotification = async (
  telegramId: string,
  kind: 'arena' | 'card'
): Promise<PlayerSettingsView | null> => {
  const prisma = getPrisma();
  const field = kind === 'arena' ? 'notifyArenaTimer' : 'notifyCardTimer';

  if (prisma) {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return null;

    const updated = await prisma.user.update({
      where: { telegramId },
      data: { [field]: !user[field] }
    });

    return getPlayerSettings(updated.telegramId);
  }

  const settings = getMemorySettings(telegramId);
  settings[field] = !settings[field];
  return getPlayerSettings(telegramId);
};

export const changeNickname = async (telegramId: string, nickname: string): Promise<PlayerSettingsView | null> => {
  const trimmed = nickname.trim().slice(0, 32);
  if (!trimmed) return null;

  const prisma = getPrisma();

  if (prisma) {
    const user = await prisma.user.update({
      where: { telegramId },
      data: { displayName: trimmed, hasCustomNickname: true }
    });
    return getPlayerSettings(user.telegramId);
  }

  return getPlayerSettings(telegramId);
};