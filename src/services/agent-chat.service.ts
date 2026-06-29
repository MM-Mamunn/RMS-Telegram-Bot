import { RmsAgentClient } from "../api/rms-agent.client.js";

export class AgentChatService {
  constructor(private readonly rmsAgentClient = new RmsAgentClient()) {}

  async answer(message: string): Promise<string> {
    return this.rmsAgentClient.ask(message);
  }
}
