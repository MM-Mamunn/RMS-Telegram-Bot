import type { IncomingMessage, ServerResponse } from "node:http";
import { waitUntil } from "@vercel/functions";
import type { Update } from "grammy/types";
import { bot } from "../src/bot.js";
import { logger } from "../src/utils/logger.js";

let botInitPromise: Promise<void> | undefined;

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "POST") {
    response.writeHead(405, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  let update: Update;

  try {
    update = await readTelegramUpdate(request);
  } catch (error) {
    logger.warn(
      {
        error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
      },
      "Rejected invalid Telegram webhook request",
    );
    response.writeHead(400, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Invalid Telegram update" }));
    return;
  }

  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ ok: true }));

  waitUntil(processTelegramUpdate(update));
}

async function processTelegramUpdate(update: Update): Promise<void> {
  try {
    await ensureBotInitialized();
    await bot.handleUpdate(update);
  } catch (error) {
    logger.error(
      {
        updateId: update.update_id,
        error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
      },
      "Failed to process Telegram webhook update",
    );
  }
}

function ensureBotInitialized(): Promise<void> {
  botInitPromise ??= bot.init().catch((error) => {
    botInitPromise = undefined;
    throw error;
  });

  return botInitPromise;
}

async function readTelegramUpdate(request: IncomingMessage): Promise<Update> {
  const body = await readRequestBody(request);
  const parsed = JSON.parse(body) as Partial<Update>;

  if (!Number.isInteger(parsed.update_id)) {
    throw new Error("Telegram update is missing update_id.");
  }

  return parsed as Update;
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}
