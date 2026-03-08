import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

import { settings } from "../config/settings.js";
import * as backboardService from "./backboardService.js";
import type { GeminiSignals } from "./backboardService.js";

const genAI = new GoogleGenerativeAI(settings.GEMINI_API_KEY);
const MODEL_CANDIDATES = [
  "gemini-2.5-flash"
];

let selectedModelName: string | undefined;

const WeightedSignalSchema = z.object({
  label: z.string(),
  strength: z.number().min(0).max(1).default(0.7),
});

const GeminiSignalsSchema = z.object({
  product_name: z.string(),
  product_category: z.string(),
  style_signals: z.array(WeightedSignalSchema),
  color_signals: z.array(WeightedSignalSchema),
  price_min: z.number().default(-1),
  price_max: z.number().default(-1),
  brand_guess: z.string(),
  brand_strength: z.number().min(0).max(1).default(0.7),
});

const FALLBACK_SIGNALS: GeminiSignals = {
  product_name: "unknown",
  product_category: "unknown",
  style_signals: [],
  color_signals: [],
  estimated_price_min: -1,
  estimated_price_max: -1,
  brand_guess: "unknown",
  brand_strength: 0,
};

const IDENTIFY_PROMPT = `You are a shopping assistant analyzing a screenshot from social media (Instagram or TikTok).

Your task: identify the PRIMARY PHYSICAL PRODUCT that a viewer would most likely want to purchase after seeing this post.

Focus on products like:
- Tools, gadgets, or devices being used or demonstrated (e.g. a milk frother, camera, blender)
- Clothing, shoes, or accessories being worn
- Home goods, furniture, or décor being featured
- Beauty or personal care products being applied

Do NOT identify:
- Food or drinks being prepared or consumed — instead identify the TOOL being used to make them
- Abstract moods, activities, or settings
- The background or non-product elements

For style_signals and color_signals, return objects with a "label" (short clean adjective, e.g. "minimalist", "retro") and a "strength" from 0.0-1.0 based on how clearly the product expresses that attribute. Do NOT include parenthetical explanations in labels.

For price_min and price_max, give your best estimate of the product's price range in USD as integers. Use -1 if unknown.

For brand_strength, rate 0.0-1.0 how confident you are in the brand identification.

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "product_name": string,
  "product_category": string,
  "style_signals": [{"label": string, "strength": number}],
  "color_signals": [{"label": string, "strength": number}],
  "price_min": number,
  "price_max": number,
  "brand_guess": string,
  "brand_strength": number
}
Page URL: {pageUrl}
Page title: {pageTitle}`;

const stripMarkdownFences = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  const noStart = trimmed.replace(/^```(?:json)?\s*/i, "");
  return noStart.replace(/\s*```$/, "").trim();
};

const isMissingModelError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const maybeStatus = "status" in error ? (error as { status?: unknown }).status : undefined;
  if (maybeStatus === 404) {
    return true;
  }

  const maybeMessage =
    "message" in error ? (error as { message?: unknown }).message : undefined;
  return typeof maybeMessage === "string" && maybeMessage.toLowerCase().includes("not found");
};

const generateWithModelFallback = async (
  parts: Array<{ inlineData: { mimeType: string; data: string } } | string>,
): Promise<string> => {
  const orderedCandidates = selectedModelName
    ? [selectedModelName, ...MODEL_CANDIDATES.filter((name) => name !== selectedModelName)]
    : MODEL_CANDIDATES;

  let lastError: unknown;

  for (const modelName of orderedCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(parts);

      // Inspect the response before calling .text() — if the response was
      // blocked by a safety filter the SDK sets finishReason to "SAFETY" and
      // leaves candidate.content undefined, causing .text() to throw
      // "Cannot read properties of undefined".
      const candidate = result.response.candidates?.[0];
      const finishReason = candidate?.finishReason ?? "UNKNOWN";
      if (finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
        const safetyRatings = JSON.stringify(candidate?.safetyRatings ?? []);
        const promptFeedback = JSON.stringify(result.response.promptFeedback ?? {});
        throw new Error(
          `[Gemini] Response blocked or empty — finishReason=${finishReason} safetyRatings=${safetyRatings} promptFeedback=${promptFeedback}`,
        );
      }

      if (selectedModelName !== modelName) {
        console.log(`[Gemini] Using model: ${modelName}`);
      }
      selectedModelName = modelName;
      return result.response.text();
    } catch (error) {
      lastError = error;
      if (isMissingModelError(error)) {
        console.warn(`[Gemini] Model unavailable, trying next: ${modelName}`);
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("No working Gemini model found");
};

export const identifyAndUpdate = async (
  screenshotB64: string,
  userId: string,
  pageUrl: string,
  pageTitle?: string,
): Promise<void> => {
  let signals: GeminiSignals = FALLBACK_SIGNALS;

  try {
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: screenshotB64,
      },
    };

    const prompt = IDENTIFY_PROMPT.replace("{pageUrl}", pageUrl).replace(
      "{pageTitle}",
      pageTitle ?? "unknown",
    );

    const rawText = await generateWithModelFallback([imagePart, prompt]);
    console.log("[Gemini] Raw response text:", rawText.slice(0, 500));

    const jsonText = stripMarkdownFences(rawText);
    console.log("[Gemini] Stripped JSON text:", jsonText.slice(0, 500));

    const parsedJson: unknown = JSON.parse(jsonText);
    const raw = GeminiSignalsSchema.parse(parsedJson);

    // Strip parenthetical qualifiers like "Black (frother)" → "Black"
    const cleanLabel = (s: string) => s.replace(/\s*\([^)]*\)/g, "").trim();
    signals = {
      product_name: raw.product_name,
      product_category: raw.product_category,
      estimated_price_min: raw.price_min,
      estimated_price_max: raw.price_max,
      brand_guess: raw.brand_guess,
      brand_strength: raw.brand_strength,
      style_signals: raw.style_signals
        .map((s) => ({ ...s, label: cleanLabel(s.label) }))
        .filter((s) => s.label),
      color_signals: raw.color_signals
        .map((s) => ({ ...s, label: cleanLabel(s.label) }))
        .filter((s) => s.label),
    };
    console.log("[Gemini] Parsed signals:", JSON.stringify(signals));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? (error.stack ?? "") : "";
    console.warn("[Gemini] identifyAndUpdate failed:", message);
    if (stack) console.warn("[Gemini] Stack:", stack.split("\n").slice(0, 4).join(" | "));
  }

  try {
    await backboardService.updateProfile(userId, signals);
  } catch (error) {
    console.warn("[Gemini] Backboard update failed", error);
  }
};
