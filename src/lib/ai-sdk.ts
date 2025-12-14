// AI SDK provider configuration for Bizflow
// Supports OpenAI and Anthropic with automatic fallback

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export type AIProvider = 'openai' | 'anthropic';

const provider = (process.env.AI_PROVIDER as AIProvider) || 'openai';
const apiKey = process.env.AI_API_KEY;
const anthropicModel = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';

// Initialize providers
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || apiKey,
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || apiKey,
});

// Export the configured provider
export const ai = provider === 'anthropic' ? anthropic : openai;

// Default model selection
export function getDefaultModel() {
  if (provider === 'anthropic') {
    // Use env override or a broadly available Anthropic model
    return anthropic(anthropicModel);
  }
  return openai('gpt-4o-mini');
}

export function getVisionModel() {
  if (provider === 'anthropic') {
    return anthropic(anthropicModel);
  }
  return openai('gpt-4o');
}
