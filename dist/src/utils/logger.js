const levelWeight = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};
const configuredLevel = normalizeLogLevel(process.env.LOG_LEVEL);
export const logger = {
    debug(meta, message) {
        writeLog("debug", meta, message);
    },
    info(meta, message) {
        writeLog("info", meta, message);
    },
    warn(meta, message) {
        writeLog("warn", meta, message);
    },
    error(meta, message) {
        writeLog("error", meta, message);
    },
};
function writeLog(level, meta, message) {
    if (levelWeight[level] < levelWeight[configuredLevel])
        return;
    const payload = typeof meta === "string"
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
function normalizeLogLevel(value) {
    if (value === "debug" || value === "info" || value === "warn" || value === "error") {
        return value;
    }
    return "info";
}
