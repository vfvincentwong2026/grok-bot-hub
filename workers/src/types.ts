export type Language = "en" | "id" | "zh";
export type LocalizedText = Record<Language, string>;
export type Text = string | LocalizedText;

export interface BotSkill {
  id: string;
  name: string;
  description: Text;
  inputSchema: Record<string, unknown>;
}

export interface AgentCard {
  name: string;
  description: Text;
  version: string;
  skills: Array<{
    id: string;
    name: string;
    description: Text;
    tags?: string[];
    inputSchema?: Record<string, unknown>;
  }>;
}

export interface BotBlueprint {
  id: string;
  name: string;
  description: Text;
  agentCard: AgentCard;
  skills: BotSkill[];
  buildPrompt: (payload: Record<string, unknown>) => {
    system: string;
    user: string;
  };
}
