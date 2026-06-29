import { RmsAgentClient } from "../api/rms-agent.client.js";
export class AgentChatService {
    rmsAgentClient;
    constructor(rmsAgentClient = new RmsAgentClient()) {
        this.rmsAgentClient = rmsAgentClient;
    }
    async answer(message) {
        return this.rmsAgentClient.ask(message);
    }
}
