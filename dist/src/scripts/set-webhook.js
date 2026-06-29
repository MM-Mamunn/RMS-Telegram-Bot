import { bot, configureTelegramCommands } from "../bot.js";
import { env, getWebhookTargetUrl } from "../config/env.js";
import { logger } from "../utils/logger.js";
const webhookUrl = getWebhookTargetUrl();
await configureTelegramCommands();
await bot.api.setWebhook(webhookUrl, {
    allowed_updates: [...env.telegram.allowedUpdates],
    drop_pending_updates: true,
    max_connections: 1,
});
logger.info({
    webhookUrl,
}, "Telegram webhook configured");
