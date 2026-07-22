import './loadEnv.js';
import Fastify from 'fastify';
import { getBonusesStatus, claimBonusMilestone } from './bonusesService.js';
import { getGamePassStatus, activateGamePass } from './gamePassService.js';
import { getLocationsMap, raidLocation } from './raidService.js';
import { getSeasonRanking, getAllTimeRanking, getArenaRanking, getReferralsRanking } from './ratingService.js';
import { startTerritoryScheduler } from './territoryScheduler.js';
import { getClanMemberTelegramIds, getOrCreateClanQuest } from './clanService.js';
import { getReferralStatus, registerReferral } from './referralService.js';
import { addCard, addClan, addSeason, getDashboardSnapshot, listCards, listClans, listPacks, listSeasons } from './contentStore.js';
import { claimDailyReward, getPlayerProfile, upsertPlayerProfile } from './playerStore.js';
import { claimCard, getClaimCooldown, getPlayerCollection, getPlayerChronicles } from './cardService.js';
import { getPlayerSettings, toggleNotification, changeNickname } from './settingsService.js';
import { getShopStatus, buyBonusClaims, craftCard } from './shopService.js';
import { searchAndFight, getArenaStatus, getTeamView, getOwnedCardBrowser, setTeamSlot, getArenaStats, getLastBattleLog } from './arenaService.js';
import { startNotificationScheduler } from './notificationScheduler.js';
import { getPlayerQuests, claimQuestReward } from './questService.js';
import { getPrisma } from './prismaClient.js';
import { getCraftAttemptsStatus, craftAttemptsFromDuplicates, craftAttemptsFromShards, craftAllAttempts } from './craftAttemptsService.js';
import {
  listClans as listActiveClans,
  getMyClan,
  getMyClanDetails,
  createClan,
  joinClan,
  leaveClan,
  setMemberRole,
  updateClanDescription,
  levelUpClan,
  deleteClan,
  depositToClanBank,
  getClanRanking,
  getClanByInviteId
} from './clanService.js';
import {
  achievementPreview,
  cardRanks,
  cardRarities,
  clanRewardTiers,
  collectionSets,
  coreSystems,
  dailyLoginRewards,
  designPillars,
  evolutionPreview,
  pityRules,
  rewardLadder,
  seasonThemes
} from './gameRules.js';

const server = Fastify({ logger: true });

server.get('/api/ratings/season', async () => ({ ranking: await getSeasonRanking() }));
server.get('/api/ratings/alltime', async () => ({ ranking: await getAllTimeRanking() }));
server.get('/api/ratings/arena', async () => ({ ranking: await getArenaRanking() }));
server.get('/api/ratings/referrals', async () => ({ ranking: await getReferralsRanking() }));

server.get('/api/map', async () => ({ locations: await getLocationsMap() }));

server.post('/api/player/:telegramId/raid/:locationId', async (request, reply) => {
  const params = request.params as { telegramId: string; locationId: string };
  const result = await raidLocation(params.telegramId, params.locationId);
  if (!result) {
    reply.code(404);
    return { error: 'Not found' };
  }
  return result;
});

server.get('/api/player/:telegramId/clan/broadcast-targets', async (request) => {
  const params = request.params as { telegramId: string };
  const ids = await getClanMemberTelegramIds(params.telegramId);
  return { targetTelegramIds: ids ?? [] };
});

server.get('/api/player/:telegramId/clan/quest', async (request) => {
  const params = request.params as { telegramId: string };
  return { quest: await getOrCreateClanQuest(params.telegramId) };
});

server.get('/health', async () => ({ status: 'ok' }));

server.get('/api/admin/dashboard', async () => getDashboardSnapshot());

server.get('/api/admin/seasons', async () => ({ seasons: listSeasons() }));

server.post('/api/admin/seasons', async (request) => {
  const body = request.body as { name?: string; theme?: string; status?: 'planned' | 'active' | 'ended' };

  return {
    season: addSeason({
      name: body.name ?? 'Untitled season',
      theme: body.theme ?? 'Custom',
      status: body.status ?? 'planned'
    })
  };
});

server.get('/api/admin/cards', async () => ({ cards: listCards() }));

server.post('/api/admin/cards', async (request) => {
  const body = request.body as {
    name?: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
    season?: string;
    universe?: string;
    attack?: number;
    health?: number;
  };

  return {
    card: addCard({
      name: body.name ?? 'Untitled card',
      rarity: body.rarity ?? 'common',
      season: body.season ?? 'Season 1',
      universe: body.universe ?? 'Naruto',
      attack: body.attack ?? 500,
      health: body.health ?? 1000
    })
  };
});

server.get('/api/admin/clans', async () => ({ clans: listClans() }));

server.get('/api/admin/packs', async () => ({ packs: listPacks() }));

server.post('/api/admin/clans', async (request) => {
  const body = request.body as { name?: string; tag?: string; focus?: string };

  return {
    clan: addClan({
      name: body.name ?? 'Untitled clan',
      tag: body.tag ?? 'NEW',
      focus: body.focus ?? 'Unspecified'
    })
  };
});

server.post('/api/player/upsert', async (request) => {
  const body = request.body as { telegramId?: string; username?: string | null; displayName?: string };

  return {
    player: await upsertPlayerProfile({
      telegramId: body.telegramId ?? '0',
      username: body.username ?? null,
      displayName: body.displayName ?? 'Unknown player'
    })
  };
});

server.get('/api/player/:telegramId', async (request) => {
  const params = request.params as { telegramId: string };

  return {
    player: await getPlayerProfile(params.telegramId)
  };
});

server.post('/api/player/:telegramId/daily', async (request) => {
  const params = request.params as { telegramId: string };

  return await claimDailyReward(params.telegramId);
});

server.get('/api/player/:telegramId/profile', async (request) => {
  const params = request.params as { telegramId: string };
  const player = await getPlayerProfile(params.telegramId);
  const collection = await getPlayerCollection(params.telegramId);

  return {
    player: {
      ...player,
      totalCardsOwned: collection.totalOwned,
      totalCardsAvailable: collection.totalCards
    }
  };
});

server.post('/api/player/:telegramId/claim-card', async (request) => {
  const params = request.params as { telegramId: string };
  return await claimCard(params.telegramId);
});

server.get('/api/player/:telegramId/claim-card/status', async (request) => {
  const params = request.params as { telegramId: string };
  return await getClaimCooldown(params.telegramId);
});

server.get('/api/player/:telegramId/collection', async (request) => {
  const params = request.params as { telegramId: string };
  return await getPlayerCollection(params.telegramId);
});

server.get('/api/player/:telegramId/settings', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const settings = await getPlayerSettings(params.telegramId);
  if (!settings) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return settings;
});

server.post('/api/player/:telegramId/settings/toggle-notification', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const body = request.body as { kind?: 'arena' | 'card' };

  if (body.kind !== 'arena' && body.kind !== 'card' && body.kind !== 'craft') {
    reply.code(400);
    return { error: 'kind must be "arena", "card" or "craft"' };
  }

  const settings = await toggleNotification(params.telegramId, body.kind);
  if (!settings) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return settings;
});

server.post('/api/player/:telegramId/nickname', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const body = request.body as { nickname?: string };

  if (!body.nickname || !body.nickname.trim()) {
    reply.code(400);
    return { error: 'nickname is required' };
  }

  const settings = await changeNickname(params.telegramId, body.nickname);
  if (!settings) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return settings;
});

server.get('/api/player/:telegramId/chronicles', async (request) => {
  const params = request.params as { telegramId: string };
  return await getPlayerChronicles(params.telegramId);
});

server.get('/api/player/:telegramId/arena/status', async (request) => {
  const params = request.params as { telegramId: string };
  return await getArenaStatus(params.telegramId);
});

server.get('/api/player/:telegramId/arena/team', async (request) => {
  const params = request.params as { telegramId: string };
  return await getTeamView(params.telegramId);
});

server.get('/api/player/:telegramId/arena/team/cards', async (request) => {
  const params = request.params as { telegramId: string };
  return { cards: await getOwnedCardBrowser(params.telegramId) };
});

server.post('/api/player/:telegramId/arena/team/slot', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const body = request.body as { slotIndex?: number; cardId?: string };

  if (body.slotIndex === undefined || !body.cardId) {
    reply.code(400);
    return { error: 'slotIndex and cardId are required' };
  }

  const team = await setTeamSlot(params.telegramId, body.slotIndex, body.cardId);
  if (!team) {
    reply.code(400);
    return { error: 'Could not update team slot' };
  }
  return team;
});

server.post('/api/player/:telegramId/arena/search', async (request) => {
  const params = request.params as { telegramId: string };
  return await searchAndFight(params.telegramId);
});

server.get('/api/player/:telegramId/arena/stats', async (request) => {
  const params = request.params as { telegramId: string };
  return await getArenaStats(params.telegramId);
});

server.get('/api/player/:telegramId/arena/history', async (request) => {
  const params = request.params as { telegramId: string };
  return { log: await getLastBattleLog(params.telegramId) };
});

server.get('/api/player/:telegramId/shop', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const status = await getShopStatus(params.telegramId);
  if (!status) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return status;
});

server.post('/api/player/:telegramId/shop/buy-claims', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const body = request.body as { quantity?: number };
  const quantity = body.quantity ?? 1;

  const result = await buyBonusClaims(params.telegramId, quantity);
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.post('/api/player/:telegramId/shop/craft', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const body = request.body as { rarity?: string };

  if (!body.rarity) {
    reply.code(400);
    return { error: 'rarity is required' };
  }

  const result = await craftCard(params.telegramId, body.rarity as any);
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.get('/api/player/:telegramId/quests', async (request) => {
  const params = request.params as { telegramId: string };
  return { quests: await getPlayerQuests(params.telegramId) };
});

server.post('/api/player/:telegramId/quests/:questId/claim', async (request, reply) => {
  const params = request.params as { telegramId: string; questId: string };
  const result = await claimQuestReward(params.telegramId, params.questId);
  if (!result) {
    reply.code(404);
    return { error: 'Player or quest not found' };
  }
  return result;
});

server.get('/api/player/:telegramId/craft-attempts', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const status = await getCraftAttemptsStatus(params.telegramId);
  if (!status) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return status;
});

server.post('/api/player/:telegramId/craft-attempts/duplicates', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const body = request.body as { rarity?: string };

  if (!body.rarity) {
    reply.code(400);
    return { error: 'rarity is required' };
  }

  const result = await craftAttemptsFromDuplicates(params.telegramId, body.rarity as any);
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.post('/api/player/:telegramId/craft-attempts/shards', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const result = await craftAttemptsFromShards(params.telegramId);
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.post('/api/player/:telegramId/craft-attempts/all', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const result = await craftAllAttempts(params.telegramId);
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.get('/api/clans', async () => ({ clans: await listActiveClans() }));

server.get('/api/player/:telegramId/clan', async (request) => {
  const params = request.params as { telegramId: string };
  return { clan: await getMyClan(params.telegramId) };
});

server.post('/api/player/:telegramId/clan/create', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const body = request.body as { name?: string; tag?: string };

  if (!body.name || !body.tag) {
    reply.code(400);
    return { error: 'name and tag are required' };
  }

  const result = await createClan(params.telegramId, body.name.trim(), body.tag.trim().toUpperCase());
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.post('/api/player/:telegramId/clan/set-role', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const body = request.body as { targetTelegramId?: string; role?: string };

  if (!body.targetTelegramId || !body.role) {
    reply.code(400);
    return { error: 'targetTelegramId and role are required' };
  }

  const result = await setMemberRole(params.telegramId, body.targetTelegramId, body.role as any);
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.post('/api/player/:telegramId/clan/join', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const body = request.body as { clanId?: string };

  if (!body.clanId) {
    reply.code(400);
    return { error: 'clanId is required' };
  }

  const result = await joinClan(params.telegramId, body.clanId);
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.post('/api/player/:telegramId/clan/leave', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const result = await leaveClan(params.telegramId);
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.get('/api/player/:telegramId/clan/details', async (request) => {
  const params = request.params as { telegramId: string };
  return { clan: await getMyClanDetails(params.telegramId) };
});

server.post('/api/player/:telegramId/clan/description', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const body = request.body as { description?: string };

  if (!body.description) {
    reply.code(400);
    return { error: 'description is required' };
  }

  const result = await updateClanDescription(params.telegramId, body.description);
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.post('/api/player/:telegramId/clan/level-up', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const result = await levelUpClan(params.telegramId);
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.post('/api/player/:telegramId/clan/delete', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const result = await deleteClan(params.telegramId);
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.post('/api/player/:telegramId/clan/deposit', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const body = request.body as { amount?: number };

  if (!body.amount || body.amount <= 0) {
    reply.code(400);
    return { error: 'amount must be a positive number' };
  }

  const result = await depositToClanBank(params.telegramId, body.amount);
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.get('/api/clans/ranking', async () => ({ ranking: await getClanRanking() }));

server.get('/api/clans/:clanId/invite-info', async (request, reply) => {
  const params = request.params as { clanId: string };
  const info = await getClanByInviteId(params.clanId);
  if (!info) {
    reply.code(404);
    return { error: 'Clan not found' };
  }
  return info;
});

server.get('/api/player/:telegramId/bonuses', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const status = await getBonusesStatus(params.telegramId);
  if (!status) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return status;
});

server.post('/api/player/:telegramId/bonuses/:threshold/claim', async (request, reply) => {
  const params = request.params as { telegramId: string; threshold: string };
  const result = await claimBonusMilestone(params.telegramId, Number(params.threshold));
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.get('/api/player/:telegramId/gamepass', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const status = await getGamePassStatus(params.telegramId);
  if (!status) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return status;
});

server.post('/api/player/:telegramId/gamepass/activate', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const result = await activateGamePass(params.telegramId);
  if (!result) {
    reply.code(404);
    return { error: 'Player not found' };
  }
  return result;
});

server.get('/api/player/:telegramId/referrals', async (request) => {
  const params = request.params as { telegramId: string };
  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'ShadowManiaBot';
  const status = await getReferralStatus(params.telegramId, botUsername);
  return status ?? { error: 'Player not found' };
});

server.post('/api/player/:telegramId/referrals/register', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const body = request.body as { inviteeTelegramId?: string };

  if (!body.inviteeTelegramId) {
    reply.code(400);
    return { error: 'inviteeTelegramId is required' };
  }

  const result = await registerReferral(params.telegramId, body.inviteeTelegramId);
  if (!result) {
    reply.code(404);
    return { error: 'Inviter not found' };
  }
  return result;
});

server.post('/api/player/:telegramId/reward-shards', async (request, reply) => {
  const params = request.params as { telegramId: string };
  const body = request.body as { amount?: number };
  const amount = body.amount ?? 0;

  if (amount <= 0) {
    reply.code(400);
    return { error: 'amount must be positive' };
  }

  const prisma = getPrisma();
  if (!prisma) {
    reply.code(503);
    return { error: 'Database unavailable' };
  }

  const user = await prisma.user.upsert({
    where: { telegramId: params.telegramId },
    update: { shards: { increment: amount } },
    create: { telegramId: params.telegramId, displayName: `Player ${params.telegramId}`, shards: amount }
  });

  return { shards: user.shards };
});

server.get('/meta/game-rules', async () => ({
  coreSystems,
  designPillars,
  rewardLadder,
  pityRules,
  dailyLoginRewards,
  clanRewardTiers,
  seasonThemes,
  cardRarities,
  cardRanks,
  collectionSets,
  evolutionPreview,
  achievementPreview
}));

server.get('/meta/roadmap', async () => ({
  phases: [
    {
      name: 'Phase 1',
      focus: 'Collection and retention',
      items: ['Card packs', 'Pity timers', 'Dust crafting', 'Daily login streaks']
    },
    {
      name: 'Phase 2',
      focus: 'Clans and competition',
      items: ['Clan bosses', 'Clan wars', 'Clan quests', 'Weekly clan ratings']
    },
    {
      name: 'Phase 3',
      focus: 'Live ops',
      items: ['Season themes', 'Achievements', 'Market', 'Admin moderation']
    }
  ]
}));

const start = async () => {
  try {
    await server.listen({ host: '0.0.0.0', port: 3001 });
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

const shutdown = async () => {
  try {
    await server.close();
  } catch (error) {
    server.log.error(error);
  } finally {
    process.exit(0);
  }
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

startNotificationScheduler();
startTerritoryScheduler();

void start();