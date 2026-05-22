import { ProviderName } from "../types.js";

export type ParsedCommand = {
  intent: "search" | "select" | "add" | "remove" | "checkout" | "clear" | "help";
  query: string;
  quantity: number;
  providerPreference: ProviderName | "best";
};

const numberWords: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5
};

export function parseCommand(command: string): ParsedCommand {
  const normalized = command.trim().toLowerCase();
  const quantityMatch = normalized.match(/\b(\d+|one|two|three|four|five)\b/);
  const quantity = quantityMatch ? Number(numberWords[quantityMatch[1]] ?? quantityMatch[1]) : 1;
  const providerPreference = normalized.includes("swiggy")
    ? "swiggy"
    : normalized.includes("zomato")
      ? "zomato"
      : "best";

  if (/\b(checkout|place|order now|confirm)\b/.test(normalized)) {
    return { intent: "checkout", query: normalized, quantity, providerPreference };
  }

  if (/\b(clear|reset|start over)\b/.test(normalized)) {
    return { intent: "clear", query: normalized, quantity, providerPreference };
  }

  if (/\b(remove|delete)\b/.test(normalized)) {
    return { intent: "remove", query: cleanupFoodQuery(normalized), quantity, providerPreference };
  }

  if (/\b(add|put|want|order|get me|make it)\b/.test(normalized)) {
    return { intent: "add", query: cleanupFoodQuery(normalized), quantity, providerPreference };
  }

  if (/\b(select|choose|from)\b/.test(normalized)) {
    return { intent: "select", query: cleanupFoodQuery(normalized), quantity, providerPreference };
  }

  if (/\b(help|examples|commands)\b/.test(normalized)) {
    return { intent: "help", query: normalized, quantity, providerPreference };
  }

  return { intent: "search", query: cleanupFoodQuery(normalized), quantity, providerPreference };
}

function cleanupFoodQuery(value: string): string {
  return value
    .replace(/\b(on|from|via|using|swiggy|zomato|please|add|put|want|order|get me|select|choose|remove|delete)\b/g, " ")
    .replace(/\b(one|two|three|four|five|\d+)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
