import { getPrisma } from './prismaClient.js';
import { QUEST_DEFINITIONS, type QuestType } from './gameRules.js';

const getTodayKey = (): string => new Date().toISOString().slice(0, 10);

/** Called after gameplay actions (claim card, arena battle, craft) to advance matching quests. */
export const incrementQuestProgress = async (telegramId: string, type: QuestType, amount = 1): Promise<void> => {
  const prisma = getPrisma();
  if (!prisma) return;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return;

  const periodKey = getTodayKey();
  const relevantQuests = QUEST_DEFINITIONS.filter((q) => q.type === type);

  for (const quest of relevantQuests) {
    const existing = await prisma.questProgress.findUnique({
      where: { userId_questId_periodKey: { userId: user.id, questId: quest.id, periodKey } }
    });

    if (existing?.completed) continue; // вже виконано сьогодні — не рахуємо далі

    const newProgress = Math.min(quest.target, (existing?.progress ?? 0) + amount);
    const completed = newProgress >= quest.target;

    await prisma.questProgress.upsert({
      where: { userId_questId_periodKey: { userId: user.id, questId: quest.id, periodKey } },
      update: { progress: newProgress, completed },
      create: { userId: user.id, questId: quest.id, periodKey, progress: newProgress, completed }
    });
  }
};

export type QuestView = {
  id: string;
  title: string;
  emoji: string;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewardDust: number;
  rewardPoints: number;
  rewardBonusClaims: number;
};

export const getPlayerQuests = async (telegramId: string): Promise<QuestView[]> => {
  const prisma = getPrisma();
  if (!prisma) return [];

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return [];

  const periodKey = getTodayKey();
  const progressList = await prisma.questProgress.findMany({ where: { userId: user.id, periodKey } });
  const progressByQuestId = new Map(progressList.map((p: any) => [p.questId, p]));

  return QUEST_DEFINITIONS.map((quest) => {
    const progress = progressByQuestId.get(quest.id);
    return {
      id: quest.id,
      title: quest.title,
      emoji: quest.emoji,
      target: quest.target,
      progress: progress?.progress ?? 0,
      completed: progress?.completed ?? false,
      claimed: Boolean(progress?.claimedAt),
      rewardDust: quest.rewardDust,
      rewardPoints: quest.rewardPoints,
      rewardBonusClaims: quest.rewardBonusClaims ?? 0
    };
  });
};

export type ClaimQuestResult =
  | { status: 'not-completed' }
  | { status: 'already-claimed' }
  | {
      status: 'claimed';
      rewardDust: number;
      rewardPoints: number;
      rewardBonusClaims: number;
      dustBalance: number;
      universePoints: number;
      bonusClaims: number;
    };

export const claimQuestReward = async (telegramId: string, questId: string): Promise<ClaimQuestResult | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return null;

  const quest = QUEST_DEFINITIONS.find((q) => q.id === questId);
  if (!quest) return null;

  const periodKey = getTodayKey();
  const progress = await prisma.questProgress.findUnique({
    where: { userId_questId_periodKey: { userId: user.id, questId, periodKey } }
  });

  if (!progress || !progress.completed) {
    return { status: 'not-completed' };
  }
  if (progress.claimedAt) {
    return { status: 'already-claimed' };
  }

  await prisma.questProgress.update({ where: { id: progress.id }, data: { claimedAt: new Date() } });

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      dustBalance: { increment: quest.rewardDust },
      universePoints: { increment: quest.rewardPoints },
      bonusClaims: quest.rewardBonusClaims ? { increment: quest.rewardBonusClaims } : undefined
    }
  });

  return {
    status: 'claimed',
    rewardDust: quest.rewardDust,
    rewardPoints: quest.rewardPoints,
    rewardBonusClaims: quest.rewardBonusClaims ?? 0,
    dustBalance: updatedUser.dustBalance,
    universePoints: updatedUser.universePoints,
    bonusClaims: updatedUser.bonusClaims
  };
};