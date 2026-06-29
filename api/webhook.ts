import type { IncomingMessage, ServerResponse } from "node:http";
import { webhookCallback } from "grammy";
import { bot } from "../src/bot.js";

const handleUpdate = webhookCallback(bot, "http");

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "POST") {
    response.writeHead(405, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  await handleUpdate(request, response);
}
