import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

let cachedClient: PrismaClient | null = null;

export const getPrisma = (): PrismaClient | null => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }

  if (!cachedClient) {
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    cachedClient = new PrismaClient({ adapter });
  }

  return cachedClient;
};