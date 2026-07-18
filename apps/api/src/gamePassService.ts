import { getPrisma } from './prismaClient.js';
import { GAME_PASS_COST_STARS, GAME_PASS_DURATION_DAYS, GAME_PASS_BONUS_CLAIMS_REWARD, CLAN_CREATION_COST } from './gameRules.js';

export type GamePassStatusView = {
  isActive: boolean;
  premiumUntil: string | null;
  costStars: number;
};

export const getGamePassStatus = async (telegramId: string): Promise<GamePassStatusView | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  const isActive = Boolean(user.premiumUntil && user.premiumUntil.getTime() > Date.now());

  return { isActive, premiumUntil: user.premiumUntil?.toISOString() ?? null, costStars: GAME_PASS_COST_STARS };
};

export const activateGamePass = async (telegramId: string): Promise<{ premiumUntil: string; bonusClaims: number } | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  const now = Date.now();
  const currentExpiry = user.premiumUntil && user.premiumUntil.getTime() > now ? user.premiumUntil.getTime() : now;
  const newExpiry = new Date(currentExpiry + GAME_PASS_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      premiumUntil: newExpiry,
      bonusClaims: { increment: GAME_PASS_BONUS_CLAIMS_REWARD }
    }
  });

  return { premiumUntil: updatedUser.premiumUntil!.toISOString(), bonusClaims: updatedUser.bonusClaims };
};

export const isClanCreationFree = (premiumUntil: Date | null): boolean =>
  Boolean(premiumUntil && premiumUntil.getTime() > Date.now());

export { CLAN_CREATION_COST };