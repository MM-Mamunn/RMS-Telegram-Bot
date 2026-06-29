import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

export type LogLevel = "debug" | "info" | "warn" | "error";

const DEFAULT_AGENT_ENDPOINT = "/api/agentcalltg";
const DEFAULT_WEBHOOK_PATH = "/api/webhook";

loadEnvironmentFiles();

export const env = {
  app: {
    nodeEnv: readString("NODE_ENV", "development"),
    port: readInteger("PORT", 8080, { min: 1, max: 65535 }),
    requestTimeoutMs: readInteger("REQUEST_TIMEOUT_MS", 60000, {
      min: 1000,
      max: 120000,
    }),
    maxUserMessageLength: readInteger("MAX_USER_MESSAGE_LENGTH", 2000, {
      min: 1,
      max: 4000,
    }),
    logLevel: readLogLevel("LOG_LEVEL", "info"),
    logMessageContent: readBoolean("LOG_MESSAGE_CONTENT", false),
  },
  telegram: {
    token: readRequiredString("TELEGRAM_BOT_TOKEN"),
    webhookPath: normalizePath(readString("BOT_WEBHOOK_PATH", DEFAULT_WEBHOOK_PATH)),
    webhookUrl: readOptionalString("BOT_WEBHOOK_URL"),
    webhookSecret: readOptionalString("BOT_WEBHOOK_SECRET"),
    allowedUpdates: ["message"] as const,
  },
  rms: {
    backendUrl: readUrl("RMS_BACKEND_URL"),
    agentEndpoint: normalizePath(readString("RMS_AGENT_ENDPOINT", DEFAULT_AGENT_ENDPOINT)),
  },
} as const;

export function getAgentApiUrl(): string {
  return new URL(env.rms.agentEndpoint, env.rms.backendUrl).toString();
}

export function getWebhookTargetUrl(): string {
  if (!env.telegram.webhookUrl) {
    throw new Error("BOT_WEBHOOK_URL is required when setting a Telegram webhook.");
  }

  return new URL(env.telegram.webhookPath, env.telegram.webhookUrl).toString();
}

function readRequiredString(name: string): string {
  const value = readOptionalString(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalString(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readString(name: string, fallback: string): string {
  return readOptionalString(name) ?? fallback;
}

function readUrl(name: string): string {
  const value = readRequiredString(name);

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("URL must use http or https.");
    }

    return removeTrailingSlash(url.toString());
  } catch (error) {
    throw new Error(`${name} must be a valid http or https URL.`);
  }
}

function readInteger(
  name: string,
  fallback: number,
  options: { min: number; max: number },
): number {
  const raw = readOptionalString(name);
  const value = raw ? Number(raw) : fallback;

  if (!Number.isInteger(value) || value < options.min || value > options.max) {
    throw new Error(`${name} must be an integer between ${options.min} and ${options.max}.`);
  }

  return value;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const raw = readOptionalString(name);

  if (!raw) return fallback;
  if (["1", "true", "yes", "on"].includes(raw.toLowerCase())) return true;
  if (["0", "false", "no", "off"].includes(raw.toLowerCase())) return false;

  throw new Error(`${name} must be true or false.`);
}

function readLogLevel(name: string, fallback: LogLevel): LogLevel {
  const value = readString(name, fallback) as LogLevel;
  const allowed: LogLevel[] = ["debug", "info", "warn", "error"];

  if (!allowed.includes(value)) {
    throw new Error(`${name} must be one of: ${allowed.join(", ")}.`);
  }

  return value;
}

function normalizePath(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function removeTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function loadEnvironmentFiles(): void {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidatePaths = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "..", ".env"),
    resolve(moduleDir, "../../.env"),
    resolve(moduleDir, "../../../.env"),
    resolve(moduleDir, "../../../../.env"),
  ];

  for (const envPath of uniquePaths(candidatePaths)) {
    if (existsSync(envPath)) {
      config({ path: envPath });
    }
  }
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths)];
}
