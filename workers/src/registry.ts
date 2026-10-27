import type { BotBlueprint } from "./types";
import { dramaHook } from "../../bots/drama-hook";
import { viralRadar } from "../../bots/viral-radar";
import { dmFunnel } from "../../bots/dm-funnel";

const registry = new Map<string, BotBlueprint>();

for (const bot of [dramaHook, viralRadar, dmFunnel]) {
  registry.set(bot.id, bot);
}

export function getBot(id: string): BotBlueprint | undefined {
  return registry.get(id);
}

export function listBots(): Array<{
  id: string;
  name: string;
  description: string;
  skills: string[];
}> {
  return [...registry.values()].map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    skills: b.skills.map((s) => s.id),
  }));
}
