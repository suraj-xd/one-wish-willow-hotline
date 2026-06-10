import { z } from "zod";

const DEFAULT_SITE_URL = "https://www.onewishwillow.help";
const AI_PROVIDERS = ["deepseek", "openrouter"];

const providerSchema = z.enum(AI_PROVIDERS);

function optionalEnv(name) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function normalizeUrl(value) {
  return z.string().url().parse(value).replace(/\/$/, "");
}

function cleanApiKey(raw) {
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/^["']+|["']+$/g, "");
  const start = trimmed.indexOf("sk-");
  return start > 0 ? trimmed.slice(start) : trimmed;
}

export const env = {
  NEXT_PUBLIC_SITE_URL: normalizeUrl(
    optionalEnv("NEXT_PUBLIC_SITE_URL") ?? DEFAULT_SITE_URL,
  ),
  OPENROUTER_MODEL:
    optionalEnv("OPENROUTER_MODEL") ?? "deepseek/deepseek-v4-flash",
  DEEPSEEK_MODEL: optionalEnv("DEEPSEEK_MODEL") ?? "deepseek-v4-flash",
};

export function getUpstashConfig() {
  const url = optionalEnv("UPSTASH_REDIS_REST_URL");
  const token = optionalEnv("UPSTASH_REDIS_REST_TOKEN");

  if (!url && !token) return undefined;
  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set together",
    );
  }

  return {
    url: normalizeUrl(url),
    token,
  };
}

export function getAIProviderName() {
  return providerSchema.parse(
    (optionalEnv("AI_PROVIDER") ?? optionalEnv("OWW_AI_PROVIDER") ?? "openrouter")
      .toLowerCase(),
  );
}

export function getAIProviderConfig() {
  const provider = getAIProviderName();

  if (provider === "deepseek") {
    const apiKey = cleanApiKey(optionalEnv("DEEPSEEK_API_KEY"));
    if (!apiKey) {
      throw new Error("AI_PROVIDER=deepseek requires DEEPSEEK_API_KEY");
    }

    return {
      provider,
      apiKey,
      model: env.DEEPSEEK_MODEL,
    };
  }

  const apiKey = cleanApiKey(optionalEnv("OPENROUTER_API_KEY"));
  if (!apiKey) {
    throw new Error("AI_PROVIDER=openrouter requires OPENROUTER_API_KEY");
  }

  return {
    provider,
    apiKey,
    model: env.OPENROUTER_MODEL,
  };
}

export { AI_PROVIDERS };
