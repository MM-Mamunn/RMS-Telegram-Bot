import type { AgentApiResponse } from "../types/agent.js";
import { env, getAgentApiUrl } from "../config/env.js";
import {
  AgentApiHttpError,
  AgentApiInvalidResponseError,
  AgentApiNetworkError,
  AgentApiTimeoutError,
} from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export class RmsAgentClient {
  private readonly apiUrl = getAgentApiUrl();

  async ask(query: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.app.requestTimeoutMs);
    const startedAt = Date.now();

    logger.info(
      {
        endpoint: env.rms.agentEndpoint,
        queryLength: query.length,
      },
      "Sending RMS agent request",
    );

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

      logger.info(
        {
          endpoint: env.rms.agentEndpoint,
          status: response.status,
          durationMs,
        },
        "Received RMS agent response",
      );

      if (!response.ok) {
        throw new AgentApiHttpError(response.status, responseText);
      }

      return this.extractAgentAnswer(parseResponse(responseText));
    } catch (error) {
      if (error instanceof AgentApiHttpError || error instanceof AgentApiInvalidResponseError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new AgentApiTimeoutError(env.app.requestTimeoutMs);
      }

      throw new AgentApiNetworkError(error);
    } finally {
      clearTimeout(timeout);
    }
  }
  private extractAgentAnswer(data: AgentApiResponse): string {
    if (typeof data === "string") return normalizeAnswer(data);

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

function parseResponse(responseText: string): AgentApiResponse {
  if (!responseText.trim()) {
    throw new AgentApiInvalidResponseError();
  }

  try {
    return JSON.parse(responseText) as AgentApiResponse;
  } catch {
    return responseText;
  }
}

function normalizeAnswer(value: string): string {
  return value.trim() || "No response received.";
}
