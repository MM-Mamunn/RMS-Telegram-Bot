import { createServer } from "node:http";
import { webhookCallback } from "grammy";
import { bot, configureTelegramCommands } from "../bot.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
const handleWebhook = webhookCallback(bot, "http");
await configureTelegramCommands();
const server = createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/health") {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: true }));
        return;
    }
    if (request.method !== "POST" || request.url !== env.telegram.webhookPath) {
        response.writeHead(404, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Not found" }));
        return;
    }
    if (!hasValidSecret(request)) {
        response.writeHead(401, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Unauthorized" }));
        return;
    }
    await handleWebhook(request, response);
});
server.listen(env.app.port, () => {
    logger.info({
        port: env.app.port,
        webhookPath: env.telegram.webhookPath,
    }, "RMS Telegram webhook server started");
});
function hasValidSecret(request) {
    if (!env.telegram.webhookSecret)
        return true;
    const header = request.headers["x-telegram-bot-api-secret-token"];
    return header === env.telegram.webhookSecret;
}
process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
function shutdown(signal) {
    logger.info({ signal }, "Stopping RMS Telegram webhook server");
    server.close(() => process.exit(0));
}
