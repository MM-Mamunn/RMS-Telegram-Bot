import { bot, configureTelegramCommands } from "../bot.js";
import { env, getWebhookTargetUrl } from "../config/env.js";
import { logger } from "../utils/logger.js";

const webhookUrl = getWebhookTargetUrl();

await configureTelegramCommands();
await bot.api.setWebhook(webhookUrl, {
  allowed_updates: [...env.telegram.allowedUpdates],
  secret_token: env.telegram.webhookSecret,
});

logger.info(
  {
    webhookUrl,
    hasSecret: Boolean(env.telegram.webhookSecret),
  },
  "Telegram webhook configured",
);
