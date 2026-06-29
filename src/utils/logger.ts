import type { LogLevel } from "../config/env.js";

type LogMeta = Record<string, unknown>;

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = normalizeLogLevel(process.env.LOG_LEVEL);

export const logger = {
  debug(meta: LogMeta | string, message?: string) {
    writeLog("debug", meta, message);
  },
  info(meta: LogMeta | string, message?: string) {
    writeLog("info", meta, message);
  },
  warn(meta: LogMeta | string, message?: string) {
    writeLog("warn", meta, message);
  },
  error(meta: LogMeta | string, message?: string) {
    writeLog("error", meta, message);
  },
};

function writeLog(level: LogLevel, meta: LogMeta | string, message?: string): void {
  if (levelWeight[level] < levelWeight[configuredLevel]) return;

  const payload =
    typeof meta === "string"
      ? { level, message: meta }
      : { level, message: message ?? "", ...meta };

  const line = JSON.stringify({
    time: new Date().toISOString(),
    service: "rms-telegram-bot",
    ...payload,
  });

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

function normalizeLogLevel(value: string | undefined): LogLevel {
  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }

  return "info";
}
