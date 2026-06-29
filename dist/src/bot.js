import { Bot } from "grammy";
import { env } from "./config/env.js";
import { BOT_COMMANDS, registerCommands } from "./commands/index.js";
import { registerMessageHandlers } from "./handlers/message.handler.js";
import { registerErrorHandler } from "./middleware/error.middleware.js";
import { loggingMiddleware } from "./middleware/logging.middleware.js";
import { logger } from "./utils/logger.js";
export const bot = createBot();
export function createBot() {
    const instance = new Bot(env.telegram.token);
    instance.use(loggingMiddleware);
    registerCommands(instance);
    registerMessageHandlers(instance);
    registerErrorHandler(instance);
    return instance;
}
export async function configureTelegramCommands() {
    await bot.api.setMyCommands([...BOT_COMMANDS]);
    logger.info({
        commands: BOT_COMMANDS.map((command) => command.command),
    }, "Telegram bot commands configured");
}
