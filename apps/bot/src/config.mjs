export const botToken = process.env.TELEGRAM_BOT_TOKEN ?? '';
export const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'ShadowManiaBot';
export const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:3001';
export const pollIntervalMs = Number.parseInt(process.env.BOT_POLL_INTERVAL_MS ?? '2000', 10);