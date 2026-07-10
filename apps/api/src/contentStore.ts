import { seedCards, seedClans, seedPacks, seedSeasons } from './seedData.js';

type SeasonDraft = (typeof seedSeasons)[number];

type CardDraft = (typeof seedCards)[number];

type ClanDraft = (typeof seedClans)[number];

const dashboardState = {
  seasons: [
    ...seedSeasons
  ] as SeasonDraft[],
  cards: [...seedCards] as CardDraft[],
  clans: [...seedClans] as ClanDraft[],
  packs: [...seedPacks]
};

export const listSeasons = () => dashboardState.seasons;

export const addSeason = (season: SeasonDraft) => {
  dashboardState.seasons = [...dashboardState.seasons, season];
  return season;
};

export const listCards = () => dashboardState.cards;

export const addCard = (card: CardDraft) => {
  dashboardState.cards = [...dashboardState.cards, card];
  return card;
};

export const listClans = () => dashboardState.clans;

export const addClan = (clan: ClanDraft) => {
  dashboardState.clans = [...dashboardState.clans, clan];
  return clan;
};

export const listPacks = () => dashboardState.packs;

export const getDashboardSnapshot = () => ({
  counts: {
    seasons: dashboardState.seasons.length,
    cards: dashboardState.cards.length,
    clans: dashboardState.clans.length,
    packs: dashboardState.packs.length,
    rewardSteps: 12,
    pityRules: 2
  },
  highlights: {
    upcomingSeason: dashboardState.seasons.find((season) => season.status === 'planned') ?? null,
    strongestClan: dashboardState.clans[0] ?? null,
    latestCard: dashboardState.cards.at(-1) ?? null
  },
  seasons: dashboardState.seasons,
  cards: dashboardState.cards,
  clans: dashboardState.clans,
  packs: dashboardState.packs
});