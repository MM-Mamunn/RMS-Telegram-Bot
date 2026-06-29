import type { NextFunction } from "grammy";
import { env } from "../config/env.js";
import type { RmsBotContext } from "../types/bot-context.js";
import { logger } from "../utils/logger.js";

export async function loggingMiddleware(ctx: RmsBotContext, next: NextFunction): Promise<void> {
  const startedAt = Date.now();
  const messageText = ctx.message && "text" in ctx.message ? ctx.message.text : undefined;

  logger.info(
    {
      updateId: ctx.update.update_id,
      chatId: ctx.chat?.id,
      userId: ctx.from?.id,
      messageType: getMessageType(ctx),
      messageLength: messageText?.length,
      messagePreview: env.app.logMessageContent ? messageText?.slice(0, 120) : undefined,
    },
    "Incoming Telegram update",
  );

  try {
    await next();
    logger.debug(
      {
        updateId: ctx.update.update_id,
        durationMs: Date.now() - startedAt,
      },
      "Telegram update handled",
    );
  } catch (error) {
    logger.error(
      {
        updateId: ctx.update.update_id,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
      },
      "Telegram update failed",
    );
    throw error;
  }
}

function getMessageType(ctx: RmsBotContext): string | undefined {
  if (!ctx.message) return undefined;
  const keys = Object.keys(ctx.message).filter((key) => !["message_id", "date", "chat", "from"].includes(key));
  return keys[0];
}
