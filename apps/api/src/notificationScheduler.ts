import { getPrisma } from './prismaClient.js';
import { CARD_CLAIM_COOLDOWN_MS, ARENA_COOLDOWN_MS } from './gameRules.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;
const CHECK_INTERVAL_MS = 30 * 1000;

const sendTelegramMessage = async (chatId: string, text: string) => {
  if (!TELEGRAM_API) return;

  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });

    if (!response.ok) {
      console.error('[notifications] sendMessage failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('[notifications] Failed to send Telegram message:', error);
  }
};

const checkCardTimers = async () => {
  const prisma = getPrisma();
  if (!prisma) return;

  const threshold = new Date(Date.now() - CARD_CLAIM_COOLDOWN_MS);

  const users = await prisma.user.findMany({
    where: {
      notifyCardTimer: true,
      cardTimerNotified: false,
      lastCardClaimAt: { not: null, lte: threshold }
    }
  });

  for (const user of users) {
    await sendTelegramMessage(
      user.telegramId,
      `🎫 ${user.displayName}, Вітаю ти можеш "Отримати карту 🎫", тисни щоб забрати нагороду.`
    );
    await prisma.user.update({ where: { id: user.id }, data: { cardTimerNotified: true } });
  }
};

const checkArenaTimers = async () => {
  const prisma = getPrisma();
  if (!prisma) return;

  const threshold = new Date(Date.now() - ARENA_COOLDOWN_MS);

  const users = await prisma.user.findMany({
    where: {
      notifyArenaTimer: true,
      arenaTimerNotified: false,
      lastArenaBattleAt: { not: null, lte: threshold }
    }
  });

  for (const user of users) {
    await sendTelegramMessage(
      user.telegramId,
      `🏟 ${user.displayName}, таймер арени закінчився! Час знайти нового суперника.`
    );
    await prisma.user.update({ where: { id: user.id }, data: { arenaTimerNotified: true } });
  }
};

export const startNotificationScheduler = () => {
  if (!TELEGRAM_API) {
    console.warn('[notifications] TELEGRAM_BOT_TOKEN is not set — notifications disabled.');
    return;
  }

  setInterval(() => {
    checkCardTimers().catch((error) => console.error('[notifications] checkCardTimers failed:', error));
    checkArenaTimers().catch((error) => console.error('[notifications] checkArenaTimers failed:', error));
  }, CHECK_INTERVAL_MS);

  console.log(`[notifications] Scheduler started, checking every ${CHECK_INTERVAL_MS / 1000}s.`);
};