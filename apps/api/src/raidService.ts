import { getPrisma } from './prismaClient.js';
import { RAID_COOLDOWN_MS } from './gameRules.js';

export type MapLocationView = {
    id: string;
    name: string;
    emoji: string;
    maxHp: number;
    currentHp: number;
    controllingClanName: string | null;
    controllingClanLeader: string | null;
};

export const getLocationsMap = async (): Promise<MapLocationView[]> => {
    const prisma = getPrisma();
    if (!prisma) return [];

    const locations = await prisma.location.findMany({
        include: { controllingClan: { include: { members: { where: { role: 'LEADER' }, include: { user: true } } } } }
    });

    return locations.map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        emoji: loc.emoji,
        maxHp: loc.maxHp,
        currentHp: loc.currentHp,
        controllingClanName: loc.controllingClan?.name ?? null,
        controllingClanLeader: loc.controllingClan?.members[0]?.user.displayName ?? null
    }));
};

export type RaidResult =
    | { status: 'cooldown'; remainingMs: number }
    | { status: 'no-clan' }
    | { status: 'own-territory' }
    | { status: 'ok'; damage: number; locationName: string; captured: boolean; remainingHp: number };

export const raidLocation = async (telegramId: string, locationId: string): Promise<RaidResult | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return null;

    const now = Date.now();
    const lastRaidAt = user.lastRaidAt;
    const onCooldown = lastRaidAt !== null && now - lastRaidAt.getTime() < RAID_COOLDOWN_MS;
    if (onCooldown) {
        const elapsed = now - lastRaidAt.getTime();
        return { status: 'cooldown', remainingMs: RAID_COOLDOWN_MS - elapsed };
    }

    const membership = await prisma.clanMember.findFirst({ where: { userId: user.id } });
    if (!membership) return { status: 'no-clan' };

    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location) return null;

    if (location.controllingClanId === membership.clanId) {
        return { status: 'own-territory' };
    }

    const topCards = await prisma.cardInstance.findMany({
        where: { ownerId: user.id },
        include: { card: true },
        orderBy: [{ card: { basePower: 'desc' } }],
        take: 5
    });
    const damage = topCards.reduce((sum: number, i: any) => sum + i.card.basePower + i.card.health, 500);

    await prisma.user.update({ where: { id: user.id }, data: { lastRaidAt: new Date(now) } });

    const newHp = location.currentHp - damage;
    const captured = newHp <= 0;

    if (captured) {
        await prisma.location.update({
            where: { id: location.id },
            data: { currentHp: location.maxHp, controllingClanId: membership.clanId, lastPayoutAt: new Date(now) }
        });
    } else {
        await prisma.location.update({ where: { id: location.id }, data: { currentHp: newHp } });
    }

    return {
        status: 'ok',
        damage,
        locationName: location.name,
        captured,
        remainingHp: captured ? location.maxHp : newHp
    };
};