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

const formatArenaHomeMessage = (displayName, team) => {
  const filled = team.slots.filter(Boolean);
  const lines = [
    `🏟 ${displayName}, ти можеш зібрати команду з карт та боротися з іншими гравцями`,
    '',
    '✊ Твоя команда'
  ];

  if (filled.length === 0) {
    lines.push('Команда порожня — натисни "🔴 Команда", щоб обрати карток');
  } else {
    filled.forEach((card, i) => {
      const prefix = i === filled.length - 1 ? '└─➤' : '├─➤';
      const rarityEmoji = RARITY_EMOJI[card.rarity] ?? '⚪';
      lines.push(`${prefix} ${rarityEmoji} ${card.name}`);
    });
  }

  lines.push(
    '',
    `🗡 Атака: ${team.totalAttack}${team.clanBonusAttack ? ` + ✖️ ${team.clanBonusAttack} (клановий бонус)` : ''}`,
    `❤️ Здоров'я: ${team.totalHealth}${team.clanBonusHealth ? ` + 💙 ${team.clanBonusHealth} (клановий бонус)` : ''}`
  );

  return lines.join('\n');
};

const CLAN_ROLE_LABELS = {
  LEADER: '👑 Глава',
  DEPUTY: '🎖 Заступник',
  COMMANDER: '⚔️ Полководець',
  SERGEANT: '🛡 Сержант',
  MEMBER: '👤 Учасник'
};

const formatMyClanMessage = (clan) => {
  const roleLabel = CLAN_ROLE_LABELS[clan.myRole] ?? clan.myRole;
  const starterBadge = clan.isStarter ? ' 🏁' : '';

  return [
    `🛡 Рівень клану: ${clan.level}`,
    `📝 Опис: ${clan.description ?? '—'}`,
    `👑 Глава клану: ${clan.members.find((m) => m.role === 'LEADER')?.displayName ?? '—'}`,
    `🌍 Казна: ${clan.bankDust.toLocaleString('uk-UA')} коінів`,
    `👥 В клані: ${clan.members.length}/${clan.maxMembers}`,
    `⚔️ Рейди: ${clan.raidsCount}`,
    `🏆 Очки клану: ${clan.weeklyScore.toLocaleString('uk-UA')}`,
    `⬆️ Для підвищення рівня: ${clan.levelUpCost.toLocaleString('uk-UA')} коінів`,
    '',
    `🏰 [${clan.tag}] ${clan.name}${starterBadge}`,
    `Твоя роль: ${roleLabel}`
  ].join('\n');
};

const buildMyClanKeyboard = (clan) => {
  const rows = [];

  rows.push([{ text: '✉️ Запросити до клану', callback_data: 'clan:invite' }]);

  if (clan.myRole === 'LEADER') {
    rows.push([{ text: '📝 Редагувати опис', callback_data: 'clan:desc:prompt' }]);
    rows.push([{ text: '⬆️ Підняти рівень клану', callback_data: 'clan:levelup' }]);
    rows.push([{ text: '⚙️ Управління ролями', callback_data: 'clan:roles' }]);
    rows.push([{ text: '🗑 Видалити клан', callback_data: 'clan:delete:confirm' }]);
  }

  rows.push([{ text: '👥 Список членів', callback_data: 'clan:members' }]);
  rows.push([{ text: '🏆 Рейтинг кланів', callback_data: 'clan:ranking' }]);
  rows.push([{ text: '🌍 Поповнити казну', callback_data: 'clan:deposit:prompt' }]);
  rows.push([{ text: '📊 Внески клану', callback_data: 'clan:contributions' }]);
  rows.push([{ text: '🚪 Покинути клан', callback_data: 'clan:leave:confirm' }]);
  rows.push([{ text: '🔙 До меню', callback_data: 'menu:back' }]);

  return { inline_keyboard: rows };
};

const formatClanListMessage = (clans) => {
  if (clans.length === 0) {
    return '🏰 Кланів ще немає. Стань першим — створи свій!';
  }

  const lines = ['🏰 Доступні клани', ''];
  clans.forEach((clan, i) => {
    const starterBadge = clan.isStarter ? ' 🏁 стартовий' : '';
    const ownerHint = clan.isStarter && clan.memberCount === 0 ? ' (без власника — вступи першим і стань главою!)' : '';
    lines.push(`${i + 1}. [${clan.tag}] ${clan.name} — ${clan.memberCount}/${clan.maxMembers} 👥${starterBadge}${ownerHint}`);
  });

  return lines.join('\n');
};

const formatBonusesMessage = (displayName, status) => {
  const lines = [`🎁 ${displayName}, отримуй картки та забирай нагороди!`, ''];

  for (const m of status.milestones) {
    const rewardText = m.rewardShards > 0
      ? `${m.rewardBonusClaims} 🎫, + ${m.rewardShards} 🛡`
      : `${m.rewardBonusClaims} 🎫`;

    if (m.claimed) {
      lines.push(`✅ Отримано`, `🎁 Нагорода: ${rewardText}`);
    } else if (m.unlocked) {
      lines.push(`🎁 Доступно!`, `🎁 Нагорода: ${rewardText}`);
    } else {
      lines.push(`❌ ${status.totalCardClaims}/${m.threshold}`, `🎁 Нагорода: ${rewardText}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
};

const buildBonusesKeyboard = (status) => {
  const rows = status.milestones
    .filter((m) => m.unlocked && !m.claimed)
    .map((m) => [{ text: `🎁 Забрати (${m.threshold})`, callback_data: `bonus:claim:${m.threshold}` }]);

  rows.push([{ text: '🔙 До меню', callback_data: 'menu:back' }]);
  return { inline_keyboard: rows };
};

const handleBonuses = async (chatId, from, messageId = null) => {
  const displayName = from.first_name ?? from.username ?? 'Гравцю';
  const status = await callApi(`/api/player/${from.id}/bonuses`);
  const text = formatBonusesMessage(displayName, status);
  const keyboard = buildBonusesKeyboard(status);

  if (messageId) {
    const edited = await editMessageText(chatId, messageId, text, { reply_markup: keyboard });
    if (edited?.ok) return;
  }

  await sendMessage(chatId, text, { reply_markup: keyboard });
};

const handleBonusClaim = async (chatId, from, messageId, threshold, callbackQueryId) => {
  const result = await callApi(`/api/player/${from.id}/bonuses/${threshold}/claim`, { method: 'POST' });

  if (result.status === 'not-unlocked') {
    await answerCallbackQuery(callbackQueryId, { text: '❌ Ще не досягнуто цього рубежу.', showAlert: true });
    return;
  }
  if (result.status === 'already-claimed') {
    await answerCallbackQuery(callbackQueryId, { text: '❌ Вже забрано.', showAlert: true });
    return;
  }

  const rewardText = result.rewardShards > 0
    ? `+${result.rewardBonusClaims} 🎫, +${result.rewardShards} 🛡`
    : `+${result.rewardBonusClaims} 🎫`;

  await answerCallbackQuery(callbackQueryId, { text: `✅ Отримано! ${rewardText}` });
  await handleBonuses(chatId, from, messageId);
};

const buildClanListKeyboard = (clans) => {
  const rows = clans
    .filter((c) => c.memberCount < c.maxMembers)
    .slice(0, 10)
    .map((c) => [{ text: `Вступити: [${c.tag}] ${c.name}`, callback_data: `clan:join:${c.id}` }]);

  rows.push([{ text: '➕ Створити свій клан', callback_data: 'clan:create:prompt' }]);
  rows.push([{ text: '🔙 До меню', callback_data: 'menu:back' }]);

  return { inline_keyboard: rows };
};

const handleClan = async (chatId, messageId, from) => {
  const { clan } = await callApi(`/api/player/${from.id}/clan/details`);

  if (messageId) await deleteMessage(chatId, messageId);

  if (clan) {
    await sendMessage(chatId, formatMyClanMessage(clan), { reply_markup: buildMyClanKeyboard(clan) });
    return;
  }

  const { clans } = await callApi('/api/clans');
  await sendMessage(chatId, formatClanListMessage(clans), { reply_markup: buildClanListKeyboard(clans) });
};

const handleClanInvite = async (chatId, messageId, from) => {
  const { clan } = await callApi(`/api/player/${from.id}/clan`);
  if (!clan) return;

  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'ShadowManiaBot';
  const inviteLink = `https://t.me/${botUsername}?start=clan_${clan.id}`;

  await sendMessage(chatId, `✉️ Запроси друзів до клану [${clan.tag}] ${clan.name}!\n\n${inviteLink}`);
};

const handleClanDescPrompt = async (chatId, messageId, from) => {
  await sendMessage(chatId, 'Введи новий опис клану так:\n/clan_description Текст опису');
};

const handleClanDescriptionCommand = async (chatId, from, rawText) => {
  const description = rawText.replace('/clan_description', '').trim();
  if (!description) {
    await sendMessage(chatId, 'Введи текст опису після команди. Приклад: /clan_description Найкращий клан!');
    return;
  }

  const result = await callApi(`/api/player/${from.id}/clan/description`, {
    method: 'POST',
    body: JSON.stringify({ description })
  });

  await sendMessage(chatId, result.status === 'ok' ? '✅ Опис клану оновлено!' : '❌ Тільки глава може редагувати опис.');
  await handleClan(chatId, null, from);
};

const handleClanLevelUp = async (chatId, messageId, from) => {
  const result = await callApi(`/api/player/${from.id}/clan/level-up`, { method: 'POST' });

  if (result.status === 'not-enough-dust') {
    await sendMessage(chatId, `❌ Недостатньо коінів у казні. Потрібно ${result.required.toLocaleString('uk-UA')}, є ${result.have.toLocaleString('uk-UA')}.`);
    return;
  }
  if (result.status === 'not-leader') {
    await sendMessage(chatId, '❌ Тільки глава може підвищувати рівень клану.');
    return;
  }

  await sendMessage(chatId, '✅ Рівень клану підвищено!');
  await handleClan(chatId, null, from);
};

const handleClanDeleteConfirm = async (chatId, messageId, from) => {
  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(chatId, '⚠️ Ти дійсно хочеш видалити клан? Це незворотньо.', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Так, видалити', callback_data: 'clan:delete:execute' }],
        [{ text: '❌ Скасувати', callback_data: 'menu:clan' }]
      ]
    }
  });
};

const handleClanDeleteExecute = async (chatId, messageId, from) => {
  const result = await callApi(`/api/player/${from.id}/clan/delete`, { method: 'POST' });
  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(chatId, result.status === 'ok' ? '🗑 Клан видалено.' : '❌ Тільки глава може видалити клан.');
  await handleClan(chatId, null, from);
};

const formatMembersListMessage = (clan) => {
  const lines = [`👥 Учасники [${clan.tag}] ${clan.name}`, ''];
  clan.members.forEach((m, i) => {
    lines.push(`${i + 1}. ${CLAN_ROLE_LABELS[m.role] ?? m.role} ${m.displayName} — ${m.contributionScore.toLocaleString('uk-UA')} pts`);
  });
  return lines.join('\n');
};

const handleClanMembers = async (chatId, messageId, from) => {
  const { clan } = await callApi(`/api/player/${from.id}/clan/details`);
  if (messageId) await deleteMessage(chatId, messageId);

  await sendMessage(chatId, formatMembersListMessage(clan), {
    reply_markup: { inline_keyboard: [[{ text: '🔙 До клану', callback_data: 'menu:clan' }]] }
  });
};

const formatClanRankingMessage = (ranking) => {
  const lines = ['🏆 Рейтинг кланів', ''];
  ranking.forEach((clan, i) => {
    lines.push(`${i + 1}. [${clan.tag}] ${clan.name} — Ур.${clan.level} — ${clan.weeklyScore.toLocaleString('uk-UA')} pts — ${clan.memberCount} 👥`);
  });
  return lines.join('\n');
};

const handleClanRanking = async (chatId, messageId, from) => {
  const { ranking } = await callApi('/api/clans/ranking');
  if (messageId) await deleteMessage(chatId, messageId);

  await sendMessage(chatId, formatClanRankingMessage(ranking), {
    reply_markup: { inline_keyboard: [[{ text: '🔙 До клану', callback_data: 'menu:clan' }]] }
  });
};

const handleClanDepositPrompt = async (chatId, messageId, from) => {
  await sendMessage(chatId, 'Введи суму поповнення казни так:\n/clan_deposit 1000');
};

const handleClanDepositCommand = async (chatId, from, rawText) => {
  const amountText = rawText.replace('/clan_deposit', '').trim();
  const amount = Number(amountText);

  if (!amount || amount <= 0) {
    await sendMessage(chatId, 'Введи коректну суму. Приклад: /clan_deposit 1000');
    return;
  }

  const result = await callApi(`/api/player/${from.id}/clan/deposit`, {
    method: 'POST',
    body: JSON.stringify({ amount })
  });

  if (result.status === 'not-enough-dust') {
    await sendMessage(chatId, `❌ Недостатньо коінів. У тебе ${result.have.toLocaleString('uk-UA')}.`);
    return;
  }
  if (result.status === 'not-in-clan') {
    await sendMessage(chatId, '❌ Ти не в клані.');
    return;
  }

  await sendMessage(chatId, `✅ Внесено ${amount.toLocaleString('uk-UA')} коінів до казни! Твій внесок: ${result.contributionScore.toLocaleString('uk-UA')}`);
  await handleClan(chatId, null, from);
};

const handleClanContributions = async (chatId, messageId, from) => {
  const { clan } = await callApi(`/api/player/${from.id}/clan/details`);
  if (messageId) await deleteMessage(chatId, messageId);

  const sorted = [...clan.members].sort((a, b) => b.contributionScore - a.contributionScore);
  const lines = ['📊 Внески клану', ''];
  sorted.forEach((m, i) => {
    lines.push(`${i + 1}. ${m.displayName} — ${m.contributionScore.toLocaleString('uk-UA')} 🪙`);
  });

  await sendMessage(chatId, lines.join('\n'), {
    reply_markup: { inline_keyboard: [[{ text: '🔙 До клану', callback_data: 'menu:clan' }]] }
  });
};

const handleClanJoin = async (chatId, messageId, from, clanId) => {
  const result = await callApi(`/api/player/${from.id}/clan/join`, {
    method: 'POST',
    body: JSON.stringify({ clanId })
  });

  const messages = {
    'already-in-clan': '❌ Ти вже перебуваєш у клані.',
    'clan-full': '❌ Цей клан вже заповнений.',
    'clan-not-found': '❌ Клан не знайдено.',
    ok: '✅ Ти успішно вступив до клану!'
  };

  await sendMessage(chatId, messages[result.status] ?? '❌ Сталася помилка.');
  await handleClan(chatId, null, from);
};

const handleClanLeaveConfirm = async (chatId, messageId, from) => {
  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(chatId, '⚠️ Ти дійсно хочеш покинути клан?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Так, покинути', callback_data: 'clan:leave:execute' }],
        [{ text: '❌ Скасувати', callback_data: 'menu:clan' }]
      ]
    }
  });
};

const handleClanLeaveExecute = async (chatId, messageId, from) => {
  await callApi(`/api/player/${from.id}/clan/leave`, { method: 'POST' });
  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(chatId, '🚪 Ти покинув клан.');
  await handleClan(chatId, null, from);
};

const handleClanCreatePrompt = async (chatId, messageId, from) => {
  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(
    chatId,
    `Створення клану коштує 🪙 100 000 коінів.\n\nВведи назву та тег клану у форматі:\n/create_clan Назва Клану | ТЕГ\n\nНаприклад: /create_clan Тіньовий Легіон | SHDW`,
    { reply_markup: { inline_keyboard: [[{ text: '🔙 До меню', callback_data: 'menu:back' }]] } }
  );
};

const handleCreateClanCommand = async (chatId, from, rawText) => {
  const payload = rawText.replace('/create_clan', '').trim();
  const [name, tag] = payload.split('|').map((part) => part?.trim());

  if (!name || !tag) {
    await sendMessage(chatId, 'Невірний формат. Приклад: /create_clan Тіньовий Легіон | SHDW');
    return;
  }

  const result = await callApi(`/api/player/${from.id}/clan/create`, {
    method: 'POST',
    body: JSON.stringify({ name, tag })
  });

  if (result.status === 'not-enough-dust') {
    await sendMessage(chatId, `❌ Недостатньо коінів. Потрібно ${result.required.toLocaleString('uk-UA')}, у тебе ${result.have.toLocaleString('uk-UA')}.`);
    return;
  }

  const messages = {
    'already-in-clan': '❌ Ти вже перебуваєш у клані. Спочатку покинь поточний.',
    'name-taken': '❌ Клан з такою назвою або тегом вже існує.',
    ok: `✅ Клан "${name}" [${tag.toUpperCase()}] створено! Ти його глава.`
  };

  await sendMessage(chatId, messages[result.status] ?? '❌ Сталася помилка.');
  await handleClan(chatId, null, from);
};

const buildArenaHomeKeyboard = () => ({
  inline_keyboard: [
    [{ text: '🔍 Пошук суперника', callback_data: 'arena:search' }],
    [{ text: '🔴 Команда', callback_data: 'arena:team' }, { text: '📊 Статистика', callback_data: 'arena:stats' }],
    [{ text: '🐉 Сезонний Бос', callback_data: 'arena:boss' }],
    [{ text: '🔙 Назад', callback_data: 'menu:back' }]
  ]
});

const handleArenaHome = async (chatId, messageId, from) => {
  const displayName = from.first_name ?? from.username ?? 'Гравцю';
  const [team] = await Promise.all([callApi(`/api/player/${from.id}/arena/team`)]);

  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(chatId, formatArenaHomeMessage(displayName, team), { reply_markup: buildArenaHomeKeyboard() });
};

const buildRolesListKeyboard = (clan, myTelegramId) => {
  const rows = clan.members
    .filter((m) => m.telegramId !== myTelegramId)
    .slice(0, 20)
    .map((m) => [{
      text: `${CLAN_ROLE_LABELS[m.role] ?? m.role} ${m.displayName}`,
      callback_data: `clan:roleuser:${m.telegramId}`
    }]);

  rows.push([{ text: '🔙 До клану', callback_data: 'menu:clan' }]);
  return { inline_keyboard: rows };
};

const handleClanRolesList = async (chatId, messageId, from) => {
  const { clan } = await callApi(`/api/player/${from.id}/clan`);

  if (messageId) await deleteMessage(chatId, messageId);

  if (!clan || clan.myRole !== 'LEADER') {
    await sendMessage(chatId, '❌ Тільки глава клану може призначати ролі.');
    return;
  }

  await sendMessage(chatId, '⚙️ Обери учасника, щоб змінити роль:', {
    reply_markup: buildRolesListKeyboard(clan, String(from.id))
  });
};

const CLAN_ASSIGNABLE_ROLES = [
  { role: 'DEPUTY', label: '🎖 Заступник' },
  { role: 'COMMANDER', label: '⚔️ Полководець' },
  { role: 'SERGEANT', label: '🛡 Сержант' },
  { role: 'MEMBER', label: '👤 Учасник' }
];

const buildRoleChoiceKeyboard = (targetTelegramId) => ({
  inline_keyboard: [
    ...CLAN_ASSIGNABLE_ROLES.map((r) => [{
      text: r.label,
      callback_data: `clan:setrole:${targetTelegramId}:${r.role}`
    }]),
    [{ text: '🔙 Назад', callback_data: 'clan:roles' }]
  ]
});

const handleClanRoleUserChoice = async (chatId, messageId, from, targetTelegramId) => {
  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(chatId, 'Обери нову роль для учасника:', {
    reply_markup: buildRoleChoiceKeyboard(targetTelegramId)
  });
};

const handleClanSetRole = async (chatId, messageId, from, targetTelegramId, role) => {
  const result = await callApi(`/api/player/${from.id}/clan/set-role`, {
    method: 'POST',
    body: JSON.stringify({ targetTelegramId, role })
  });

  const messages = {
    'not-leader': '❌ Тільки глава клану може призначати ролі.',
    'target-not-in-clan': '❌ Цей гравець не в твоєму клані.',
    'cannot-change-own-role': '❌ Не можна змінити свою власну роль.',
    ok: `✅ Роль оновлено на ${CLAN_ROLE_LABELS[role] ?? role}`
  };

  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(chatId, messages[result.status] ?? '❌ Сталася помилка.');
  await handleClan(chatId, null, from);
};

const formatTeamBuilderMessage = (card, index, total) =>
  [
    `Виберіть картку для вашої команди (Всесвіт: 🧑‍🎓 Naruto)`,
    '',
    '🎴 Картка',
    `${RARITY_EMOJI[card.rarity] ?? '⚪'} ${card.name}`,
    `🗡 Атака: ${card.attack}  ❤️ Здоров'я: ${card.health}`
  ].join('\n');

const buildTeamBuilderKeyboard = (cards, index, team) => {
  const total = cards.length;
  const prevIndex = index > 0 ? index - 1 : total - 1;
  const nextIndex = index < total - 1 ? index + 1 : 0;
  const currentCardId = cards[index]?.cardId;

  const slotRows = team.slots.map((slot, slotIndex) => {
    const rarityEmoji = slot ? (RARITY_EMOJI[slot.rarity] ?? '⚪') : '';
    const label = slot ? `${rarityEmoji} ${slot.name}` : '➕ Порожньо';
    return [{
      text: `${label} ${slot ? '❌' : ''}`.trim(),
      callback_data: `arena:teamslot:${slotIndex}:${index}`
    }];
  });

  return {
    inline_keyboard: [
      [
        { text: '◀️', callback_data: `arena:teamnav:${prevIndex}` },
        { text: `${index + 1}/${total}`, callback_data: 'col:noop' },
        { text: '▶️', callback_data: `arena:teamnav:${nextIndex}` }
      ],
      ...slotRows,
      [{ text: '🔙 Назад до арени', callback_data: 'arena:home' }]
    ]
  };
};

const formatQuestReward = (quest) => {
  const parts = [`🪙${quest.rewardDust}`, `⭐${quest.rewardPoints}`];
  if (quest.rewardBonusClaims > 0) parts.push(`🎟${quest.rewardBonusClaims}`);
  return parts.join(' ');
};

const formatQuestsMessage = (quests) => {
  const lines = ['🏗 Щоденні завдання', ''];

  for (const quest of quests) {
    const status = quest.claimed ? '✅' : quest.completed ? '🎁' : '⏳';
    lines.push(`${status} ${quest.emoji} ${quest.title} — ${quest.progress}/${quest.target}`);
    lines.push(`   Нагорода: ${formatQuestReward(quest)}`);
  }

  return lines.join('\n');
};

const formatCraftAttemptsMessage = (displayName, status) => {
  const lines = [
    `🌀 ${displayName}, ти можеш скрафтити 🎫 спроби з повторок та уламків`,
    '',
    '🌀 Твої повторки та уламки'
  ];

  const rarityRows = RARITY_ORDER.map((rarity, i) => {
    const isLast = i === RARITY_ORDER.length - 1;
    const prefix = isLast ? '└➤' : '├➤';
    return `${prefix} ${RARITY_EMOJI[rarity]} ${RARITY_LABELS[rarity]} - ${status.duplicatesByRarity[rarity]}`;
  });

  lines.push(...rarityRows);
  lines.push(`└➤ 🛡 Уламки - ${status.shards}`);

  lines.push('', '🎫 Вартість крафтів');
  RARITY_ORDER.forEach((rarity, i) => {
    const isLast = i === RARITY_ORDER.length - 1;
    const prefix = isLast ? '└' : '├';
    lines.push(`${prefix}${status.duplicatesRequired} ${RARITY_EMOJI[rarity]} ${RARITY_LABELS[rarity]} ➡ ${status.rewardByRarity[rarity]} 🎫`);
  });
  lines.push(`└${status.shardsRequired} 🛡 Уламки ➡ ${status.shardsReward} 🎫`);

  return lines.join('\n');
};

const buildCraftAttemptsKeyboard = (status) => {
  const availableRarities = RARITY_ORDER.filter((rarity) => status.duplicatesByRarity[rarity] >= status.duplicatesRequired);
  const shardsAvailable = status.shards >= status.shardsRequired;

  const rows = availableRarities.map((rarity) => [{
    text: `Обміняти 10 ${RARITY_EMOJI[rarity]} ${RARITY_LABELS[rarity]} на ${status.rewardByRarity[rarity]} 🎫`,
    callback_data: `craft:dup:${rarity}`
  }]);

  if (shardsAvailable) {
    rows.push([{
      text: `Обміняти 10 🛡 Уламки на ${status.shardsReward} 🎫`,
      callback_data: 'craft:shards'
    }]);
  }

  const hasAnythingToCraft = availableRarities.length > 0 || shardsAvailable;
  if (hasAnythingToCraft) {
    rows.push([{ text: '⚒ Крафтити все', callback_data: 'craft:all' }]);
  }

  rows.push([{ text: '🔙 Назад', callback_data: 'menu:back' }]);

  return { inline_keyboard: rows };
};

const handleCraftAttempts = async (chatId, from, messageId = null) => {
  const displayName = from.first_name ?? from.username ?? 'Гравцю';
  const status = await callApi(`/api/player/${from.id}/craft-attempts`);
  const text = formatCraftAttemptsMessage(displayName, status);
  const keyboard = buildCraftAttemptsKeyboard(status);

  if (messageId) {
    const edited = await editMessageText(chatId, messageId, text, { reply_markup: keyboard });
    if (edited?.ok) return;
  }

  await sendMessage(chatId, text, { reply_markup: keyboard });
};

const handleCraftFromDuplicates = async (chatId, from, messageId, rarity, callbackQueryId) => {
  const result = await callApi(`/api/player/${from.id}/craft-attempts/duplicates`, {
    method: 'POST',
    body: JSON.stringify({ rarity })
  });

  if (result.status === 'locked') {
    await answerCallbackQuery(callbackQueryId, { text: '🔒 Крафти заблоковані. Вимкни блокування в Налаштуваннях.', showAlert: true });
    return;
  }

  if (result.status === 'not-enough') {
    await answerCallbackQuery(callbackQueryId, { text: `❌ Потрібно ${result.required}, у тебе ${result.have}.`, showAlert: true });
    return;
  }

  await answerCallbackQuery(callbackQueryId, { text: `✅ +${result.attemptsGained} 🎫 спроб!` });
  await handleCraftAttempts(chatId, from, messageId);
};

const handleCraftFromShards = async (chatId, from, messageId, callbackQueryId) => {
  const result = await callApi(`/api/player/${from.id}/craft-attempts/shards`, { method: 'POST' });

  if (result.status === 'locked') {
    await answerCallbackQuery(callbackQueryId, { text: '🔒 Крафти заблоковані. Вимкни блокування в Налаштуваннях.', showAlert: true });
    return;
  }

  if (result.status === 'not-enough') {
    await answerCallbackQuery(callbackQueryId, { text: `❌ Потрібно ${result.required}, у тебе ${result.have}.`, showAlert: true });
    return;
  }

  await answerCallbackQuery(callbackQueryId, { text: `✅ +${result.attemptsGained} 🎫 спроб!` });
  await handleCraftAttempts(chatId, from, messageId);
};

const handleCraftAll = async (chatId, from, messageId, callbackQueryId) => {
  const result = await callApi(`/api/player/${from.id}/craft-attempts/all`, { method: 'POST' });

  if (result.status === 'locked') {
    await answerCallbackQuery(callbackQueryId, { text: '🔒 Крафти заблоковані. Вимкни блокування в Налаштуваннях.', showAlert: true });
    return;
  }

  const toastText = result.totalAttemptsGained > 0
    ? `✅ Скрафчено +${result.totalAttemptsGained} 🎫 спроб!`
    : '❌ Недостатньо ресурсів для крафту.';

  await answerCallbackQuery(callbackQueryId, { text: toastText, showAlert: result.totalAttemptsGained === 0 });
  await handleCraftAttempts(chatId, from, messageId);
};

const buildQuestsKeyboard = (quests) => {
  const rows = quests
    .filter((q) => q.completed && !q.claimed)
    .map((q) => [{ text: `🎁 Забрати: ${q.title}`, callback_data: `quest:claim:${q.id}` }]);

  rows.push([{ text: '🔙 До меню', callback_data: 'menu:back' }]);
  return { inline_keyboard: rows };
};

const handleQuests = async (chatId, messageId, from) => {
  const { quests } = await callApi(`/api/player/${from.id}/quests`);
  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(chatId, formatQuestsMessage(quests), { reply_markup: buildQuestsKeyboard(quests) });
};

const handleQuestClaim = async (chatId, messageId, from, questId) => {
  const result = await callApi(`/api/player/${from.id}/quests/${questId}/claim`, { method: 'POST' });

  if (result.status === 'claimed') {
    const rewardParts = [`+${result.rewardDust} 🪙 коінів`, `+${result.rewardPoints} ⭐ очок сезону`];
    if (result.rewardBonusClaims > 0) rewardParts.push(`+${result.rewardBonusClaims} 🎟 спроб`);

    await sendMessage(chatId, `🎉 Нагороду отримано!\n\n${rewardParts.join('\n')}`);
  }

  await handleQuests(chatId, messageId, from);
};

const formatShopMessage = (shop) =>
  [
    '🛍 Магазин',
    '',
    `🪙 Твої коіни: ${shop.dustBalance.toLocaleString('uk-UA')}`,
    `🎟 Спроби: ${shop.bonusClaims}`,
    '',
    `Купити спробу: 🪙 ${shop.bonusClaimCost} за 1 шт.`,
    '',
    'Крафт гарантованої картки (за коіни):'
  ].join('\n');

const buildShopKeyboard = (shop) => ({
  inline_keyboard: [
    [
      { text: `🎟 +1 спроба (${shop.bonusClaimCost})`, callback_data: 'shop:buy:1' },
      { text: `🎟 +5 спроб (${shop.bonusClaimCost * 5})`, callback_data: 'shop:buy:5' }
    ],
    ...RARITY_ORDER.map((rarity) => [{
      text: `${RARITY_EMOJI[rarity]} ${RARITY_LABELS[rarity]} — ${shop.craftCosts[rarity]} 🪙`,
      callback_data: `shop:craft:${rarity}`
    }]),
    [{ text: '🔙 До меню', callback_data: 'menu:back' }]
  ]
});

const handleShop = async (chatId, messageId, from) => {
  const shop = await callApi(`/api/player/${from.id}/shop`);
  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(chatId, formatShopMessage(shop), { reply_markup: buildShopKeyboard(shop) });
};

const handleShopBuyClaims = async (chatId, messageId, from, quantity) => {
  const result = await callApi(`/api/player/${from.id}/shop/buy-claims`, {
    method: 'POST',
    body: JSON.stringify({ quantity })
  });

  if (messageId) await deleteMessage(chatId, messageId);

  if (result.status === 'not-enough-dust') {
    await sendMessage(chatId, `❌ Недостатньо коінів. Потрібно ${result.required}, у тебе ${result.have}.`, {
      reply_markup: { inline_keyboard: [[{ text: '🔙 До магазину', callback_data: 'menu:shop' }]] }
    });
    return;
  }

  await sendMessage(chatId, `✅ Куплено ${quantity} спроб(и)! Тепер у тебе ${result.bonusClaims} 🎟`, {
    reply_markup: { inline_keyboard: [[{ text: '🔙 До магазину', callback_data: 'menu:shop' }]] }
  });
};

const formatCraftResultMessage = (result) => {
  if (result.isNew) {
    return [
      `✨ Крафт успішний! Нова картка:`,
      '',
      `${RARITY_EMOJI[result.card.rarity]} ${result.card.name}`,
      `🗡 Атака: ${result.card.attack}`,
      `❤️ Здоров'я: ${result.card.health}`,
      `🌐 Всесвіт: ${result.card.universe}`
    ].join('\n');
  }

  return [
    `♻️ Ця картка вже була у тебе — отримано повторку:`,
    '',
    `${RARITY_EMOJI[result.card.rarity]} ${result.card.name}`,
    `⛩ +${result.card.value} pts`,
    `💎 Очки всесвіту: ${result.universePoints} pts`
  ].join('\n');
};

const handleShopCraft = async (chatId, messageId, from, rarity) => {
  const result = await callApi(`/api/player/${from.id}/shop/craft`, {
    method: 'POST',
    body: JSON.stringify({ rarity })
  });

  if (messageId) await deleteMessage(chatId, messageId);
  const backKeyboard = { inline_keyboard: [[{ text: '🔙 До магазину', callback_data: 'menu:shop' }]] };

  if (result.status === 'locked') {
    await sendMessage(chatId, '🔒 Крафти заблоковані. Вимкни блокування в Налаштуваннях, щоб продовжити.', { reply_markup: backKeyboard });
    return;
  }

  if (result.status === 'not-enough-dust') {
    await sendMessage(chatId, `❌ Недостатньо коінів. Потрібно ${result.required}, у тебе ${result.have}.`, { reply_markup: backKeyboard });
    return;
  }

  await sendCardMessage(chatId, result.card, formatCraftResultMessage(result), backKeyboard);
};

const handleTeamBuilder = async (chatId, messageId, from, index) => {
  const [cards, team] = await Promise.all([
    callApi(`/api/player/${from.id}/arena/team/cards`).then((r) => r.cards),
    callApi(`/api/player/${from.id}/arena/team`)
  ]);

  if (messageId) await deleteMessage(chatId, messageId);

  if (cards.length === 0) {
    await sendMessage(chatId, 'У тебе ще немає жодної картки. Спочатку отримай картки!', {
      reply_markup: { inline_keyboard: [[{ text: '🔙 Назад до арени', callback_data: 'arena:home' }]] }
    });
    return;
  }

  const safeIndex = ((index % cards.length) + cards.length) % cards.length;
  const card = cards[safeIndex];
  const caption = formatTeamBuilderMessage(card, safeIndex, cards.length);
  const keyboard = buildTeamBuilderKeyboard(cards, safeIndex, team);

  await sendCardMessage(chatId, card, caption, keyboard);
};

const handleTeamSlotToggle = async (chatId, messageId, from, slotIndex, browserIndex) => {
  const cardsBefore = await callApi(`/api/player/${from.id}/arena/team/cards`).then((r) => r.cards);
  const card = cardsBefore[browserIndex % cardsBefore.length];

  await callApi(`/api/player/${from.id}/arena/team/slot`, {
    method: 'POST',
    body: JSON.stringify({ slotIndex, cardId: card.cardId })
  });

  await handleTeamBuilder(chatId, messageId, from, 0);
};

const formatArenaStatsMessage = (displayName, stats) =>
  [
    `📊 ${displayName}, ось твоя статистика битв`,
    '',
    '📁 В цьому всесвіті (🧑‍🎓 Naruto)',
    '- - - - - - -',
    '',
    `🏆 Перемог: ${stats.wins}`,
    `💀 Поразок: ${stats.losses}`,
    `🛡 Відбито нападів: ${stats.defended}`,
    `🎖 Всього битв: ${stats.totalBattles}`
  ].join('\n');

const handleArenaStats = async (chatId, messageId, from) => {
  const displayName = from.first_name ?? from.username ?? 'Гравцю';
  const stats = await callApi(`/api/player/${from.id}/arena/stats`);

  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(chatId, formatArenaStatsMessage(displayName, stats), {
    reply_markup: { inline_keyboard: [[{ text: '🔙 Назад до арени', callback_data: 'arena:home' }]] }
  });
};

const formatArenaBattleResultMessage = (from, result) => {
  const displayName = from.first_name ?? from.username ?? 'Гравцю';
  const resultLine = result.win ? '✨ Перемога! ✨' : '💀 Поразка...';

  return [
    resultLine,
    '',
    `🧑 ${displayName}`,
    `  └─➤ Наносить ⚔️ ${result.totalDamageDealt} шкоди`,
    '',
    `🎭 ${result.opponent.displayName}`,
    `  └─➤ ❤️ ${result.opponent.totalHealth}→💀${Math.max(0, result.opponent.totalHealth - result.totalDamageDealt)}`,
    '',
    `🗡 Всього завдано шкоди: ${result.totalDamageDealt}`,
    `🩸 Шкода від суперника: ${result.totalDamageTaken}`,
    `🎖 Всього раундів: ${result.rounds}`,
    '',
    `🌸 Тримай свою винагороду за ${result.win ? 'перемогу' : 'участь'}:`,
    `+${result.dustGained} 💠 пилу, +${result.pointsGained} pts`
  ].join('\n');
};

const handleArenaSearch = async (chatId, messageId, from) => {
  try {
    const result = await callApi(`/api/player/${from.id}/arena/search`, { method: 'POST' });

    if (messageId) await deleteMessage(chatId, messageId);

    const backKeyboard = { inline_keyboard: [[{ text: '🔙 Назад до арени', callback_data: 'arena:home' }]] };

    if (result.status === 'cooldown') {
      await sendMessage(chatId, `🏟 Наступний бій буде доступний через ⏳ ${formatDuration(result.remainingMs)}`, { reply_markup: backKeyboard });
      return;
    }

    if (result.status === 'no-team') {
      await sendMessage(chatId, '🏟 Спочатку зібери команду з 5 карток кнопкою "🔴 Команда"!', { reply_markup: backKeyboard });
      return;
    }

    await sendMessage(chatId, formatArenaBattleResultMessage(from, result), {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📜 Історія бою', callback_data: 'arena:history' }, { text: '🔙 Назад до арени', callback_data: 'arena:home' }]
        ]
      }
    });
  } catch (error) {
    console.error('Failed to search arena battle:', error);
    await sendMessage(chatId, 'Не вдалося провести бій на арені. Спробуйте ще раз трохи пізніше.');
  }
};

const handleArenaHistory = async (chatId, messageId, from) => {
  const { log } = await callApi(`/api/player/${from.id}/arena/history`);
  if (messageId) await deleteMessage(chatId, messageId);

  const backKeyboard = { inline_keyboard: [[{ text: '🔙 Назад до арени', callback_data: 'arena:home' }]] };

  if (!log) {
    await sendMessage(chatId, 'Історія боїв поки порожня.', { reply_markup: backKeyboard });
    return;
  }

  const lines = [
    '📜 Історія останнього бою',
    '',
    `Суперник: ${log.opponentName}${log.isPlayerOpponent ? ' (гравець)' : ' (бот)'}`,
    `Результат: ${log.win ? '🏆 Перемога' : '💀 Поразка'}`,
    `Раундів: ${log.rounds}`,
    `Завдано шкоди: ${log.totalDamageDealt}`,
    `Отримано шкоди: ${log.totalDamageTaken}`
  ];

  await sendMessage(chatId, lines.join('\n'), { reply_markup: backKeyboard });
};

const handleArenaBoss = async (chatId, messageId, from) => {
  if (messageId) await deleteMessage(chatId, messageId);
  await sendMessage(chatId, '🐉 Сезонний Бос ще в розробці. Слідкуй за оновленнями в 📜 Хроніках!', {
    reply_markup: { inline_keyboard: [[{ text: '🔙 Назад до арени', callback_data: 'arena:home' }]] }
  });
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

  const craftLockRow = [{
    text: `Блокування крафтів ${settings.craftLocked ? '🔒' : '🔓'}`,
    callback_data: 'settings:toggle:craft'
  }];

  const chroniclesRow = [{ text: '📜 Хроніки', callback_data: 'col:chronicles' }];

  return {
    inline_keyboard: [arenaRow, cardRow, craftLockRow, chroniclesRow]
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

const editMessageText = (chatId, messageId, text, extra = {}) =>
  callTelegram('editMessageText', { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', ...extra });

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


const formatNewCardMessage = (card, result) =>
  [
    `${RARITY_EMOJI[card.rarity] ?? '⚪'} ${card.name}/${card.universe}`,
    `🌎 Ранг: ${card.rarityLabel}`,
    `🗡 Атака: ${card.attack}`,
    `❤️ Здоров'я: ${card.health}`,
    `💎 Цінність: ${card.value} pts`,
    `🌐 Всесвіт: ${card.universe}`,
    '',
    `⛩ +${result.pointsGained} pts`,
    `✨ +${result.dustGained} пилу`,
    `🎲 Використано 1 спробу!`
  ].join('\n');

const formatDuplicateMessage = (displayName, result) =>
  [
    `${RARITY_EMOJI[result.card.rarity] ?? '⚪'} ${displayName}, попалася повторка!`,
    '',
    `⛩ +${result.pointsGained} pts`,
    `💎 Очки всесвіту: ${result.universePoints} pts`,
    `🛡 +${result.shardsGained} уламків`,
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

const getOwnedCardsByRarity = (collection) => {
  const byRarity = new Map(RARITY_ORDER.map((r) => [r, []]));
  for (const universe of collection.universes) {
    for (const card of universe.cards) {
      if (!card.owned) continue;
      const list = byRarity.get(card.rarity);
      if (list) list.push(card);
    }
  }
  for (const list of byRarity.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
  }
  return byRarity;
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

    await sendCardMessage(chatId, result.card, formatNewCardMessage(result.card, result));
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

    if (data === 'menu:arena' || data === 'arena:home') {
      await handleArenaHome(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'arena:search') {
      await handleArenaSearch(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'arena:team') {
      await handleTeamBuilder(chatId, messageId, from, 0);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'menu:quests') {
      await handleQuests(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'menu:craft') {
      await handleCraftAttempts(chatId, from, messageId);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'menu:clan') {
      await handleClan(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'menu:bonuses') {
      await handleBonuses(chatId, from, messageId);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const bonusClaimMatch = data.match(/^bonus:claim:(\d+)$/);
    if (bonusClaimMatch) {
      await handleBonusClaim(chatId, from, messageId, Number(bonusClaimMatch[1]), callbackQuery.id);
      return;
    }

    const clanJoinMatch = data.match(/^clan:join:(.+)$/);
    if (clanJoinMatch) {
      await handleClanJoin(chatId, messageId, from, clanJoinMatch[1]);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'clan:leave:confirm') {
      await handleClanLeaveConfirm(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'clan:leave:execute') {
      await handleClanLeaveExecute(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'clan:create:prompt') {
      await handleClanCreatePrompt(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'clan:roles') {
      await handleClanRolesList(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'clan:invite') {
      await handleClanInvite(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'clan:desc:prompt') {
      await handleClanDescPrompt(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'clan:levelup') {
      await handleClanLevelUp(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'clan:delete:confirm') {
      await handleClanDeleteConfirm(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'clan:delete:execute') {
      await handleClanDeleteExecute(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'clan:members') {
      await handleClanMembers(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'clan:ranking') {
      await handleClanRanking(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'clan:deposit:prompt') {
      await handleClanDepositPrompt(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'clan:contributions') {
      await handleClanContributions(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const clanRoleUserMatch = data.match(/^clan:roleuser:(.+)$/);
    if (clanRoleUserMatch) {
      await handleClanRoleUserChoice(chatId, messageId, from, clanRoleUserMatch[1]);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const clanSetRoleMatch = data.match(/^clan:setrole:(.+):([A-Z]+)$/);
    if (clanSetRoleMatch) {
      await handleClanSetRole(chatId, messageId, from, clanSetRoleMatch[1], clanSetRoleMatch[2]);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const craftDupMatch = data.match(/^craft:dup:([a-z]+)$/);
    if (craftDupMatch) {
      await handleCraftFromDuplicates(chatId, from, messageId, craftDupMatch[1], callbackQuery.id);
      return;
    }

    if (data === 'craft:shards') {
      await handleCraftFromShards(chatId, from, messageId, callbackQuery.id);
      return;
    }

    if (data === 'craft:all') {
      await handleCraftAll(chatId, from, messageId, callbackQuery.id);
      return;
    }

    const questClaimMatch = data.match(/^quest:claim:(.+)$/);
    if (questClaimMatch) {
      await handleQuestClaim(chatId, messageId, from, questClaimMatch[1]);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const teamNavMatch = data.match(/^arena:teamnav:(\d+)$/);
    if (teamNavMatch) {
      await handleTeamBuilder(chatId, messageId, from, Number(teamNavMatch[1]));
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const teamSlotMatch = data.match(/^arena:teamslot:(\d+):(\d+)$/);
    if (teamSlotMatch) {
      await handleTeamSlotToggle(chatId, messageId, from, Number(teamSlotMatch[1]), Number(teamSlotMatch[2]));
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'arena:stats') {
      await handleArenaStats(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'arena:history') {
      await handleArenaHistory(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'arena:boss') {
      await handleArenaBoss(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    if (data === 'menu:shop') {
      await handleShop(chatId, messageId, from);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const shopBuyMatch = data.match(/^shop:buy:(\d+)$/);
    if (shopBuyMatch) {
      await handleShopBuyClaims(chatId, messageId, from, Number(shopBuyMatch[1]));
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const shopCraftMatch = data.match(/^shop:craft:([a-z]+)$/);
    if (shopCraftMatch) {
      await handleShopCraft(chatId, messageId, from, shopCraftMatch[1]);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const menuSectionMatch = data.match(/^menu:(rating|gamepass|referrals|channels|help)$/);
    if (menuSectionMatch) {
      await handleMenuSection(chatId, messageId, from, menuSectionMatch[1]);
      await answerCallbackQuery(callbackQuery.id);
      return;
    }

    const settingsToggleMatch = data.match(/^settings:toggle:(arena|card|craft)$/);
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

  if (text.startsWith('/start')) {
    await ensurePlayerRegistered(message.from);

    const startParam = text.replace('/start', '').trim();
    if (startParam.startsWith('clan_')) {
      const clanId = startParam.replace('clan_', '');
      const result = await callApi(`/api/player/${message.from.id}/clan/join`, {
        method: 'POST',
        body: JSON.stringify({ clanId })
      });

      const messages = {
        'already-in-clan': '❌ Ти вже перебуваєш у клані.',
        'clan-full': '❌ Цей клан вже заповнений.',
        'clan-not-found': '❌ Клан не знайдено.',
        ok: '✅ Ти успішно вступив до клану за запрошенням!'
      };

      await sendMessage(chatId, messages[result.status] ?? '❌ Сталася помилка.', { reply_markup: mainKeyboard });
      return;
    }

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

  if (text.startsWith('/create_clan')) {
    await ensurePlayerRegistered(message.from);
    await handleCreateClanCommand(chatId, message.from, text);
    return;
  }

  if (text.startsWith('/clan_description')) {
    await ensurePlayerRegistered(message.from);
    await handleClanDescriptionCommand(chatId, message.from, text);
    return;
  }

  if (text.startsWith('/clan_deposit')) {
    await ensurePlayerRegistered(message.from);
    await handleClanDepositCommand(chatId, message.from, text);
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