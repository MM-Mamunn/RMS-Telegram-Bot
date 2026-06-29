import type { Bot } from "grammy";
import type { RmsBotContext } from "../types/bot-context.js";
import { logger } from "../utils/logger.js";

export function registerErrorHandler(bot: Bot<RmsBotContext>): void {
  bot.catch((error) => {
    logger.error(
      {
        updateId: error.ctx.update.update_id,
        chatId: error.ctx.chat?.id,
        userId: error.ctx.from?.id,
        error: {
          name: error.error instanceof Error ? error.error.name : "UnknownError",
          message: error.error instanceof Error ? error.error.message : String(error.error),
        },
      },
      "Unhandled bot error",
    );
  });
}
