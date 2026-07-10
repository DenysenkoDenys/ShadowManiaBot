import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import type { PrismaConfig } from 'prisma';

loadDotenv({ path: path.resolve(process.cwd(), '../../.env') });

export default {
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations'
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/shadowmania'
  }
} satisfies PrismaConfig;