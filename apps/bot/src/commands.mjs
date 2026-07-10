const DIVIDER = '───────────────';

// 6423650 -> "6.423.650"
const formatThousands = (value) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const buildProfileCard = (player, dashboard) => {
  const totalOwned = player?.inventory?.length ?? 0;
  const totalAvailable = dashboard?.counts?.cards ?? totalOwned;

  return [
    `👨 Нікнейм: <b>${player?.displayName ?? '—'}</b>`,
    `🗺️ Всесвіт: ${player?.universe ?? '—'}`,
    `🎴 Всього карт: <b>${totalOwned}</b> із <b>${totalAvailable}</b>`,
    `🎖️ Очки сезону: <b>${formatThousands(player?.seasonPoints ?? 0)}</b> pts`,
    `🪙 Коіни: <b>${formatThousands(player?.coinsBalance ?? 0)}</b>`,
    `🍬 Спроби: <b>${player?.packAttempts ?? 0}</b>`
  ].join('\n');
};

const formatList = (title, items) => {
  const lines = items.map((item) => `▫️ ${item}`).join('\n');
  return `<b>${title}</b>\n${lines}`;
};

const fetchPlayer = async (apiBaseUrl, message) => {
  const response = await fetch(`${apiBaseUrl}/api/player/upsert`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      telegramId: String(message.from.id),
      username: message.from.username ?? null,
      displayName: [message.from.first_name, message.from.last_name].filter(Boolean).join(' ') || message.from.username || 'Player'
    })
  });

  return response.ok ? await response.json() : null;
};

const fetchDashboard = async (apiBaseUrl) => {
  const response = await fetch(`${apiBaseUrl}/api/admin/dashboard`);
  return response.ok ? await response.json() : null;
};

export const menuActions = {
  home: 'menu:home',
  profile: 'menu:profile',
  inventory: 'menu:inventory',
  packs: 'menu:packs',
  daily: 'menu:daily',
  clan: 'menu:clan',
  help: 'menu:help'
};

export const buildMainMenuKeyboard = () => [
  [
    { text: '👤 Профіль', callback_data: menuActions.profile },
    { text: '🎒 Інвентар', callback_data: menuActions.inventory }
  ],
  [
    { text: '📦 Паки', callback_data: menuActions.packs },
    { text: '🎁 Daily', callback_data: menuActions.daily }
  ],
  [
    { text: '⚔️ Клан', callback_data: menuActions.clan },
    { text: 'ℹ️ Довідка', callback_data: menuActions.help }
  ]
];

export const buildBackKeyboard = () => [[{ text: '🏠 Головна', callback_data: menuActions.home }]];

// Постійне меню знизу екрана (Reply Keyboard) — завжди видиме, на відміну від inline-кнопок.
export const persistentMenuLabels = {
  getCard: 'Отримати карту 🎴',
  myCards: 'Мої карти 🗃️',
  menu: 'Меню 📋',
  settings: 'Налаштування ⚙️'
};

export const buildPersistentMenuKeyboard = () => [
  [{ text: persistentMenuLabels.getCard }, { text: persistentMenuLabels.myCards }],
  [{ text: persistentMenuLabels.menu }, { text: persistentMenuLabels.settings }]
];

const withKeyboard = (text, keyboard) => ({
  text,
  keyboard
});

const withMainMenu = (text) => withKeyboard(text, buildMainMenuKeyboard());

const withBackToHome = (text) => withKeyboard(text, buildBackKeyboard());

export const renderStartMessage = async (apiBaseUrl, message) => {
  const player = await fetchPlayer(apiBaseUrl, message);
  const dashboard = await fetchDashboard(apiBaseUrl);
  const name = player?.player?.displayName ?? message.from.first_name ?? 'мандрівнику';

  return withMainMenu([
    `<b>👋 Привіт, ${name}!</b>`,
    'Ласкаво просимо до <b>ShadowMania</b> — колекційної карткової гри в Telegram.',
    DIVIDER,
    player?.player ? buildProfileCard(player.player, dashboard) : 'Профіль зараз недоступний.',
    '',
    'Обери розділ у меню нижче 👇'
  ].filter(Boolean).join('\n'));
};

export const renderHomeMessage = async (apiBaseUrl, message) => {
  const player = await fetchPlayer(apiBaseUrl, message);
  const dashboard = await fetchDashboard(apiBaseUrl);

  return withMainMenu([
    player?.player ? buildProfileCard(player.player, dashboard) : 'Профіль зараз недоступний.',
    DIVIDER,
    'Використовуй кнопки нижче для навігації.'
  ].filter(Boolean).join('\n'));
};

export const renderHelpMessage = () => withMainMenu([
  '<b>ℹ️ Довідка</b>',
  'Керуй грою через кнопки — вони замінюють текстові команди.',
  DIVIDER,
  formatList('Розділи', [
    'Профіль — твоя статистика',
    'Інвентар — твої картки',
    'Паки — доступні набори',
    'Daily — щоденна нагорода',
    'Клан — інформація про клани'
  ])
].join('\n'));

export const renderInventoryMessage = async (apiBaseUrl, message) => {
  const upsertResponse = await fetch(`${apiBaseUrl}/api/player/upsert`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      telegramId: String(message.from.id),
      username: message.from.username ?? null,
      displayName: [message.from.first_name, message.from.last_name].filter(Boolean).join(' ') || message.from.username || 'Player'
    })
  });

  if (!upsertResponse.ok) {
    return withBackToHome('<b>🎒 Інвентар</b>\nНе вдалося завантажити профіль.');
  }

  const profileResponse = await fetch(`${apiBaseUrl}/api/player/${message.from.id}`);

  if (!profileResponse.ok) {
    return withBackToHome('<b>🎒 Інвентар</b>\nНе вдалося завантажити профіль.');
  }

  const payload = await profileResponse.json();
  const cards = payload.player.inventory ?? [];

  if (cards.length === 0) {
    return withBackToHome([
      '<b>🎒 Інвентар</b>',
      `Гравець: ${payload.player.displayName}`,
      `💠 Пил: ${payload.player.dustBalance}`,
      DIVIDER,
      'У тебе поки немає карток.'
    ].join('\n'));
  }

  return withBackToHome([
    '<b>🎒 Інвентар</b>',
    `Гравець: ${payload.player.displayName}`,
    `💠 Пил: ${payload.player.dustBalance}   🛡 Клан: ${payload.player.clanName ?? 'без клану'}`,
    DIVIDER,
    formatList(
      'Картки',
      cards.map((card) => `${card.cardName} · ${card.rarity} · ${card.rank}`)
    )
  ].join('\n'));
};

export const renderDailyMessage = async (apiBaseUrl, message) => {
  const response = await fetch(`${apiBaseUrl}/api/player/${message.from.id}/daily`, { method: 'POST' });

  if (!response.ok) {
    return withBackToHome('<b>🎁 Daily</b>\nНе вдалося отримати щоденну нагороду.');
  }

  const payload = await response.json();
  return withBackToHome([
    '<b>🎁 Нагороду отримано!</b>',
    DIVIDER,
    `🔥 Стрік: <b>${payload.reward.streakCount}</b>`,
    `💠 Отримано пилу: <b>+${payload.reward.dustReward}</b>`,
    `💰 Новий баланс: <b>${payload.profile.dustBalance}</b>`
  ].join('\n'));
};

export const renderClanMessage = async (apiBaseUrl) => {
  const response = await fetch(`${apiBaseUrl}/api/admin/clans`);

  if (!response.ok) {
    return withBackToHome('<b>⚔️ Клан</b>\nСистема кланів тимчасово недоступна.');
  }

  const payload = await response.json();
  const clanNames = (payload.clans ?? []).map((clan) => `${clan.name} [${clan.tag}]`);

  return withBackToHome([
    '<b>⚔️ Клан</b>',
    'Клан-війни, боси, квести та тижневий рейтинг — основа гри.',
    DIVIDER,
    formatList('Відомі клани', clanNames.length > 0 ? clanNames : ['Кланів ще немає'])
  ].join('\n'));
};

export const renderProfileMessage = async (apiBaseUrl, message) => {
  const upsertResponse = await fetch(`${apiBaseUrl}/api/player/upsert`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      telegramId: String(message.from.id),
      username: message.from.username ?? null,
      displayName: [message.from.first_name, message.from.last_name].filter(Boolean).join(' ') || message.from.username || 'Player'
    })
  });

  if (!upsertResponse.ok) {
    return withBackToHome('<b>👤 Профіль</b>\nНе вдалося завантажити профіль.');
  }

  const response = await fetch(`${apiBaseUrl}/api/player/${message.from.id}/profile`);

  if (!response.ok) {
    return withBackToHome('<b>👤 Профіль</b>\nНе вдалося завантажити профіль.');
  }

  const payload = await response.json();
  const player = payload.player;

  return withBackToHome([
    '<b>👤 Профіль</b>',
    DIVIDER,
    buildProfileCard(player, null),
    `🔥 Стрік: <b>${player.streakCount}</b>`,
    `🛡 Клан: ${player.clanName ?? 'без клану'}`,
    `🕒 Останній вхід: ${player.lastLoginAt ?? 'ніколи'}`
  ].join('\n'));
};

export const renderSettingsMessage = () => withBackToHome([
  '<b>⚙️ Налаштування</b>',
  DIVIDER,
  'Розділ у розробці. Тут з’являться сповіщення, мова інтерфейсу та приватність профілю.'
].join('\n'));

// "Отримати карту" зараз веде до списку паків (реального відкриття паку в API ще немає).
export const renderGetCardMessage = async (apiBaseUrl) => {
  const response = await fetch(`${apiBaseUrl}/api/admin/packs`);

  if (!response.ok) {
    return withBackToHome('<b>🎴 Отримати карту</b>\nПаки тимчасово недоступні.');
  }

  const payload = await response.json();
  const packs = payload.packs ?? [];

  return withBackToHome([
    '<b>🎴 Отримати карту</b>',
    'Обери пак, щоб отримати нову картку:',
    DIVIDER,
    formatList(
      'Доступні паки',
      packs.map((pack) => `${pack.name} · ${pack.rarityGuarantee} · ${pack.description}`)
    )
  ].join('\n'));
};

export const renderPacksMessage = async (apiBaseUrl) => {
  const response = await fetch(`${apiBaseUrl}/api/admin/packs`);

  if (!response.ok) {
    return withBackToHome('<b>📦 Паки</b>\nДані про паки тимчасово недоступні.');
  }

  const payload = await response.json();
  const packs = payload.packs ?? [];

  return withBackToHome([
    '<b>📦 Паки</b>',
    'Доступні типи паків:',
    DIVIDER,
    formatList(
      'Список паків',
      packs.map((pack) => `${pack.name} · ${pack.rarityGuarantee} · ${pack.description}`)
    )
  ].join('\n'));
};
