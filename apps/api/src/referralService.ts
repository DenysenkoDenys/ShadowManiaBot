import { getPrisma } from './prismaClient.js';
import { REFERRAL_DAILY_LIMIT, REFERRAL_REWARD_BONUS_CLAIMS, REFERRAL_REWARD_GAME_PASS_DAYS } from './gameRules.js';

const getTodayKey = (): string => new Date().toISOString().slice(0, 10);

export type ReferralStatusView = {
  totalReferred: number;
  referredToday: number;
  dailyLimit: number;
  referralLink: string;
};

export const getReferralStatus = async (telegramId: string, botUsername: string): Promise<ReferralStatusView | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  const totalReferred = await prisma.referral.count({ where: { inviterId: user.id } });

  const todayStart = new Date(`${getTodayKey()}T00:00:00.000Z`);
  const referredToday = await prisma.referral.count({
    where: { inviterId: user.id, createdAt: { gte: todayStart } }
  });

  return {
    totalReferred,
    referredToday,
    dailyLimit: REFERRAL_DAILY_LIMIT,
    referralLink: `https://t.me/${botUsername}?start=ref_${telegramId}`
  };
};

export type RegisterReferralResult =
  | { status: 'ok'; rewardBonusClaims: number; rewardGamePassDays: number }
  | { status: 'self-referral' }
  | { status: 'already-referred' }
  | { status: 'daily-limit-reached' }
  | { status: 'inviter-not-found' };

/** Called once, when a brand-new user starts the bot via a referral deep-link. */
export const registerReferral = async (inviterTelegramId: string, inviteeTelegramId: string): Promise<RegisterReferralResult | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  if (inviterTelegramId === inviteeTelegramId) return { status: 'self-referral' };

  const inviter = await prisma.user.findUnique({ where: { telegramId: inviterTelegramId } });
  if (!inviter) return { status: 'inviter-not-found' };

  const invitee = await prisma.user.findUnique({ where: { telegramId: inviteeTelegramId } });
  if (!invitee) return { status: 'inviter-not-found' };

  // Гравець вже має запрошувача (перевірка на "хтось інший вже запросив цього юзера").
  if (invitee.referredBy) return { status: 'already-referred' };

  const existingReferral = await prisma.referral.findUnique({ where: { inviteeId: invitee.id } });
  if (existingReferral) return { status: 'already-referred' };

  const todayStart = new Date(`${getTodayKey()}T00:00:00.000Z`);
  const referredToday = await prisma.referral.count({
    where: { inviterId: inviter.id, createdAt: { gte: todayStart } }
  });
  if (referredToday >= REFERRAL_DAILY_LIMIT) return { status: 'daily-limit-reached' };

  await prisma.referral.create({ data: { inviterId: inviter.id, inviteeId: invitee.id } });
  await prisma.user.update({ where: { id: invitee.id }, data: { referredBy: inviter.id } });

  const now = new Date();
  const currentExpiry = inviter.premiumUntil && inviter.premiumUntil.getTime() > now.getTime()
    ? inviter.premiumUntil.getTime()
    : now.getTime();
  const newExpiry = new Date(currentExpiry + REFERRAL_REWARD_GAME_PASS_DAYS * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: inviter.id },
    data: {
      bonusClaims: { increment: REFERRAL_REWARD_BONUS_CLAIMS },
      premiumUntil: newExpiry
    }
  });

  return {
    status: 'ok',
    rewardBonusClaims: REFERRAL_REWARD_BONUS_CLAIMS,
    rewardGamePassDays: REFERRAL_REWARD_GAME_PASS_DAYS
  };
};