import { getPrisma } from './prismaClient.js';
import {
    ARENA_COOLDOWN_MS,
    ARENA_TEAM_SIZE,
    ARENA_RATING_K,
    ARENA_WIN_DUST,
    ARENA_LOSS_DUST,
    ARENA_WIN_POINTS,
    ARENA_LOSS_POINTS,
    ARENA_PVP_CHANCE
} from './gameRules.js';

const randomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const expectedScore = (ratingA: number, ratingB: number) => 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));

export type OwnedCardOption = {
    cardId: string;
    name: string;
    rarity: string;
    attack: number;
    health: number;
    imageUrl: string | null;
};

const getOwnedCardsFlat = async (prisma: any, userId: string): Promise<OwnedCardOption[]> => {
    const instances = await prisma.cardInstance.findMany({
        where: { ownerId: userId },
        include: { card: true }
    });

    return instances
        .map((instance: any) => ({
            cardId: instance.card.id,
            name: instance.card.name,
            rarity: instance.card.rarity.toLowerCase(),
            attack: instance.card.basePower,
            health: instance.card.health,
            imageUrl: instance.card.imageUrl ?? null
        }))
        .sort((a: OwnedCardOption, b: OwnedCardOption) => (b.attack + b.health) - (a.attack + a.health));
};

export const getAvailableCardsForTeam = async (telegramId: string): Promise<OwnedCardOption[]> => {
    const prisma = getPrisma();
    if (!prisma) return [];

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return [];

    const owned = await getOwnedCardsFlat(prisma, user.id);
    const usedIds = new Set(normalizeSlots(user.arenaTeamCardIds).filter(Boolean));

    return owned.filter((card) => !usedIds.has(card.cardId));
};

export type TeamSlotView = OwnedCardOption | null;

export type TeamView = {
    slots: TeamSlotView[];
    totalAttack: number;
    totalHealth: number;
    clanBonusAttack: number;
    clanBonusHealth: number;
};

const normalizeSlots = (raw: string[]): string[] => {
    const slots = [...raw];
    while (slots.length < ARENA_TEAM_SIZE) slots.push('');
    return slots.slice(0, ARENA_TEAM_SIZE);
};

export const getTeamView = async (telegramId: string): Promise<TeamView | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return null;

    const owned = await getOwnedCardsFlat(prisma, user.id);
    const ownedById = new Map(owned.map((c) => [c.cardId, c]));
    const slots = normalizeSlots(user.arenaTeamCardIds).map((cardId) => (cardId ? ownedById.get(cardId) ?? null : null));

    const totalAttack = slots.reduce((sum, s) => sum + (s?.attack ?? 0), 0);
    const totalHealth = slots.reduce((sum, s) => sum + (s?.health ?? 0), 0);

    return { slots, totalAttack, totalHealth, clanBonusAttack: 0, clanBonusHealth: 0 };
};

export const getOwnedCardBrowser = async (telegramId: string): Promise<OwnedCardOption[]> => {
  return getAvailableCardsForTeam(telegramId);
};

export const setTeamSlot = async (telegramId: string, slotIndex: number, cardId: string): Promise<TeamView | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;
    if (slotIndex < 0 || slotIndex >= ARENA_TEAM_SIZE) return null;

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return null;

    const owned = await getOwnedCardsFlat(prisma, user.id);
    if (!owned.some((c) => c.cardId === cardId)) return null;

    const slots = normalizeSlots(user.arenaTeamCardIds);

    if (slots[slotIndex] === cardId) {
        // Повторний тап по тому ж слоту — знімає картку зі слоту.
        slots[slotIndex] = '';
    } else {
        // Прибираємо цю картку з будь-якого іншого слоту (одна картка — один слот).
        for (let i = 0; i < slots.length; i += 1) {
            if (slots[i] === cardId) slots[i] = '';
        }
        slots[slotIndex] = cardId;
    }

    await prisma.user.update({ where: { id: user.id }, data: { arenaTeamCardIds: slots } });
    return getTeamView(telegramId);
};

export type ArenaOpponentView = {
    displayName: string;
    isPlayer: boolean;
    telegramId: string | null;
    totalAttack: number;
    totalHealth: number;
    rating: number;
};

const generateBotOpponent = (attackerAttack: number, attackerHealth: number, rating: number): ArenaOpponentView => {
  const attackVariance = 0.85 + Math.random() * 0.20; // 0.85 .. 1.05
  const healthVariance = 0.85 + Math.random() * 0.20;

  const nameOptions = [
    'Тінь Акацукі', 'Мисливець на бошу', 'Найманець з ANBU', 'Розбійник з Кіри',
    'Вигнанець з Суни', 'Зрадник Коноги', 'Дух старого клану', 'Блукач пустелі'
  ];

  return {
    displayName: nameOptions[Math.floor(Math.random() * nameOptions.length)],
    isPlayer: false,
    telegramId: null,
    totalAttack: Math.max(50, Math.round(attackerAttack * attackVariance)),
    totalHealth: Math.max(50, Math.round(attackerHealth * healthVariance)),
    rating
  };
};

const findPlayerOpponent = async (prisma: any, telegramId: string, myRating: number): Promise<{
    opponent: ArenaOpponentView;
    opponentUserId: string;
} | null> => {
    const candidates = await prisma.user.findMany({
        where: {
            telegramId: { not: telegramId },
            arenaTeamCardIds: { isEmpty: false }
        },
        take: 30
    });

    const valid: any[] = [];
    for (const candidate of candidates) {
        const filled = candidate.arenaTeamCardIds.filter((id: string) => id).length;
        if (filled > 0) valid.push(candidate);
    }

    if (valid.length === 0) return null;

    valid.sort((a, b) => Math.abs(a.arenaRating - myRating) - Math.abs(b.arenaRating - myRating));
    const pick = valid[Math.floor(Math.random() * Math.min(5, valid.length))];

    const owned = await getOwnedCardsFlat(prisma, pick.id);
    const ownedById = new Map(owned.map((c: OwnedCardOption) => [c.cardId, c]));
    const slots = normalizeSlots(pick.arenaTeamCardIds).map((id) => (id ? ownedById.get(id) : null)).filter(Boolean) as OwnedCardOption[];

    const totalAttack = slots.reduce((sum, s) => sum + s.attack, 0);
    const totalHealth = slots.reduce((sum, s) => sum + s.health, 0);

    return {
        opponentUserId: pick.id,
        opponent: {
            displayName: pick.displayName,
            isPlayer: true,
            telegramId: pick.telegramId,
            totalAttack,
            totalHealth,
            rating: pick.arenaRating
        }
    };
};

export type ArenaSearchResult =
    | { status: 'cooldown'; remainingMs: number }
    | { status: 'no-team' }
    | {
        status: 'battle';
        win: boolean;
        attackerPower: { attack: number; health: number };
        opponent: ArenaOpponentView;
        rounds: number;
        totalDamageDealt: number;
        totalDamageTaken: number;
        ratingBefore: number;
        ratingAfter: number;
        ratingDelta: number;
        dustGained: number;
        pointsGained: number;
        dustBalance: number;
        universePoints: number;
        arenaWins: number;
        arenaLosses: number;
    };

const runBattle = (attackerAttack: number, attackerHealth: number, opponentAttack: number, opponentHealth: number) => {
    let hpA = attackerHealth;
    let hpB = opponentHealth;
    let rounds = 0;
    let damageDealt = 0;
    let damageTaken = 0;

    while (rounds < 50) {
        rounds += 1;
        hpB -= attackerAttack;
        hpA -= opponentAttack;
        damageDealt += attackerAttack;
        damageTaken += opponentAttack;

        if (hpB <= 0 && hpA <= 0) {
            return { win: attackerAttack >= opponentAttack, rounds, damageDealt, damageTaken, finalOpponentHp: Math.max(0, hpB) };
        }
        if (hpB <= 0) {
            return { win: true, rounds, damageDealt, damageTaken, finalOpponentHp: 0 };
        }
        if (hpA <= 0) {
            return { win: false, rounds, damageDealt, damageTaken, finalOpponentHp: Math.max(0, hpB) };
        }
    }

    return { win: hpA >= hpB, rounds, damageDealt, damageTaken, finalOpponentHp: Math.max(0, hpB) };
};

export const searchAndFight = async (telegramId: string): Promise<ArenaSearchResult> => {
    const prisma = getPrisma();
    if (!prisma) return { status: 'no-team' };

    const now = Date.now();
    const user = await prisma.user.upsert({
        where: { telegramId },
        update: {},
        create: { telegramId, displayName: `Player ${telegramId}` }
    });

    const lastBattleAt = user.lastArenaBattleAt;
    const onCooldown = lastBattleAt !== null && now - lastBattleAt.getTime() < ARENA_COOLDOWN_MS;
    if (onCooldown) {
        const elapsed = now - (lastBattleAt as Date).getTime();
        return { status: 'cooldown', remainingMs: ARENA_COOLDOWN_MS - elapsed };
    }

    const team = await getTeamView(telegramId);
    const filledSlots = team?.slots.filter(Boolean) ?? [];
    if (!team || filledSlots.length === 0) {
        return { status: 'no-team' };
    }

    const attackerAttack = team.totalAttack + team.clanBonusAttack;
    const attackerHealth = team.totalHealth + team.clanBonusHealth;

    const tryPlayerMatch = Math.random() < ARENA_PVP_CHANCE;
    const playerMatch = tryPlayerMatch ? await findPlayerOpponent(prisma, telegramId, user.arenaRating) : null;

    const opponent: ArenaOpponentView = playerMatch
        ? playerMatch.opponent
        : generateBotOpponent(attackerAttack, attackerHealth, user.arenaRating);

    const battle = runBattle(attackerAttack, attackerHealth, opponent.totalAttack, opponent.totalHealth);

    const expected = expectedScore(user.arenaRating, opponent.rating);
    const actualScore = battle.win ? 1 : 0;
    const ratingDelta = Math.round(ARENA_RATING_K * (actualScore - expected));
    const ratingAfter = Math.max(100, user.arenaRating + ratingDelta);

    const dustGained = battle.win
        ? randomInRange(ARENA_WIN_DUST.min, ARENA_WIN_DUST.max)
        : randomInRange(ARENA_LOSS_DUST.min, ARENA_LOSS_DUST.max);
    const pointsGained = battle.win ? ARENA_WIN_POINTS : ARENA_LOSS_POINTS;

    const battleLog = {
        win: battle.win,
        opponentName: opponent.displayName,
        isPlayerOpponent: opponent.isPlayer,
        rounds: battle.rounds,
        totalDamageDealt: battle.damageDealt,
        totalDamageTaken: battle.damageTaken,
        opponentFinalHp: battle.finalOpponentHp,
        timestamp: new Date(now).toISOString()
    };

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            lastArenaBattleAt: new Date(now),
            arenaRating: ratingAfter,
            arenaWins: battle.win ? { increment: 1 } : undefined,
            arenaLosses: battle.win ? undefined : { increment: 1 },
            dustBalance: { increment: dustGained },
            universePoints: { increment: pointsGained },
            lastArenaBattleLog: battleLog
        }
    });

    if (playerMatch && !battle.win) {
        // Гравець-суперник успішно захистився від атаки.
        await prisma.user.update({
            where: { id: playerMatch.opponentUserId },
            data: { arenaDefended: { increment: 1 } }
        });
    }

    return {
        status: 'battle',
        win: battle.win,
        attackerPower: { attack: attackerAttack, health: attackerHealth },
        opponent,
        rounds: battle.rounds,
        totalDamageDealt: battle.damageDealt,
        totalDamageTaken: battle.damageTaken,
        ratingBefore: user.arenaRating,
        ratingAfter: updatedUser.arenaRating,
        ratingDelta,
        dustGained,
        pointsGained,
        dustBalance: updatedUser.dustBalance,
        universePoints: updatedUser.universePoints,
        arenaWins: updatedUser.arenaWins,
        arenaLosses: updatedUser.arenaLosses
    };
};

export const getArenaStatus = async (telegramId: string): Promise<{ remainingMs: number; rating: number }> => {
    const prisma = getPrisma();
    const now = Date.now();
    if (!prisma) return { remainingMs: 0, rating: 1000 };

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return { remainingMs: 0, rating: 1000 };

    const lastBattleAt = user.lastArenaBattleAt;
    const remainingMs = lastBattleAt ? Math.max(0, ARENA_COOLDOWN_MS - (now - lastBattleAt.getTime())) : 0;
    return { remainingMs, rating: user.arenaRating };
};

export type ArenaStatsView = {
    wins: number;
    losses: number;
    defended: number;
    totalBattles: number;
};

export const getArenaStats = async (telegramId: string): Promise<ArenaStatsView> => {
    const prisma = getPrisma();
    if (!prisma) return { wins: 0, losses: 0, defended: 0, totalBattles: 0 };

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return { wins: 0, losses: 0, defended: 0, totalBattles: 0 };

    return {
        wins: user.arenaWins,
        losses: user.arenaLosses,
        defended: user.arenaDefended,
        totalBattles: user.arenaWins + user.arenaLosses
    };
};

export const getLastBattleLog = async (telegramId: string): Promise<any | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;
    const user = await prisma.user.findUnique({ where: { telegramId } });
    return user?.lastArenaBattleLog ?? null;
};