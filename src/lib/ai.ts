// AI client wrapper for Bizflow
// Supports OpenAI and Anthropic, with graceful fallback

export type AIProvider = "openai" | "anthropic";

export interface AIClientConfig {
  provider: AIProvider;
  apiKey?: string;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionParams {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AICompletionResponse {
  content: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class AIClient {
  private provider: AIProvider;
  private apiKey?: string;
  private isConfigured: boolean;

  constructor(config?: AIClientConfig) {
    this.provider = config?.provider ?? (process.env.AI_PROVIDER as AIProvider) ?? "openai";
    this.apiKey = config?.apiKey ?? process.env.AI_API_KEY;
    this.isConfigured = !!this.apiKey;
  }

  async complete(params: AICompletionParams): Promise<AICompletionResponse> {
    if (!this.isConfigured) {
      console.warn("AI client not configured, returning mock response");
      return this.getMockResponse(params);
    }

    try {
      if (this.provider === "openai") {
        return await this.completeOpenAI(params);
      } else if (this.provider === "anthropic") {
        return await this.completeAnthropic(params);
      }
      throw new Error(`Unsupported AI provider: ${this.provider}`);
    } catch (error) {
      console.error("AI completion error:", error);
      return this.getMockResponse(params);
    }
  }

  private async completeOpenAI(params: AICompletionParams): Promise<AICompletionResponse> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model ?? "gpt-4o-mini",
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      finishReason: data.choices[0].finish_reason,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }

  private async completeAnthropic(params: AICompletionParams): Promise<AICompletionResponse> {
    const systemMessage = params.messages.find((m) => m.role === "system");
    const userMessages = params.messages.filter((m) => m.role !== "system");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: params.model ?? "claude-3-5-sonnet-20241022",
        system: systemMessage?.content,
        messages: userMessages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      finishReason: data.stop_reason,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    };
  }

  private getMockResponse(_params: AICompletionParams): AICompletionResponse {
    return {
      content: "Mock AI response (API key not configured)",
      finishReason: "mock",
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }
}

export const ai = new AIClient();

export async function generateCompletion(
  params: AICompletionParams
): Promise<AICompletionResponse> {
  return ai.complete(params);
}
