import type { BotBlueprint, Language, Text } from "./types";
import { dramaHook } from "../../bots/drama-hook";
import { viralRadar } from "../../bots/viral-radar";

const registry = new Map<string, BotBlueprint>();

for (const bot of [dramaHook, viralRadar]) {
  registry.set(bot.id, bot);
}

export function getBot(id: string): BotBlueprint | undefined {
  return registry.get(id);
}

export function normalizeLanguage(value?: string | null): Language {
  const language = value?.trim().toLowerCase().split(/[-_,;]/)[0];
  return language === "id" || language === "zh" ? language : "en";
}

export function localizeText(text: Text, language: Language): string {
  return typeof text === "string" ? text : text[language];
}

export function listBots(requestedLanguage?: string | null): Array<{
  id: string;
  name: string;
  description: string;
  skills: string[];
}> {
  const language = normalizeLanguage(requestedLanguage);
  return [...registry.values()].map((b) => ({
    id: b.id,
    name: b.name,
    description: localizeText(b.description, language),
    skills: b.skills.map((s) => s.id),
  }));
}

export function getAgentCards(requestedLanguage?: string | null) {
  const language = normalizeLanguage(requestedLanguage);
  const cards: Record<string, unknown> = {};
  for (const bot of registry.values()) {
    cards[bot.id] = {
      ...bot.agentCard,
      description: localizeText(bot.agentCard.description, language),
      skills: bot.agentCard.skills.map((skill) => ({
        ...skill,
        description: localizeText(skill.description, language),
      })),
    };
  }
  return cards;
}
