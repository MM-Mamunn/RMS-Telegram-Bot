import type { NextFunction } from "grammy";
import type { RmsBotContext } from "../types/bot-context.js";
import { logger } from "../utils/logger.js";

const UPDATE_TTL_MS = 10 * 60 * 1000;
const MAX_TRACKED_UPDATES = 2000;
const handledUpdates = new Map<number, number>();

export async function deduplicateUpdatesMiddleware(
  ctx: RmsBotContext,
  next: NextFunction,
): Promise<void> {
  const updateId = ctx.update.update_id;
  const now = Date.now();

  pruneHandledUpdates(now);

  if (handledUpdates.has(updateId)) {
    logger.warn(
      {
        updateId,
        chatId: ctx.chat?.id,
        userId: ctx.from?.id,
      },
      "Duplicate Telegram update ignored",
    );
    return;
  }

  handledUpdates.set(updateId, now);
  await next();
}

function pruneHandledUpdates(now: number): void {
  for (const [updateId, seenAt] of handledUpdates) {
    if (now - seenAt > UPDATE_TTL_MS) {
      handledUpdates.delete(updateId);
    }
  }

  while (handledUpdates.size > MAX_TRACKED_UPDATES) {
    const oldestKey = handledUpdates.keys().next().value;
    if (oldestKey === undefined) break;
    handledUpdates.delete(oldestKey);
  }
}
