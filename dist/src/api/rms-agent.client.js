import { env, getAgentApiUrl } from "../config/env.js";
import { AgentApiHttpError, AgentApiInvalidResponseError, AgentApiNetworkError, AgentApiTimeoutError, } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
export class RmsAgentClient {
    apiUrl = getAgentApiUrl();
    async ask(query) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), env.app.requestTimeoutMs);
        const startedAt = Date.now();
        logger.info({
            endpoint: env.rms.agentEndpoint,
            queryLength: query.length,
        }, "Sending RMS agent request");
        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ query }),
                signal: controller.signal,
            });
            const responseText = await response.text();
            const durationMs = Date.now() - startedAt;
            logger.info({
                endpoint: env.rms.agentEndpoint,
                status: response.status,
                durationMs,
            }, "Received RMS agent response");
            if (!response.ok) {
                throw new AgentApiHttpError(response.status, responseText);
            }
            return this.extractAgentAnswer(parseResponse(responseText));
        }
        catch (error) {
            if (error instanceof AgentApiHttpError || error instanceof AgentApiInvalidResponseError) {
                throw error;
            }
            if (error instanceof Error && error.name === "AbortError") {
                throw new AgentApiTimeoutError(env.app.requestTimeoutMs);
            }
            throw new AgentApiNetworkError(error);
        }
        finally {
            clearTimeout(timeout);
        }
    }
    extractAgentAnswer(data) {
        if (typeof data === "string")
            return normalizeAnswer(data);
        if (!data) {
            throw new AgentApiInvalidResponseError();
        }
        const knownValue = data.response ?? data.answer ?? data.message ?? data.output;
        if (typeof knownValue === "string") {
            return normalizeAnswer(knownValue);
        }
        return `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
    }
}
function parseResponse(responseText) {
    if (!responseText.trim()) {
        throw new AgentApiInvalidResponseError();
    }
    try {
        return JSON.parse(responseText);
    }
    catch {
        return responseText;
    }
}
function normalizeAnswer(value) {
    return value.trim() || "No response received.";
}
