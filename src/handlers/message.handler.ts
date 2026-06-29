import type { Bot } from "grammy";
import { env } from "../config/env.js";
import { AgentChatService } from "../services/agent-chat.service.js";
import { sendAgentResponse, sendUserFacingError } from "../services/response.service.js";
import type { RmsBotContext } from "../types/bot-context.js";
import { logger } from "../utils/logger.js";

const agentChatService = new AgentChatService();

export function registerMessageHandlers(bot: Bot<RmsBotContext>): void {
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();

    if (!text) {
      await ctx.reply("Please send a text question for the RMS assistant.");
      return;
    }

    if (text.startsWith("/")) {
      await ctx.reply("I do not recognize that command yet. Use /help to see the available commands.");
      return;
    }

    if (text.length > env.app.maxUserMessageLength) {
      await ctx.reply(
        `Please keep your question under ${env.app.maxUserMessageLength} characters so I can process it reliably.`,
      );
      return;
    }

    await sendTypingAction(ctx);

    try {
      const response = await agentChatService.answer(text);
      await sendAgentResponse(ctx, response);
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
        },
        "Failed to process AI message",
      );
      await sendUserFacingError(ctx, error);
    }
  });

  bot.on("message", async (ctx) => {
    await ctx.reply("Please send a text question. Files, stickers, and media are not supported yet.");
  });
}

async function sendTypingAction(ctx: RmsBotContext): Promise<void> {
  if (!ctx.chat?.id) return;

  try {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
  } catch (error) {
    logger.warn(
      {
        error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
      },
      "Failed to send Telegram typing action",
    );
  }
}
