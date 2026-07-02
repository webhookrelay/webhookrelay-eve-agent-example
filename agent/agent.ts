import { createAnthropic } from "@ai-sdk/anthropic";
import { defineAgent } from "eve";

// Any AI SDK provider works here. This example calls Claude through Lightning
// AI's Anthropic-compatible Messages API — swap in @ai-sdk/openai, a local
// Ollama endpoint, or the Vercel AI Gateway if that's what you have.
// LIGHTNING_BASE_URL must be the root that gets "/messages" appended to it
// (default https://lightning.ai/v1 -> https://lightning.ai/v1/messages).
const lightning = createAnthropic({
  baseURL: process.env.LIGHTNING_BASE_URL ?? "https://lightning.ai/v1",
  apiKey: process.env.LIGHTNING_API_KEY ?? "",
});

export default defineAgent({
  model: lightning(process.env.LIGHTNING_MODEL ?? "claude-sonnet-4-6"),
});
