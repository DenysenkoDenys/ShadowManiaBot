import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const envPath = new URL('../../../.env', import.meta.url);

if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://127.0.0.1:3001';
const POLL_INTERVAL_MS = Number(process.env.BOT_POLL_INTERVAL_MS ?? 2000);

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set. Add it to .env and restart the bot.');
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const CLAIM_BUTTON_TEXT = 'Отримати карту 🎫';
const MY_CARDS_BUTTON_TEXT = 'Мої карти 🗃️';
const SETTINGS_BUTTON_TEXT = 'Налаштування ⚙️';
const MENU_BUTTON_TEXT = 'Меню 📋'; 

const mainKeyboard = {
  keyboard: [
    [{ text: CLAIM_BUTTON_TEXT }, { text: MY_CARDS_BUTTON_TEXT }],
    [{ text: MENU_BUTTON_TEXT }, { text: SETTINGS_BUTTON_TEXT }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

const RARITY_EMOJI = {
  common: '⚪',
  rare: '🔵',
  epic: '🟣',
  legendary: '🟠',
  mythic: '🔴'
};

const RARITY_LABELS = {
  common: 'Звичайна',
  rare: 'Рідкісна',
  epic: 'Епічна',
  legendary: 'Легендарна',
  mythic: 'Міфічна'
};



const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARD_ASSETS_DIR = path.resolve(__dirname, '../../photo');

const isRemoteUrl = (value) => value?.startsWith('http://') || value?.startsWith('https://');

const resolveLocalAssetPath = (imageRef) => {
  const relative = imageRef.replace(/^(\.\.\/)+photo\//, '');
  return path.resolve(CARD_ASSETS_DIR, relative);
};


const formatDuration = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}г. ${minutes}хв. ${seconds}с.`;
};

const formatDate = (isoString) => {
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatSettingsMessage = (settings) => {
  const premiumLine = settings.premiumUntil
    ? `🔑 Premium: активний до ${formatDate(settings.premiumUntil)}`
    : '🔑 Premium: не активний';

  return [
    `😊 ${settings.displayName}, твій профіль.`,
    '- - - - - - -',
    '',
    `📛 Нік: ${settings.displayName}`,
    `🆔 Айді: ${settings.telegramId}`,
    `🗓 Реєстрація: ${formatDate(settings.createdAt)}`,
    `🏅 Очки: ${settings.universePoints.toLocaleString('uk-UA')} pts`,
    `🎟 Спроби: ${settings.bonusClaims}`,
    premiumLine,
    `✏️ Змінити нік /change_nickname`
  ].join('\n');
};

const formatProgressBar = (percent, length = 15) => {
  const filled = Math.round((percent / 100) * length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
};

const formatMenuMessage = (player) =>
  [
    `👤 Нікнейм: ${player.displayName}`,
    `🎓 Всесвіт: ${player.currentUniverse ?? 'Naruto'}`,
    `🎴 Всього карт: ${player.totalCardsOwned} із ${player.totalCardsAvailable}`,
    `⭐ Очки сезону: ${player.universePoints.toLocaleString('uk-UA')} pts`,
    `🪙 Коіни: ${player.dustBalance.toLocaleString('uk-UA')}`,
    `🎟 Спроби: ${player.bonusClaims}`
  ].join('\n');

const buildMenuKeyboard = () => ({
  inline_keyboard: [
    [{ text: '🏟 Арена', callback_data: 'menu:arena' }, { text: '🏅 Рейтинг', callback_data: 'menu:rating' }],
    [{ text: '🏗 Завдання', callback_data: 'menu:quests' }, { text: '⚒ Крафт', callback_data: 'menu:craft' }],
    [{ text: '🏰 Клан', callback_data: 'menu:clan' }, { text: '🛍 Магазин', callback_data: 'menu:shop' }],
    [{ text: '🎁 Бонуси', callback_data: 'menu:bonuses' }, { text: '🔑 Game Pass', callback_data: 'menu:gamepass' }],
    [{ text: '🔗 Реферали', callback_data: 'menu:referrals' }],
    [{ text: '💠 Дружні канали', callback_data: 'menu:channels' }],
    [{ text: '🌐 Змінити всесвіт', callback_data: 'menu:universe' }],
    [{ text: '❓ Допомога', callback_data: 'menu:help' }]
  ]
});

const buildChroniclesMessage = (chronicles) => {
  const lines = [
    '📖 Хроніки',
    '',
    `Всього отримано карт: 🔄 ${chronicles.totalCardClaims.toLocaleString('uk-UA')}`,
    `Отримано унікальних карт: 🎴 ${chronicles.totalOwned}/${chronicles.totalCards}`,
    '',
    `📊 Прогрес колекції:`,
    `${formatProgressBar(chronicles.progressPercent)} ${chronicles.progressPercent}%`,
    '',
    'Виберіть всесвіт:'
  ];
  return lines.join('\n');
};

const buildChroniclesKeyboard = (chronicles) => ({
  inline_keyboard: chronicles.universes.map((u) => [{
    text: `${u.emoji} ${u.name} (${u.owned}/${u.total})`,
    callback_data: `col:universe:${u.name}`
  }])
});

const buildSettingsKeyboard = (settings) => {
  const arenaRow = [{
    text: `Сповіщення таймеру арени ${settings.notifyArenaTimer ? '🔔' : '🔕'}`,
    callback_data: 'settings:toggle:arena'
  }];

  const cardRow = [{
    text: `Сповіщення таймеру картки ${settings.notifyCardTimer ? '🔔' : '🔕'}`,
    callback_data: 'settings:toggle:card'
  }];

  const chroniclesRow = [{ text: '📜 Хроніки', callback_data: 'col:chronicles' }];

  return {
    inline_keyboard: [arenaRow, cardRow, chroniclesRow]
  };
};

const callTelegram = async (method, payload) => {
  const response = await fetch(`${TELEGRAM_API}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    console.error(`Telegram API error on ${method}:`, response.status, await response.text());
    return null;
  }

  return response.json().catch(() => null);
};

const callApi = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
    body: options.body ?? (options.method && options.method !== 'GET' ? '{}' : undefined)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`API error on ${path}: ${response.status} ${text}`);
  }

  return response.json();
};

const sendMessage = (chatId, text, extra = {}) =>
  callTelegram('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra });

const deleteMessage = (chatId, messageId) =>
  callTelegram('deleteMessage', { chat_id: chatId, message_id: messageId });

const answerCallbackQuery = (callbackQueryId, options = {}) =>
  callTelegram('answerCallbackQuery', { callback_query_id: callbackQueryId, ...options });


const sendPhoto = async (chatId, imageRef, caption, keyboard) => {
  if (!imageRef) {
    return null;
  }

  if (isRemoteUrl(imageRef)) {
    return callTelegram('sendPhoto', {
      chat_id: chatId,
      photo: imageRef,
      caption,
      parse_mode: 'HTML',
      ...(keyboard ? { reply_markup: keyboard } : {})
    });
  }

  try {
    const filePath = resolveLocalAssetPath(imageRef);
    const fileBuffer = await readFile(filePath);
    const form = new FormData();
    form.append('chat_id', String(chatId));
    form.append('caption', caption);
    form.append('parse_mode', 'HTML');
    if (keyboard) {
      form.append('reply_markup', JSON.stringify(keyboard));
    }
    form.append('photo', new Blob([fileBuffer]), path.basename(filePath));

    const response = await fetch(`${TELEGRAM_API}/sendPhoto`, { method: 'POST', body: form });
    if (!response.ok) {
      console.error('Telegram sendPhoto (local file) failed:', response.status, await response.text());
      return null;
    }
    return response.json().catch(() => null);
  } catch (error) {
    console.error(`Local card image not found/readable: ${imageRef}`, error);
    return null;
  }
};

/** Sends a card as photo+caption, falling back to a plain text message if the photo fails for any reason. */
const sendCardMessage = async (chatId, card, caption, keyboard) => {
  const photoResult = await sendPhoto(chatId, card.imageUrl, caption, keyboard);
  if (photoResult?.ok) {
    return;
  }
  await sendMessage(chatId, caption, keyboard ? { reply_markup: keyboard } : {});
};

// --- Message formatting: claim flow ---

const formatNewCardMessage = (card) =>
  [
    `⚡️ ${card.name}/${card.universe}`,
    `🌎 Ранг: ${card.rarityLabel}`,
    `🗡 Атака: ${card.attack}`,
    `❤️ Здоров'я: ${card.health}`,
    `💎 Цінність: ${card.value} pts`,
    `🌐 Всесвіт: ${card.universe}`,
    `🎲 Використано 1 спробу!`
  ].join('\n');

const formatDuplicateMessage = (displayName, result) =>
  [
    `🎫 ${displayName}, попалася повторка!`,
    '',
    `⛩ +${result.pointsGained} pts`,
    `💎 Очки всесвіту: ${result.universePoints} pts`,
    `✨ +${result.dustGained} пилу`,
    `🎲 Використано 1 спробу!`
  ].join('\n');

const formatCooldownMessage = (displayName, result) =>
  [
    `🚫 ${displayName}, отримувати картки можна раз на 2 години.`,
    '',
    `Залишилось: ⏳ ${formatDuration(result.remainingMs)}`,
    '',
    `Спроби: ${result.bonusClaims} 🎟 (1 спроба = 1 картка без таймера)`
  ].join('\n');

// --- Collection browsing (CardsMania-style) ---

const getRarityCounts = (collection) => {
  const totals = new Map(RARITY_ORDER.map((r) => [r, { owned: 0, total: 0 }]));
  for (const universe of collection.universes) {
    for (const card of universe.cards) {
      const entry = totals.get(card.rarity);
      if (!entry) continue;
      entry.total += 1;
      if (card.owned) entry.owned += 1;
    }
  }
  return totals;
};

const getOwnedCardsByUniverseAndRarity = (collection, universeName, rarity) => {
  const universe = collection.universes.find((u) => u.name === universeName);
  if (!universe) return [];
  return universe.cards
    .filter((card) => card.owned && card.rarity === rarity)
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'));
};

const getUniverseRarityCounts = (collection, universeName) => {
  const universe = collection.universes.find((u) => u.name === universeName);
  const totals = new Map(RARITY_ORDER.map((r) => [r, { owned: 0, total: 0 }]));
  if (!universe) return totals;

  for (const card of universe.cards) {
    const entry = totals.get(card.rarity);
    if (!entry) continue;
    entry.total += 1;
    if (card.owned) entry.owned += 1;
  }
  return totals;
};

const buildStatsMessage = (displayName, collection) => {
  const counts = getRarityCounts(collection);
  const lines = [`📖 Статистика колекції ${displayName}:`, ''];

  for (const rarity of RARITY_ORDER) {
    const { owned, total } = counts.get(rarity);
    lines.push(`${RARITY_EMOJI[rarity]} ${RARITY_LABELS[rarity]} — ${owned}/${total}`);
  }

  lines.push('', `🎴 Всі картки — ${collection.totalOwned}/${collection.totalCards}`);
  return { text: lines.join('\n'), counts };
};

const buildStatsKeyboard = (counts) => {
  const rows = [];
  for (let i = 0; i < RARITY_ORDER.length; i += 2) {
    const row = RARITY_ORDER.slice(i, i + 2).map((rarity) => {
      const { owned } = counts.get(rarity);
      return {
        text: `${RARITY_EMOJI[rarity]} ${RARITY_LABELS[rarity]} (${owned})`,
        callback_data: `col:rarity:${rarity}`
      };
    });
    rows.push(row);
  }
  return { inline_keyboard: rows };
};

const formatCollectionCardMessage = (card, index, total) =>
  [
    `${RARITY_EMOJI[card.rarity]} ${card.name}`,
    '',
    `🎭 Ранг: ${card.rarityLabel}`,
    `🗡 Атака: ${card.attack}`,
    `❤️ Здоров'я: ${card.health}`,
    `💎 Цінність: ${card.value} pts`,
    `🌐 Всесвіт: ${card.universe}`,
    card.copies > 1 ? `📦 Копій: ${card.copies}` : null
  ].filter(Boolean).join('\n');

const buildCardNavKeyboard = (rarity, index, total) => {
  const prevIndex = index > 0 ? index - 1 : total - 1;
  const nextIndex = index < total - 1 ? index + 1 : 0;

  return {
    inline_keyboard: [
      [
        { text: '◀️', callback_data: `col:nav:${rarity}:${prevIndex}` },
        { text: `${index + 1}/${total}`, callback_data: 'col:noop' },
        { text: '▶️', callback_data: `col:nav:${rarity}:${nextIndex}` }
      ],
      [{ text: '🔙 До колекції карток', callback_data: 'col:overview' }]
    ]
  };
};

const MENU_SECTION_TITLES = {
  arena: '🏟 Арена',
  rating: '🏅 Рейтинг',
  quests: '🏗 Завдання',
  craft: '⚒ Крафт',
  clan: '🏰 Клан',
  shop: '🛍 Магазин',
  bonuses: '🎁 Бонуси',
  gamepass: '🔑 Game Pass',
  referrals: '🔗 Реферали',
  channels: '💠 Дружні канали',
  help: '❓ Допомога'
};

const handleMenu = async (chatId, from) => {
  try {
    const { player } = await callApi(`/api/player/${from.id}/profile`);
    await sendMessage(chatId, formatMenuMessage(player), { reply_markup: buildMenuKeyboard() });
  } catch (error) {
    console.error('Failed to load menu:', error);
    await sendMessage(chatId, 'Не вдалося завантажити меню. Спробуйте ще раз трохи пізніше.');
  }
};

const handleMenuSection = async (chatId, messageId, from, section) => {
  if (messageId) await deleteMessage(chatId, messageId);

  const title = MENU_SECTION_TITLES[section] ?? section;
  await sendMessage(
    chatId,
    `${title}\n\nЦей розділ ще в розробці. Слідкуй за оновленнями в 📜 Хроніках!`,
    { reply_markup: { inline_keyboard: [[{ text: '🔙 До меню', callback_data: 'menu:back' }]] } }
  );
};

const handleMenuUniverse = async (chatId, messageId, from) => {
  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(
    chatId,
    '🌐 Зараз доступний лише всесвіт Naruto. Нові всесвіти зʼявляться найближчим часом!',
    { reply_markup: { inline_keyboard: [[{ text: '🔙 До меню', callback_data: 'menu:back' }]] } }
  );
};

const handleMenuBack = async (chatId, messageId, from) => {
  if (messageId) await deleteMessage(chatId, messageId);
  await handleMenu(chatId, from);
};

const handleCollectionOverview = async (chatId, messageId, from) => {
  const displayName = from.first_name ?? from.username ?? 'Гравцю';
  const collection = await callApi(`/api/player/${from.id}/collection`);
  const { text, counts } = buildStatsMessage(displayName, collection);

  if (messageId) {
    await deleteMessage(chatId, messageId);
  }
  await sendMessage(chatId, text, { reply_markup: buildStatsKeyboard(counts) });
};

const handleUniverseOverview = async (chatId, messageId, from, universeName) => {
  const collection = await callApi(`/api/player/${from.id}/collection`);
  const universe = collection.universes.find((u) => u.name === universeName);
  const counts = getUniverseRarityCounts(collection, universeName);

  const lines = [`${universe?.emoji ?? '🎴'} ${universeName} — ${universe?.owned ?? 0}/${universe?.total ?? 0}`, ''];
  for (const rarity of RARITY_ORDER) {
    const { owned, total } = counts.get(rarity);
    lines.push(`${RARITY_EMOJI[rarity]} ${RARITY_LABELS[rarity]} — ${owned}/${total}`);
  }

  const keyboard = {
    inline_keyboard: [
      ...RARITY_ORDER.reduce((rows, rarity, i) => {
        if (i % 2 === 0) rows.push([]);
        const { owned } = counts.get(rarity);
        rows[rows.length - 1].push({
          text: `${RARITY_EMOJI[rarity]} ${RARITY_LABELS[rarity]} (${owned})`,
          callback_data: `col:urarity:${universeName}:${rarity}`
        });
        return rows;
      }, []),
      [{ text: '🔙 До хронік', callback_data: 'col:chronicles' }]
    ]
  };

  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(chatId, lines.join('\n'), { reply_markup: keyboard });
};

const handleUniverseRarityCard = async (chatId, messageId, from, universeName, rarity, index) => {
  const collection = await callApi(`/api/player/${from.id}/collection`);
  const cards = getOwnedCardsByUniverseAndRarity(collection, universeName, rarity);

  if (messageId) await deleteMessage(chatId, messageId);

  if (cards.length === 0) {
    await sendMessage(chatId, `У всесвіті "${universeName}" ще немає карток рідкості "${RARITY_LABELS[rarity]}".`, {
      reply_markup: { inline_keyboard: [[{ text: '🔙 Назад', callback_data: `col:universe:${universeName}` }]] }
    });
    return;
  }

  const safeIndex = ((index % cards.length) + cards.length) % cards.length;
  const card = cards[safeIndex];
  const caption = formatCollectionCardMessage(card, safeIndex, cards.length);
  const keyboard = {
    inline_keyboard: [
      [
        { text: '◀️', callback_data: `col:unav:${universeName}:${rarity}:${safeIndex > 0 ? safeIndex - 1 : cards.length - 1}` },
        { text: `${safeIndex + 1}/${cards.length}`, callback_data: 'col:noop' },
        { text: '▶️', callback_data: `col:unav:${universeName}:${rarity}:${safeIndex < cards.length - 1 ? safeIndex + 1 : 0}` }
      ],
      [{ text: '🔙 Назад', callback_data: `col:universe:${universeName}` }]
    ]
  };

  await sendCardMessage(chatId, card, caption, keyboard);
};

const handleChronicles = async (chatId, messageId, from) => {
  const chronicles = await callApi(`/api/player/${from.id}/chronicles`);

  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(chatId, buildChroniclesMessage(chronicles), { reply_markup: buildChroniclesKeyboard(chronicles) });
};

const handleCollectionRarityCard = async (chatId, messageId, from, rarity, index) => {
  const collection = await callApi(`/api/player/${from.id}/collection`);
  const byRarity = getOwnedCardsByRarity(collection);
  const cards = byRarity.get(rarity) ?? [];

  if (messageId) {
    await deleteMessage(chatId, messageId);
  }

  if (cards.length === 0) {
    await sendMessage(chatId, `У тебе поки немає карток рідкості "${RARITY_LABELS[rarity] ?? rarity}".`, {
      reply_markup: { inline_keyboard: [[{ text: '🔙 До колекції карток', callback_data: 'col:overview' }]] }
    });
    return;
  }

  const safeIndex = ((index % cards.length) + cards.length) % cards.length;
  const card = cards[safeIndex];
  const caption = formatCollectionCardMessage(card, safeIndex, cards.length);
  const keyboard = buildCardNavKeyboard(rarity, safeIndex, cards.length);

  await sendCardMessage(chatId, card, caption, keyboard);
};

// --- Update handling ---

const ensurePlayerRegistered = async (from) => {
  await callApi('/api/player/upsert', {
    method: 'POST',
    body: JSON.stringify({
      telegramId: String(from.id),
      username: from.username ?? null,
      displayName: [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || `Player ${from.id}`
    })
  });
};

const handleClaimCard = async (chatId, from) => {
  const displayName = from.first_name ?? from.username ?? 'Гравцю';

  try {
    console.log(`[claim-card] requesting for telegramId=${from.id}`);
    const result = await callApi(`/api/player/${from.id}/claim-card`, { method: 'POST' });
    console.log('[claim-card] result:', result);

    if (result.status === 'cooldown') {
      await sendMessage(chatId, formatCooldownMessage(displayName, result));
      return;
    }

    if (result.status === 'duplicate') {
      await sendCardMessage(chatId, result.card, formatDuplicateMessage(displayName, result));
      return;
    }

    // status === 'new'
    await sendCardMessage(chatId, result.card, formatNewCardMessage(result.card));
  } catch (error) {
    console.error('Failed to claim card:', error);
    await sendMessage(chatId, 'Не вдалося отримати картку. Спробуйте ще раз трохи пізніше.');
  }
};

const handleMyCards = async (chatId, from) => {
  try {
    await handleCollectionOverview(chatId, null, from);
  } catch (error) {
    console.error('Failed to load collection:', error);
    await sendMessage(chatId, 'Не вдалося завантажити колекцію. Спробуйте ще раз трохи пізніше.');
  }
};

const handleCallbackQuery = async (callbackQuery) => {
  const data = callbackQuery.data ?? '';
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;
  const from = callbackQuery.from;

  if (!chatId || !from) {
    await answerCallbackQuery(callbackQuery.id);
    return;
  }

  try {
    if (data === 'col:noop') {
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'col:overview') {
      await handleCollectionOverview(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'settings:chronicles') {
      await sendMessage(chatId, CHRONICLES_TEXT);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const settingsToggleMatch = data.match(/^settings:toggle:(arena|card)$/);
    if (settingsToggleMatch) {
      await handleSettingsToggle(chatId, messageId, from, settingsToggleMatch[1]);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const rarityMatch = data.match(/^col:rarity:([a-z]+)$/);
    if (rarityMatch) {
      await handleCollectionRarityCard(chatId, messageId, from, rarityMatch[1], 0);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const navMatch = data.match(/^col:nav:([a-z]+):(\d+)$/);
    if (navMatch) {
      await handleCollectionRarityCard(chatId, messageId, from, navMatch[1], Number(navMatch[2]));
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'col:chronicles') {
      await handleChronicles(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'menu:back') {
      await handleMenuBack(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'menu:universe') {
      await handleMenuUniverse(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const menuSectionMatch = data.match(/^menu:(arena|rating|quests|craft|clan|shop|bonuses|gamepass|referrals|channels|help)$/);
    if (menuSectionMatch) {
      await handleMenuSection(chatId, messageId, from, menuSectionMatch[1]);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const universeMatch = data.match(/^col:universe:(.+)$/);
    if (universeMatch) {
      await handleUniverseOverview(chatId, messageId, from, universeMatch[1]);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const universeRarityMatch = data.match(/^col:urarity:(.+):([a-z]+)$/);
    if (universeRarityMatch) {
      await handleUniverseRarityCard(chatId, messageId, from, universeRarityMatch[1], universeRarityMatch[2], 0);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const universeNavMatch = data.match(/^col:unav:(.+):([a-z]+):(\d+)$/);
    if (universeNavMatch) {
      await handleUniverseRarityCard(chatId, messageId, from, universeNavMatch[1], universeNavMatch[2], Number(universeNavMatch[3]));
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    await answerCallbackQuery(callbackQuery.id);
  } catch (error) {
    console.error('Failed to handle callback query:', error);
    await answerCallbackQuery(callbackQuery.id, { text: 'Сталася помилка, спробуйте ще раз.' });
  }
};

const handleUpdate = async (update) => {
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
    return;
  }

  const message = update.message;
  if (!message || !message.text || !message.from) {
    console.log('[update] skipped (no text/from):', JSON.stringify(update));
    return;
  }

  const chatId = message.chat.id;
  const text = message.text.trim();

  console.log(`[message] chatId=${chatId} text=${JSON.stringify(text)} codePoints=${[...text].map((c) => c.codePointAt(0).toString(16)).join(',')}`);

  if (text === '/start') {
    await ensurePlayerRegistered(message.from);
    await sendMessage(
      chatId,
      'Вітаю в ShadowMania! Натисни кнопку нижче, щоб отримати свою першу карту.',
      { reply_markup: mainKeyboard }
    );
    return;
  }

  if (text === CLAIM_BUTTON_TEXT || text === '/card') {
    await ensurePlayerRegistered(message.from);
    await handleClaimCard(chatId, message.from);
    return;
  }

  if (text === MY_CARDS_BUTTON_TEXT || text === '/cards') {
    await ensurePlayerRegistered(message.from);
    await handleMyCards(chatId, message.from);
    return;
  }

  if (text === SETTINGS_BUTTON_TEXT || text === '/settings') {
    await ensurePlayerRegistered(message.from);
    await handleSettings(chatId, message.from);
    return;
  }

  if (text === MENU_BUTTON_TEXT || text === '/menu') {
    await ensurePlayerRegistered(message.from);
    await handleMenu(chatId, message.from);
    return;
  }

  if (text.startsWith('/change_nickname')) {
    await ensurePlayerRegistered(message.from);
    await handleChangeNickname(chatId, message.from, text);
    return;
  }

  console.log(`[message] no handler matched for text=${JSON.stringify(text)}`);
};

const handleSettings = async (chatId, from) => {
  try {
    const settings = await callApi(`/api/player/${from.id}/settings`);
    await sendMessage(chatId, formatSettingsMessage(settings), { reply_markup: buildSettingsKeyboard(settings) });
  } catch (error) {
    console.error('Failed to load settings:', error);
    await sendMessage(chatId, 'Не вдалося завантажити налаштування. Спробуйте ще раз трохи пізніше.');
  }
};

const handleSettingsToggle = async (chatId, messageId, from, kind) => {
  const settings = await callApi(`/api/player/${from.id}/settings/toggle-notification`, {
    method: 'POST',
    body: JSON.stringify({ kind })
  });
  await deleteMessage(chatId, messageId);
  await sendMessage(chatId, formatSettingsMessage(settings), { reply_markup: buildSettingsKeyboard(settings) });
};

const handleChangeNickname = async (chatId, from, rawText) => {
  const nickname = rawText.replace('/change_nickname', '').trim();

  if (!nickname) {
    await sendMessage(chatId, 'Введи новий нік так: /change_nickname НовийНік');
    return;
  }

  try {
    const settings = await callApi(`/api/player/${from.id}/nickname`, {
      method: 'POST',
      body: JSON.stringify({ nickname })
    });
    await sendMessage(chatId, `✅ Нік змінено на "${settings.displayName}"`);
  } catch (error) {
    console.error('Failed to change nickname:', error);
    await sendMessage(chatId, 'Не вдалося змінити нік. Спробуйте ще раз трохи пізніше.');
  }
};

let offset = 0;
let running = true;

const pollOnce = async () => {
  const response = await fetch(
    `${TELEGRAM_API}/getUpdates?timeout=25&offset=${offset}`
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`getUpdates failed: ${response.status} ${text}`);
  }

  const data = await response.json();

  if (data.ok === false) {
    throw new Error(`getUpdates rejected: ${JSON.stringify(data)}`);
  }

  const updates = data.result ?? [];

  if (updates.length > 0) {
    console.log(`[poll] received ${updates.length} update(s)`);
  }

  for (const update of updates) {
    offset = update.update_id + 1;
    try {
      await handleUpdate(update);
    } catch (error) {
      console.error('Failed to handle update:', error);
    }
  }
};

const loop = async () => {
  while (running) {
    try {
      await pollOnce();
    } catch (error) {
      console.error('Polling error:', error);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
};

const shutdown = () => {
  running = false;
  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

const registerBotCommands = async () => {
  await callTelegram('setMyCommands', {
    commands: [
      { command: 'start', description: '🚀 Перезапуск бота' },
      { command: 'settings', description: '⚙️ Налаштування' },
      { command: 'menu', description: '📋 Меню' }
    ]
  });
};


const start = async () => {
  await registerBotCommands();
  console.log('ShadowMania bot started, polling for updates...');
  void loop();
};

void start();