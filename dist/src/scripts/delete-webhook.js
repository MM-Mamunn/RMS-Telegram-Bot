import { bot } from "../bot.js";
import { logger } from "../utils/logger.js";
await bot.api.deleteWebhook({ drop_pending_updates: false });
logger.info("Telegram webhook deleted");
