const telegramApi = (token, method) => `https://api.telegram.org/bot${token}/${method}`;

export const deleteWebhook = async (token, options = {}) => {
  const response = await fetch(telegramApi(token, 'deleteWebhook'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    throw new Error(`Telegram deleteWebhook failed with ${response.status}`);
  }
};

export const getUpdates = async (token, offset) => {
  const response = await fetch(`${telegramApi(token, 'getUpdates')}?timeout=30&offset=${offset}`);
  if (!response.ok) {
    const error = new Error(`Telegram getUpdates failed with ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  const payload = await response.json();
  return payload.result ?? [];
};

export const sendMessage = async (token, chatId, text, options = {}) => {
  const response = await fetch(telegramApi(token, 'sendMessage'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options.parseMode ?? 'HTML',
      disable_web_page_preview: true,
      ...options.extra
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed with ${response.status}`);
  }
};

export const editMessageText = async (token, chatId, messageId, text, options = {}) => {
  const response = await fetch(telegramApi(token, 'editMessageText'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: options.parseMode ?? 'HTML',
      disable_web_page_preview: true,
      ...options.extra
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram editMessageText failed with ${response.status}`);
  }
};

export const answerCallbackQuery = async (token, callbackQueryId, options = {}) => {
  const response = await fetch(telegramApi(token, 'answerCallbackQuery'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: options.text,
      show_alert: options.showAlert ?? false
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram answerCallbackQuery failed with ${response.status}`);
  }
};

export const sendMediaGroup = async (token, chatId, media) => {
  const response = await fetch(telegramApi(token, 'sendMediaGroup'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      media
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMediaGroup failed with ${response.status}`);
  }
};