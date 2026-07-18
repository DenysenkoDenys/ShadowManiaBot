import { getPrisma } from './prismaClient.js';
import { CLAN_CREATION_COST, CLAN_ROLE_ORDER, getClanMaxMembers, getClanLevelUpCost } from './gameRules.js';
export type ClanListItem = {
    id: string;
    name: string;
    tag: string;
    description: string | null;
    memberCount: number;
    maxMembers: number;
    weeklyScore: number;
    isStarter: boolean;
};

export const listClans = async (): Promise<ClanListItem[]> => {
    const prisma = getPrisma();
    if (!prisma) return [];

    const clans = await prisma.clan.findMany({
        include: { members: true },
        orderBy: { weeklyScore: 'desc' }
    });

    return clans.map((clan: any) => ({
        id: clan.id,
        name: clan.name,
        tag: clan.tag,
        description: clan.description,
        memberCount: clan.members.length,
        maxMembers: clan.maxMembers,
        weeklyScore: clan.weeklyScore,
        isStarter: clan.isStarter
    }));
};

export type ClanMemberView = {
    telegramId: string;
    displayName: string;
    role: string;
    contributionScore: number;
    joinedAt: string;
};

export type MyClanView = {
    id: string;
    name: string;
    tag: string;
    description: string | null;
    weeklyScore: number;
    totalCards: number;
    bankDust: number;
    myRole: string;
    isStarter: boolean;
    members: ClanMemberView[];
};

export const getMyClan = async (telegramId: string): Promise<MyClanView | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return null;

    const membership = await prisma.clanMember.findFirst({
        where: { userId: user.id },
        include: {
            clan: {
                include: {
                    members: {
                        include: { user: true },
                        orderBy: { contributionScore: 'desc' }
                    }
                }
            }
        }
    });

    if (!membership) return null;

    return {
        id: membership.clan.id,
        name: membership.clan.name,
        tag: membership.clan.tag,
        description: membership.clan.description,
        weeklyScore: membership.clan.weeklyScore,
        totalCards: membership.clan.totalCards,
        bankDust: membership.clan.bankDust,
        myRole: membership.role,
        isStarter: membership.clan.isStarter,
        members: membership.clan.members.map((m: any) => ({
            telegramId: m.user.telegramId,
            displayName: m.user.displayName,
            role: m.role,
            contributionScore: m.contributionScore,
            joinedAt: m.joinedAt.toISOString()
        }))
    };
};

export type ClanActionResult =
    | { status: 'ok' }
    | { status: 'already-in-clan' }
    | { status: 'not-in-clan' }
    | { status: 'clan-full' }
    | { status: 'clan-not-found' }
    | { status: 'name-taken' };

export type CreateClanResult = ClanActionResult | { status: 'not-enough-dust'; required: number; have: number };

export const createClan = async (telegramId: string, name: string, tag: string): Promise<CreateClanResult | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return null;

    const existingMembership = await prisma.clanMember.findFirst({ where: { userId: user.id } });
    if (existingMembership) return { status: 'already-in-clan' };

    const nameTaken = await prisma.clan.findFirst({
        where: {
            OR: [
                { name: { equals: name, mode: 'insensitive' } },
                { tag: { equals: tag, mode: 'insensitive' } }
            ]
        }
    });
    if (nameTaken) return { status: 'name-taken' };

    const isPremium = Boolean(user.premiumUntil && user.premiumUntil.getTime() > Date.now());

    if (!isPremium) {
        if (user.dustBalance < CLAN_CREATION_COST) {
            return { status: 'not-enough-dust', required: CLAN_CREATION_COST, have: user.dustBalance };
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { dustBalance: { decrement: CLAN_CREATION_COST } }
        });
    }

    const clan = await prisma.clan.create({
        data: { name, tag, description: `Клан заснований гравцем ${user.displayName}` }
    });

    await prisma.clanMember.create({
        data: { clanId: clan.id, userId: user.id, role: 'LEADER' }
    });

    return { status: 'ok' };
};

export const joinClan = async (telegramId: string, clanId: string): Promise<ClanActionResult | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return null;

    const existingMembership = await prisma.clanMember.findFirst({ where: { userId: user.id } });
    if (existingMembership) return { status: 'already-in-clan' };

    const clan = await prisma.clan.findUnique({ where: { id: clanId }, include: { members: true } });
    if (!clan) return { status: 'clan-not-found' };
    if (clan.members.length >= clan.maxMembers) return { status: 'clan-full' };

    const role = clan.isStarter && clan.members.length === 0 ? 'LEADER' : 'MEMBER';

    await prisma.clanMember.create({ data: { clanId: clan.id, userId: user.id, role } });

    return { status: 'ok' };
};

export const leaveClan = async (telegramId: string): Promise<ClanActionResult | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return null;

    const membership = await prisma.clanMember.findFirst({ where: { userId: user.id } });
    if (!membership) return { status: 'not-in-clan' };

    await prisma.clanMember.delete({ where: { id: membership.id } });

    if (membership.role === 'LEADER') {
        const remainingMembers = await prisma.clanMember.findMany({ where: { clanId: membership.clanId } });

        if (remainingMembers.length === 0) {
            await prisma.clan.delete({ where: { id: membership.clanId } });
        } else {
            const sorted = remainingMembers.sort((a: any, b: any) => {
                const roleDiff = CLAN_ROLE_ORDER.indexOf(a.role) - CLAN_ROLE_ORDER.indexOf(b.role);
                if (roleDiff !== 0) return roleDiff;
                return b.contributionScore - a.contributionScore;
            });
            await prisma.clanMember.update({ where: { id: sorted[0].id }, data: { role: 'LEADER' } });
        }
    }

    return { status: 'ok' };
};

export type SetRoleResult =
    | { status: 'ok' }
    | { status: 'not-leader' }
    | { status: 'target-not-in-clan' }
    | { status: 'cannot-change-own-role' };

export const setMemberRole = async (
    actorTelegramId: string,
    targetTelegramId: string,
    role: 'DEPUTY' | 'COMMANDER' | 'SERGEANT' | 'MEMBER'
): Promise<SetRoleResult | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;

    const actor = await prisma.user.findUnique({ where: { telegramId: actorTelegramId } });
    if (!actor) return null;

    const actorMembership = await prisma.clanMember.findFirst({ where: { userId: actor.id } });
    if (!actorMembership || actorMembership.role !== 'LEADER') return { status: 'not-leader' };

    if (actorTelegramId === targetTelegramId) return { status: 'cannot-change-own-role' };

    const target = await prisma.user.findUnique({ where: { telegramId: targetTelegramId } });
    if (!target) return { status: 'target-not-in-clan' };

    const targetMembership = await prisma.clanMember.findFirst({
        where: { userId: target.id, clanId: actorMembership.clanId }
    });
    if (!targetMembership) return { status: 'target-not-in-clan' };

    await prisma.clanMember.update({ where: { id: targetMembership.id }, data: { role } });
    return { status: 'ok' };
};

export const getClanArenaBonus = async (telegramId: string): Promise<{ attack: number; health: number }> => {
    const prisma = getPrisma();
    if (!prisma) return { attack: 0, health: 0 };

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return { attack: 0, health: 0 };

    const membership = await prisma.clanMember.findFirst({
        where: { userId: user.id },
        include: { clan: { include: { members: true } } }
    });

    if (!membership) return { attack: 0, health: 0 };

    const memberCount = membership.clan.members.length;
    return { attack: memberCount * 150, health: memberCount * 250 };
};


export type ClanDetailsView = MyClanView & {
    level: number;
    levelUpCost: number;
    raidsCount: number;
};

export const getMyClanDetails = async (telegramId: string): Promise<ClanDetailsView | null> => {
    const base = await getMyClan(telegramId);
    if (!base) return null;

    const prisma = getPrisma();
    if (!prisma) return { ...base, level: 1, levelUpCost: getClanLevelUpCost(1), raidsCount: 0 };

    const clan = await prisma.clan.findUnique({
        where: { id: base.id },
        include: { members: { include: { user: true } } }
    });
    if (!clan) return { ...base, level: 1, levelUpCost: getClanLevelUpCost(1), raidsCount: 0 };

    const raidsCount = clan.members.reduce((sum: number, m: any) => sum + m.user.arenaWins + m.user.arenaLosses, 0);

    return { ...base, level: clan.level, levelUpCost: getClanLevelUpCost(clan.level), raidsCount };
};

export type ClanAdminResult =
    | { status: 'ok' }
    | { status: 'not-leader' }
    | { status: 'not-enough-dust'; required: number; have: number };

export const updateClanDescription = async (telegramId: string, description: string): Promise<ClanAdminResult | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return null;

    const membership = await prisma.clanMember.findFirst({ where: { userId: user.id } });
    if (!membership || membership.role !== 'LEADER') return { status: 'not-leader' };

    await prisma.clan.update({ where: { id: membership.clanId }, data: { description: description.slice(0, 300) } });
    return { status: 'ok' };
};

export const levelUpClan = async (telegramId: string): Promise<ClanAdminResult | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return null;

    const membership = await prisma.clanMember.findFirst({ where: { userId: user.id }, include: { clan: true } });
    if (!membership || membership.role !== 'LEADER') return { status: 'not-leader' };

    const cost = getClanLevelUpCost(membership.clan.level);
    if (membership.clan.bankDust < cost) {
        return { status: 'not-enough-dust', required: cost, have: membership.clan.bankDust };
    }

    const newLevel = membership.clan.level + 1;
    await prisma.clan.update({
        where: { id: membership.clanId },
        data: {
            level: newLevel,
            bankDust: { decrement: cost },
            maxMembers: getClanMaxMembers(newLevel)
        }
    });

    return { status: 'ok' };
};

export const deleteClan = async (telegramId: string): Promise<ClanAdminResult | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return null;

    const membership = await prisma.clanMember.findFirst({ where: { userId: user.id } });
    if (!membership || membership.role !== 'LEADER') return { status: 'not-leader' };

    await prisma.clanMember.deleteMany({ where: { clanId: membership.clanId } });
    await prisma.clan.delete({ where: { id: membership.clanId } });

    return { status: 'ok' };
};

export type DepositResult =
    | { status: 'ok'; bankDust: number; dustBalance: number; contributionScore: number }
    | { status: 'not-in-clan' }
    | { status: 'not-enough-dust'; required: number; have: number };

export const depositToClanBank = async (telegramId: string, amount: number): Promise<DepositResult | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return null;

    const membership = await prisma.clanMember.findFirst({ where: { userId: user.id } });
    if (!membership) return { status: 'not-in-clan' };

    if (user.dustBalance < amount) {
        return { status: 'not-enough-dust', required: amount, have: user.dustBalance };
    }

    await prisma.user.update({ where: { id: user.id }, data: { dustBalance: { decrement: amount } } });
    const updatedClan = await prisma.clan.update({
        where: { id: membership.clanId },
        data: { bankDust: { increment: amount } }
    });
    const updatedMembership = await prisma.clanMember.update({
        where: { id: membership.id },
        data: { contributionScore: { increment: amount } }
    });

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });

    return {
        status: 'ok',
        bankDust: updatedClan.bankDust,
        dustBalance: updatedUser?.dustBalance ?? 0,
        contributionScore: updatedMembership.contributionScore
    };
};

export type ClanRankingItem = {
    name: string;
    tag: string;
    level: number;
    weeklyScore: number;
    memberCount: number;
};

export const getClanRanking = async (limit = 10): Promise<ClanRankingItem[]> => {
    const prisma = getPrisma();
    if (!prisma) return [];

    const clans = await prisma.clan.findMany({
        include: { members: true },
        orderBy: { weeklyScore: 'desc' },
        take: limit
    });

    return clans.map((clan: any) => ({
        name: clan.name,
        tag: clan.tag,
        level: clan.level,
        weeklyScore: clan.weeklyScore,
        memberCount: clan.members.length
    }));
};

export const getClanByInviteId = async (clanId: string): Promise<{ name: string; tag: string } | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;
    const clan = await prisma.clan.findUnique({ where: { id: clanId } });
    return clan ? { name: clan.name, tag: clan.tag } : null;
};