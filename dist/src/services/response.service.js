import { splitTextForTelegram } from "../utils/chunk-text.js";
import { getFriendlyErrorMessage } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { toTelegramMarkdownV2 } from "../utils/markdown.js";
const TELEGRAM_HARD_LIMIT = 4096;
export async function sendAgentResponse(ctx, response) {
    const chunks = splitTextForTelegram(response);
    const hasMultipleParts = chunks.length > 1;
    for (const [index, chunk] of chunks.entries()) {
        const rawChunk = hasMultipleParts ? `**Part ${index + 1}/${chunks.length}**\n\n${chunk}` : chunk;
        const formatted = toTelegramMarkdownV2(rawChunk);
        if (formatted.length >= TELEGRAM_HARD_LIMIT) {
            await sendPlainText(ctx, rawChunk);
            continue;
        }
        try {
            await ctx.reply(formatted, {
                parse_mode: "MarkdownV2",
                reply_parameters: getReplyParameters(ctx),
            });
        }
        catch (error) {
            logger.warn({
                error: getErrorDetails(error),
                chunkIndex: index,
            }, "Telegram rejected MarkdownV2 response; retrying as plain text");
            await sendPlainText(ctx, rawChunk);
        }
    }
}
export async function sendUserFacingError(ctx, error) {
    const message = getFriendlyErrorMessage(error);
    try {
        await ctx.reply(message, { reply_parameters: getReplyParameters(ctx) });
    }
    catch (telegramError) {
        logger.error({
            error: getErrorDetails(telegramError),
        }, "Failed to send user-facing error message");
    }
}
async function sendPlainText(ctx, text) {
    const chunks = splitTextForTelegram(text, 3900);
    for (const chunk of chunks) {
        await ctx.reply(chunk, { reply_parameters: getReplyParameters(ctx) });
    }
}
function getReplyParameters(ctx) {
    return ctx.message?.message_id ? { message_id: ctx.message.message_id } : undefined;
}
function getErrorDetails(error) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
        };
    }
    return { value: String(error) };
}
