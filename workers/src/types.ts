export interface AgentCard {
  name: string;
  description: string;
  version: string;
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags?: string[];
    inputSchema?: Record<string, unknown>;
  }>;
}

export interface BotBlueprint {
  id: string;
  name: string;
  description: string;
  agentCard: AgentCard;          // 新增：对齐 A2A agentCard
  skills: BotSkill[];
  buildPrompt: (payload: Record<string, unknown>) => {
    system: string;
    user: string;
  };
}
