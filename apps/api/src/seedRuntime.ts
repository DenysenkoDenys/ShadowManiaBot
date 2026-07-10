import { seedCards, seedCardSets, seedClans, seedSeasons } from './seedData.js';

const seedReady = new WeakSet<object>();

export const ensureSeedWorld = async (prisma: any) => {
  if (seedReady.has(prisma)) {
    return;
  }

  for (const season of seedSeasons) {
    await prisma.season.upsert({
      where: { name: season.name },
      update: {
        theme: season.theme,
        status: season.status.toUpperCase()
      },
      create: {
        name: season.name,
        theme: season.theme,
        status: season.status.toUpperCase()
      }
    });
  }

  for (const cardSet of seedCardSets) {
    const season = await prisma.season.findUnique({ where: { name: cardSet.season } });

    await prisma.cardSet.upsert({
      where: { name: cardSet.name },
      update: {
        emoji: cardSet.emoji,
        theme: cardSet.theme,
        rewardText: cardSet.rewardText,
        seasonId: season?.id
      },
      create: {
        name: cardSet.name,
        emoji: cardSet.emoji,
        theme: cardSet.theme,
        rewardText: cardSet.rewardText,
        seasonId: season?.id
      }
    });
  }

  for (const card of seedCards) {
    const season = await prisma.season.findUnique({ where: { name: card.season } });
    if (!season) {
      continue;
    }

    const cardSet = await prisma.cardSet.findUnique({ where: { name: card.universe } });

    await prisma.card.upsert({
      where: { name: card.name },
      update: {
        rarity: card.rarity.toUpperCase(),
        seasonId: season.id,
        cardSetId: cardSet?.id,
        basePower: card.attack,
        health: card.health,
        imageUrl: card.imageUrl
      },
      create: {
        name: card.name,
        rarity: card.rarity.toUpperCase(),
        seasonId: season.id,
        cardSetId: cardSet?.id,
        basePower: card.attack,
        health: card.health,
        imageUrl: card.imageUrl
      }
    });
  }

  for (const clan of seedClans) {
    await prisma.clan.upsert({
      where: { name: clan.name },
      update: {
        tag: clan.tag,
        description: clan.focus
      },
      create: {
        name: clan.name,
        tag: clan.tag,
        description: clan.focus,
        weeklyScore: clan.name === 'Shadow Legion' ? 2500 : 0,
        totalCards: clan.name === 'Shadow Legion' ? 120 : 0,
        bankDust: clan.name === 'Shadow Legion' ? 5000 : 0
      }
    });
  }

  seedReady.add(prisma);
};

export const seedStarterInventoryForUser = async (prisma: any, userId: string) => {
  const existingCount = await prisma.cardInstance.count({ where: { ownerId: userId } });
  if (existingCount > 0) {
    return;
  }

  const starterCards = seedCards.slice(0, 3);

  for (let index = 0; index < starterCards.length; index += 1) {
    const starterCard = starterCards[index];
    const card = await prisma.card.findUnique({ where: { name: starterCard.name } });

    if (!card) {
      continue;
    }

    await prisma.cardInstance.upsert({
      where: { ownerId_cardId: { ownerId: userId, cardId: card.id } },
      update: {},
      create: {
        ownerId: userId,
        cardId: card.id,
        rank: index === 0 ? 'NORMAL' : index === 1 ? 'SHINY' : 'GOLDEN'
      }
    });
  }
};
