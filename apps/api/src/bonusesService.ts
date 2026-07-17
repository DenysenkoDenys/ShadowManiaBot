import { getPrisma } from './prismaClient.js';
import { BONUS_MILESTONES } from './gameRules.js';

export type BonusMilestoneView = {
  threshold: number;
  rewardBonusClaims: number;
  rewardShards: number;
  claimed: boolean;
  unlocked: boolean;
};

export type BonusesStatusView = {
  totalCardClaims: number;
  milestones: BonusMilestoneView[];
};

const getClaimedThresholds = async (prisma: any, userId: string): Promise<Set<number>> => {
  const claims = await prisma.bonusMilestoneClaim.findMany({ where: { userId } });
  return new Set(claims.map((c: any) => c.threshold));
};

export const getBonusesStatus = async (telegramId: string): Promise<BonusesStatusView | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  const claimedThresholds = await getClaimedThresholds(prisma, user.id);

  const milestones: BonusMilestoneView[] = BONUS_MILESTONES.map((m) => ({
    threshold: m.threshold,
    rewardBonusClaims: m.rewardBonusClaims,
    rewardShards: m.rewardShards,
    claimed: claimedThresholds.has(m.threshold),
    unlocked: user.totalCardClaims >= m.threshold
  }));

  return { totalCardClaims: user.totalCardClaims, milestones };
};

export type ClaimBonusResult =
  | { status: 'not-unlocked' }
  | { status: 'already-claimed' }
  | { status: 'ok'; rewardBonusClaims: number; rewardShards: number; bonusClaims: number; shards: number };

export const claimBonusMilestone = async (telegramId: string, threshold: number): Promise<ClaimBonusResult | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  const milestone = BONUS_MILESTONES.find((m) => m.threshold === threshold);
  if (!milestone) return { status: 'not-unlocked' };

  if (user.totalCardClaims < threshold) return { status: 'not-unlocked' };

  const existing = await prisma.bonusMilestoneClaim.findUnique({
    where: { userId_threshold: { userId: user.id, threshold } }
  });
  if (existing) return { status: 'already-claimed' };

  await prisma.bonusMilestoneClaim.create({ data: { userId: user.id, threshold } });

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      bonusClaims: { increment: milestone.rewardBonusClaims },
      shards: milestone.rewardShards ? { increment: milestone.rewardShards } : undefined
    }
  });

  return {
    status: 'ok',
    rewardBonusClaims: milestone.rewardBonusClaims,
    rewardShards: milestone.rewardShards,
    bonusClaims: updatedUser.bonusClaims,
    shards: updatedUser.shards
  };
};