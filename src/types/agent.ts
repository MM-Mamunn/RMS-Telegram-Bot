export type AgentApiResponse =
  | string
  | null
  | {
      response?: unknown;
      answer?: unknown;
      message?: unknown;
      output?: unknown;
      [key: string]: unknown;
    };
