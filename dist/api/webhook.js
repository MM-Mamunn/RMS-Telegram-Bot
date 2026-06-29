import { webhookCallback } from "grammy";
import { bot } from "../src/bot.js";
const handleUpdate = webhookCallback(bot, "http");
export default async function handler(request, response) {
    if (request.method !== "POST") {
        response.writeHead(405, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Method not allowed" }));
        return;
    }
    await handleUpdate(request, response);
}
