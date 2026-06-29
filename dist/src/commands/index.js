export const BOT_COMMANDS = [
    { command: "start", description: "Start the RMS assistant" },
    { command: "help", description: "Show usage help" },
    { command: "about", description: "About this bot" },
];
export function registerCommands(bot) {
    bot.command("start", async (ctx) => {
        await ctx.reply([
            "Welcome to the RMS Assistant.",
            "",
            "Send me a text question and I will forward it to the RMS AI service.",
            "Try asking about routines, courses, resources, or RMS information.",
        ].join("\n"));
    });
    bot.command("help", async (ctx) => {
        await ctx.reply([
            "How to use this bot:",
            "",
            "- Send one clear text question at a time.",
            "- Use /start to restart the conversation.",
            "- Use /about to see what powers this bot.",
            "",
            "The bot does not store AI logic. It forwards your question to the RMS backend and returns the response.",
        ].join("\n"));
    });
    bot.command("about", async (ctx) => {
        await ctx.reply([
            "RMS Telegram Bot",
            "",
            "This is an independent Telegram client for the RMS Agentic AI API.",
            "It uses grammY, Node.js, and the existing RMS backend endpoint.",
        ].join("\n"));
    });
}
