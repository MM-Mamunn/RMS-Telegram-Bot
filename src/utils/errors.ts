export class AgentApiTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`RMS agent request timed out after ${timeoutMs}ms.`);
    this.name = "AgentApiTimeoutError";
  }
}

export class AgentApiNetworkError extends Error {
  constructor(cause: unknown) {
    super("RMS agent request failed before receiving a response.");
    this.name = "AgentApiNetworkError";
    this.cause = cause;
  }
}

export class AgentApiHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly responseBody: string,
  ) {
    super(`RMS agent API returned HTTP ${status}.`);
    this.name = "AgentApiHttpError";
  }
}

export class AgentApiInvalidResponseError extends Error {
  constructor() {
    super("RMS agent API returned an invalid response shape.");
    this.name = "AgentApiInvalidResponseError";
  }
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof AgentApiTimeoutError) {
    return "The RMS AI service is taking longer than expected. Please try again in a moment.";
  }

  if (error instanceof AgentApiNetworkError) {
    return "I cannot reach the RMS backend right now. Please check that the backend is running and try again.";
  }

  if (error instanceof AgentApiHttpError) {
    if (error.status === 401 || error.status === 403) {
      return "The RMS backend rejected this request. Please check the bot backend authentication settings.";
    }

    if (error.status >= 500) {
      return "The RMS AI service ran into a server error. Please try again shortly.";
    }

    return "The RMS backend could not process this request. Please try a shorter or clearer message.";
  }

  if (error instanceof AgentApiInvalidResponseError) {
    return "The RMS AI service returned a response I could not understand. Please try again.";
  }

  return "Something went wrong while preparing the AI response. Please try again.";
}
