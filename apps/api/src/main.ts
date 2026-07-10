import './loadEnv.js';
import Fastify from 'fastify';
import { addCard, addClan, addSeason, getDashboardSnapshot, listCards, listClans, listPacks, listSeasons } from './contentStore.js';
import { claimDailyReward, getPlayerProfile, upsertPlayerProfile } from './playerStore.js';
import { claimCard, getClaimCooldown, getPlayerCollection, getPlayerChronicles } from './cardService.js';
import { getPlayerSettings, toggleNotification, changeNickname } from './settingsService.js';
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

  if (body.kind !== 'arena' && body.kind !== 'card') {
    reply.code(400);
    return { error: 'kind must be "arena" or "card"' };
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

void start();