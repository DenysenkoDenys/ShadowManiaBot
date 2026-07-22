import { getPrisma } from './prismaClient.js';

export type RankingEntry = {
    rank: number;
    displayName: string;
    value: number;
};

const RANKING_LIMIT = 10;

export const getSeasonRanking = async (): Promise<RankingEntry[]> => {
    const prisma = getPrisma();
    if (!prisma) return [];

    const users = await prisma.user.findMany({
        orderBy: { universePoints: 'desc' },
        take: RANKING_LIMIT,
        select: { displayName: true, universePoints: true }
    });

    return users.map((u: any, i: number) => ({ rank: i + 1, displayName: u.displayName, value: u.universePoints }));
};

export type AllTimeRankingEntry = {
    rank: number;
    displayName: string;
    totalCardClaims: number;
    universePoints: number;
};

export const getAllTimeRanking = async (): Promise<AllTimeRankingEntry[]> => {
    const prisma = getPrisma();
    if (!prisma) return [];

    const users = await prisma.user.findMany({
        orderBy: { totalCardClaims: 'desc' },
        take: RANKING_LIMIT,
        select: { displayName: true, totalCardClaims: true, universePoints: true }
    });

    return users.map((u: any, i: number) => ({
        rank: i + 1,
        displayName: u.displayName,
        totalCardClaims: u.totalCardClaims,
        universePoints: u.universePoints
    }));
};

export const getArenaRanking = async (): Promise<RankingEntry[]> => {
    const prisma = getPrisma();
    if (!prisma) return [];

    const users = await prisma.user.findMany({
        orderBy: { arenaRating: 'desc' },
        take: RANKING_LIMIT,
        select: { displayName: true, arenaRating: true }
    });

    return users.map((u: any, i: number) => ({ rank: i + 1, displayName: u.displayName, value: u.arenaRating }));
};

export const getReferralsRanking = async (): Promise<RankingEntry[]> => {
    const prisma = getPrisma();
    if (!prisma) return [];

    const grouped = await prisma.referral.groupBy({
        by: ['inviterId'],
        _count: { inviterId: true },
        orderBy: { _count: { inviterId: 'desc' } },
        take: RANKING_LIMIT
    });

    const results: RankingEntry[] = [];
    for (let i = 0; i < grouped.length; i += 1) {
        const user = await prisma.user.findUnique({ where: { id: grouped[i].inviterId } });
        if (user) {
            results.push({ rank: i + 1, displayName: user.displayName, value: grouped[i]._count.inviterId });
        }
    }
    return results;
};