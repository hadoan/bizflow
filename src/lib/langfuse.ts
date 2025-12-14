import { Langfuse } from 'langfuse';

/**
 * Langfuse client for observability and tracing
 * Logs all LLM calls, token usage, and performance metrics
 */
export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
  enabled: Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY),
});

/**
 * Check if Langfuse is enabled
 */
export function isLangfuseEnabled(): boolean {
  return Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);
}

/**
 * Flush pending events (call before serverless function exit)
 */
export async function flushLangfuse(): Promise<void> {
  if (isLangfuseEnabled()) {
    await langfuse.flushAsync();
  }
}
