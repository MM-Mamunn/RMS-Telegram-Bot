# RMS Telegram Bot

Independent Telegram bot client for the RMS Agentic AI API.

The bot lives outside the existing `BackEnd` and `FrontEnd` apps. It receives Telegram text messages, forwards them to the existing RMS endpoint, and returns the AI response to the Telegram user.

## Why This Architecture

The bot is a separate Node.js application because Telegram runtime concerns are different from the RMS backend and frontend. Keeping it independent makes it easier to deploy, scale, monitor, and expand without coupling Telegram-specific logic to the RMS API server.

Default deployment mode is long polling. It is simple, reliable, and appropriate for an always-on worker hosted on Render, Railway, a VPS, or Docker. Long polling is not a good fit for Vercel or most serverless platforms because the process must keep running to continuously receive updates.

Webhook support is included for environments that can expose a public HTTPS endpoint. Webhooks are the correct option for Vercel-style serverless deployment because Telegram pushes updates to an HTTP route instead of requiring a permanently running process.

## Current Feature Set

- grammY based Telegram bot.
- TypeScript and modern ES modules.
- `/start`, `/help`, and `/about` commands.
- Text message forwarding to `POST /api/agentcalltg`.
- No bot-side JWT or backend auth header handling.
- Markdown-to-Telegram formatting with plain-text fallback.
- Long response splitting.
- Friendly user-facing errors.
- Structured JSON logs.
- Long polling, webhook server, and Vercel webhook entrypoint.

## Project Structure

```text
telegram-bot/
  api/
    webhook.ts                 Vercel serverless webhook handler
  src/
    api/
      rms-agent.client.ts      HTTP client for the RMS Agentic AI endpoint
    commands/
      index.ts                 Telegram command definitions and handlers
    config/
      env.ts                   Environment loading and validation
    handlers/
      message.handler.ts       Text and non-text Telegram message handlers
    middleware/
      error.middleware.ts      Global grammY error logging
      logging.middleware.ts    Incoming update logging
    scripts/
      set-webhook.ts           Registers the Telegram webhook URL
      delete-webhook.ts        Deletes the Telegram webhook
    services/
      agent-chat.service.ts    Bot-facing AI chat service
      response.service.ts      Telegram response formatting and fallback
    types/
      agent.ts                 RMS agent response types
      bot-context.ts           grammY context type
    utils/
      chunk-text.ts            Long message splitting
      errors.ts                API error types and user-friendly messages
      logger.ts                Structured logger
      markdown.ts              MarkdownV2 formatter
    webhook/
      server.ts                Standalone webhook HTTP server
    bot.ts                     Bot composition
    index.ts                   Long polling entrypoint
  .env.example                 Documented environment variables
  public/
    index.html                 Minimal Vercel static output placeholder
  Dockerfile                   Container deployment
  package.json                 Scripts and dependencies
  tsconfig.json                TypeScript configuration
  vercel.json                  Vercel webhook configuration
```

## Setup

1. Create a bot with BotFather.
2. Copy the generated bot token.
3. Install dependencies.

```bash
cd telegram-bot
npm install
```

4. Create local environment variables.

```bash
cp .env.example .env
```

5. Update `.env`.

```env
TELEGRAM_BOT_TOKEN=123456789:your-bot-token
RMS_BACKEND_URL=http://localhost:3000
RMS_AGENT_ENDPOINT=/api/agentcalltg
```

The Telegram bot endpoint is intentionally public, so the bot does not send JWT tokens, authorization headers, or user login data.

6. Run locally with long polling.

```bash
npm run dev
```

For production polling:

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Yes | None | Token from BotFather. |
| `RMS_BACKEND_URL` | Yes | None | Base URL of the RMS backend, such as `http://localhost:3000`. |
| `RMS_AGENT_ENDPOINT` | No | `/api/agentcalltg` | Public RMS Telegram AI endpoint. |
| `NODE_ENV` | No | `development` | Runtime environment label. |
| `PORT` | No | `8080` | HTTP port for standalone webhook mode. |
| `REQUEST_TIMEOUT_MS` | No | `30000` | Timeout for RMS backend calls. |
| `MAX_USER_MESSAGE_LENGTH` | No | `2000` | Maximum Telegram text length forwarded to RMS. |
| `LOG_LEVEL` | No | `info` | One of `debug`, `info`, `warn`, `error`. |
| `LOG_MESSAGE_CONTENT` | No | `false` | Set to `true` only if message previews are acceptable in logs. |
| `BOT_WEBHOOK_PATH` | No | `/api/webhook` | Webhook route path. |
| `BOT_WEBHOOK_URL` | Webhook setup only | Empty | Public HTTPS origin used by `npm run webhook:set`. |
| `BOT_WEBHOOK_SECRET` | No | Empty | Optional Telegram webhook secret token. |

## API Integration

The bot sends:

```http
POST /api/agentcalltg
Content-Type: application/json

{
  "query": "user message"
}
```

It accepts these response shapes:

```json
"Plain markdown string"
```

```json
{
  "response": "Markdown response"
}
```

It also checks `answer`, `message`, and `output`. Unknown JSON objects are returned as formatted JSON so invalid assumptions do not hide backend behavior.

## Markdown Behavior

Telegram does not support every Markdown feature. The bot converts common Markdown into Telegram MarkdownV2:

- headings become bold lines,
- lists remain readable,
- inline code and code blocks are preserved,
- links are preserved when they use `http` or `https`,
- bold, italic, and strikethrough are preserved where possible.

If Telegram rejects the formatted response, the bot retries with plain text. Long responses are split into readable chunks before sending.

## Commands

- `/start` starts the bot and explains the basic workflow.
- `/help` shows usage guidance.
- `/about` explains that the bot is an independent RMS AI client.

All other normal text messages are forwarded to the RMS backend.

## Deployment

### Recommended: Long Polling

Use long polling when the bot runs as an always-on process. This is the simplest deployment for Render, Railway, a VPS, or Docker.

Build and run:

```bash
npm install
npm run build
npm start
```

Docker:

```bash
docker build -t rms-telegram-bot .
docker run --env-file .env rms-telegram-bot
```

Long polling is not recommended on Vercel because Vercel functions are request-based and short-lived. A polling bot needs a continuously running process, so Telegram updates would stop when the function stops.

### Webhook Deployment

Use webhooks when the deployment platform gives the bot a stable public HTTPS endpoint. Telegram sends every update to that endpoint.

For a standalone server:

```bash
npm run build
npm run start:webhook
```

Then register the webhook:

```bash
BOT_WEBHOOK_URL=https://your-domain.example npm run webhook:set
```

To remove it:

```bash
npm run webhook:delete
```

### Vercel Deployment

Vercel is only appropriate for webhook mode.

1. Deploy the `telegram-bot` directory as the Vercel project root.
2. Add environment variables in Vercel:
   - `TELEGRAM_BOT_TOKEN`
   - `RMS_BACKEND_URL`
   - `RMS_AGENT_ENDPOINT`
   - `BOT_WEBHOOK_SECRET` if used
3. Deploy the project.
4. Set the webhook after deployment:

```bash
BOT_WEBHOOK_URL=https://your-vercel-app.vercel.app npm run webhook:set
```

5. Send `/start` to the Telegram bot.
6. Check Vercel function logs if Telegram does not respond.

Common Vercel issues:

- Webhook URL must be HTTPS.
- Environment variables must exist in the Vercel project, not only locally.
- If `BOT_WEBHOOK_SECRET` is set locally when registering the webhook, it must also be set in Vercel.
- Do not use `npm start` on Vercel for this bot; Vercel should call `api/webhook.ts`.

## Development Guide

### Add a Command

Add the command in `src/commands/index.ts`, then include it in `BOT_COMMANDS` so Telegram can show it in the command menu.

### Add Middleware

Create a file under `src/middleware`, then register it in `src/bot.ts` before handlers that depend on it.

### Add an API Integration

Create a new client under `src/api`, wrap it with a service under `src/services`, and call that service from a handler or command.

### Add Future RMS Features

Good future modules include:

- routine lookup,
- personal routine management,
- notifications,
- announcements,
- resource search,
- authentication,
- admin commands,
- scheduled jobs,
- inline keyboards,
- interactive menus.

Keep backend business logic in RMS backend APIs. The bot should remain a Telegram client, not a duplicate RMS backend.

## Troubleshooting

### Invalid bot token

Check `TELEGRAM_BOT_TOKEN`. Generate a new token in BotFather if needed.

### Backend connection failures

Confirm `RMS_BACKEND_URL` is reachable from the bot host. Localhost only works when the backend and bot run on the same machine or container network.

### Timeout problems

Increase `REQUEST_TIMEOUT_MS` if AI responses are slow. Also check backend logs for agent errors.

### Telegram rejects Markdown

The bot automatically retries as plain text. If this happens often, inspect the AI response for unusual Markdown or unsupported nested formatting.

### Webhook does not receive updates

Confirm the webhook URL is public HTTPS, the path matches `BOT_WEBHOOK_PATH`, and the secret token matches in both Telegram and the deployed app.

### Bot works locally but not on Vercel

Make sure the project root is `telegram-bot`, all environment variables are set in Vercel, and the Telegram webhook points to the deployed Vercel domain.
