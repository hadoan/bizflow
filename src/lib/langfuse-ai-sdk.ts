/**
 * Langfuse integration with AI SDK
 * Wraps AI SDK functions with automatic Langfuse tracing
 *
 * Note: Main tracing is handled in the route handler.
 * This file provides helper utilities for advanced use cases.
 */

import { isLangfuseEnabled, langfuse } from './langfuse';

/**
 * Helper to create a Langfuse trace for individual tool calls
 * (Currently not used - tool calls are captured in the main generation span)
 */
export function createToolTrace(toolName: string, params: Record<string, unknown>) {
  if (!isLangfuseEnabled()) {
    return null;
  }

  const trace = langfuse.trace({
    name: `tool-${toolName}`,
    metadata: {
      tool: toolName,
      params,
    },
  });

  const span = trace.span({
    name: toolName,
    input: params,
  });

  return {
    span,
    end: async (output: unknown, error?: Error) => {
      span.end({
        output: error ? { error: error.message } : output,
        metadata: {
          success: !error,
        },
      });
      await langfuse.flushAsync();
    },
  };
}
