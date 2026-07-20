import { getPrisma } from './prismaClient.js';
import { TERRITORY_PAYOUT_INTERVAL_MS, TERRITORY_PAYOUT_BONUS_CLAIMS } from './gameRules.js';

const CHECK_INTERVAL_MS = 60 * 1000;

const processPayouts = async () => {
  const prisma = getPrisma();
  if (!prisma) return;

  const threshold = new Date(Date.now() - TERRITORY_PAYOUT_INTERVAL_MS);

  const dueLocations = await prisma.location.findMany({
    where: { controllingClanId: { not: null }, lastPayoutAt: { lte: threshold } }
  });

  for (const location of dueLocations) {
    const members = await prisma.clanMember.findMany({ where: { clanId: location.controllingClanId! } });

    await prisma.$transaction(
      members.map((m: any) =>
        prisma.user.update({ where: { id: m.userId }, data: { bonusClaims: { increment: TERRITORY_PAYOUT_BONUS_CLAIMS } } })
      )
    );

    await prisma.location.update({ where: { id: location.id }, data: { lastPayoutAt: new Date() } });
  }
};

export const startTerritoryScheduler = () => {
  setInterval(() => {
    processPayouts().catch((error) => console.error('[territory] payout failed:', error));
  }, CHECK_INTERVAL_MS);

  console.log('[territory] Payout scheduler started.');
};