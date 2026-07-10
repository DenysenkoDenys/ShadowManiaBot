# ShadowMania

Monorepo starter for a Telegram card game that is built to keep experienced players engaged.

## Stack

- API: Fastify + TypeScript
- Admin: React + Vite + TypeScript
- Bot: dependency-free Telegram polling worker on native Node fetch
- Data layer: PostgreSQL-ready rules model with room for Prisma later
- Platform jobs: Telegram bot, seasonal content, clan systems, login streaks, pity timers, dust economy

## Product pillars

1. Collection: cards, evolutions, rarities, sets.
2. Clans: wars, bosses, quests, tournaments, shared inventory, weekly ratings.
3. Economy: reward ladder, dust, crafting, duplicate sinks.
4. Seasons: rotating themes, event drops, exclusive seasonal cards.

## Current scaffold

- `apps/api` exposes game-rule endpoints that mirror the design conversation.
- `apps/admin` is a separate React site for content, economy, moderation, and live operations.

## Next steps

- Add persistence with Prisma and PostgreSQL.
- Wire Telegram authentication and bot commands.
- Add admin CRUD for cards, seasons, rewards, and bans.
- Implement clan wars, boss events, daily streaks, pity counters, and dust crafting.

## Environment

Copy `.env.example` to `.env` and set the Telegram bot token plus the PostgreSQL connection string.
"# ShadowManiaBot" 
