import { webhookCallback } from "grammy";
import { bot } from "../src/bot.js";
import { env } from "../src/config/env.js";
const handleUpdate = webhookCallback(bot, "http");
export default async function handler(request, response) {
    if (request.method !== "POST") {
        response.writeHead(405, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Method not allowed" }));
        return;
    }
    if (!hasValidSecret(request)) {
        response.writeHead(401, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Unauthorized" }));
        return;
    }
    await handleUpdate(request, response);
}
function hasValidSecret(request) {
    if (!env.telegram.webhookSecret)
        return true;
    const header = request.headers["x-telegram-bot-api-secret-token"];
    return header === env.telegram.webhookSecret;
}
