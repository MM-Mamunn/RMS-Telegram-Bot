import { bot, configureTelegramCommands } from "./bot.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

logger.info(
  {
    nodeEnv: env.app.nodeEnv,
    backendUrl: env.rms.backendUrl,
    agentEndpoint: env.rms.agentEndpoint,
  },
  "Starting RMS Telegram bot in polling mode",
);

await configureTelegramCommands();
await bot.api.deleteWebhook({ drop_pending_updates: true });

bot.start({
  allowed_updates: [...env.telegram.allowedUpdates],
});
